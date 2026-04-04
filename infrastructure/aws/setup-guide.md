# AWS Setup Guide — Cadence

Complete walkthrough to deploy Cadence to AWS from scratch.

## Prerequisites

- AWS account (create at [aws.amazon.com](https://aws.amazon.com))
- AWS CLI installed: `brew install awscli`
- Docker installed and running
- GitHub repository with your Cadence code

---

## Step 1: Create AWS Account & IAM User

### 1a. Create a deployment IAM user

```bash
# Create user
aws iam create-user --user-name cadence-deploy

# Attach required policies
aws iam attach-user-policy \
  --user-name cadence-deploy \
  --policy-arn arn:aws:iam::aws:policy/AmazonECS_FullAccess

aws iam attach-user-policy \
  --user-name cadence-deploy \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryFullAccess

aws iam attach-user-policy \
  --user-name cadence-deploy \
  --policy-arn arn:aws:iam::aws:policy/SecretsManagerReadWrite

# Create access keys (save these!)
aws iam create-access-key --user-name cadence-deploy
```

Save `AccessKeyId` and `SecretAccessKey` — you'll add them to GitHub Secrets.

### 1b. Configure local AWS CLI

```bash
aws configure
# AWS Access Key ID: (your key)
# AWS Secret Access Key: (your secret)
# Default region name: us-east-1
# Default output format: json
```

---

## Step 2: Set Up ECR Repositories

ECR (Elastic Container Registry) stores your Docker images.

```bash
# Create backend repo
aws ecr create-repository \
  --repository-name cadence-backend \
  --image-scanning-configuration scanOnPush=true \
  --region us-east-1

# Create frontend repo
aws ecr create-repository \
  --repository-name cadence-frontend \
  --image-scanning-configuration scanOnPush=true \
  --region us-east-1
```

Note the `repositoryUri` from each output — format: `ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/cadence-backend`

### Test pushing an image locally

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build and push backend
cd backend
docker build -t cadence-backend .
docker tag cadence-backend:latest ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/cadence-backend:latest
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/cadence-backend:latest
```

---

## Step 3: Create ECS Cluster

```bash
aws ecs create-cluster \
  --cluster-name cadence-cluster \
  --capacity-providers FARGATE FARGATE_SPOT \
  --region us-east-1
```

### Create the ECS Task Execution Role

```bash
# Create role
aws iam create-role \
  --role-name ecsTaskExecutionRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ecs-tasks.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# Attach managed policy
aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Allow reading secrets
aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/SecretsManagerReadWrite
```

### Register the task definition

Edit `infrastructure/aws/ecs-task-definition.json`:
- Replace `ACCOUNT_ID` with your AWS account ID
- Replace `REGION` with your region (e.g., `us-east-1`)

```bash
aws ecs register-task-definition \
  --cli-input-json file://infrastructure/aws/ecs-task-definition.json
```

### Create ECS Service

```bash
aws ecs create-service \
  --cluster cadence-cluster \
  --service-name cadence-service \
  --task-definition cadence-task \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={
    subnets=[subnet-xxx,subnet-yyy],
    securityGroups=[sg-xxx],
    assignPublicIp=ENABLED
  }"
```

---

## Step 4: Set Up RDS PostgreSQL

See [rds-setup.md](./rds-setup.md) for full details.

Quick summary:
1. Create RDS PostgreSQL 16 instance (`db.t3.small`, Multi-AZ for prod)
2. Configure security group to allow ECS → RDS on port 5432
3. Run `npx prisma migrate deploy` to initialize schema

---

## Step 5: Configure Secrets in AWS Secrets Manager

```bash
# Store each secret individually
aws secretsmanager create-secret \
  --name cadence/DATABASE_URL \
  --secret-string "postgresql://cadence_app:PASSWORD@RDS_ENDPOINT:5432/cadence"

aws secretsmanager create-secret \
  --name cadence/JWT_SECRET \
  --secret-string "your-long-random-jwt-secret"

aws secretsmanager create-secret \
  --name cadence/CLIENT_URL \
  --secret-string "https://app.yourcadencedomain.com"

aws secretsmanager create-secret \
  --name cadence/SENDGRID_API_KEY \
  --secret-string "SG.xxxxx"

aws secretsmanager create-secret \
  --name cadence/FIREBASE_PROJECT_ID \
  --secret-string "your-firebase-project-id"
```

---

## Step 6: Configure GitHub Secrets

In your GitHub repo → Settings → Secrets and variables → Actions:

| Secret Name           | Value                                          |
|-----------------------|------------------------------------------------|
| `AWS_ACCESS_KEY_ID`   | From Step 1 IAM user                          |
| `AWS_SECRET_ACCESS_KEY` | From Step 1 IAM user                        |
| `AWS_REGION`          | `us-east-1`                                   |
| `ECR_REGISTRY`        | `ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com` |

Once these are set, **every push to `main` triggers an automatic deploy**.

---

## Step 7: Set Up CloudFront & Domain

See [cloudfront-setup.md](./cloudfront-setup.md) for full details.

Quick summary:
1. Create Application Load Balancer in front of ECS
2. Request ACM SSL certificate for your domain
3. Create CloudFront distribution pointing to ALB
4. Add `/api/*` behavior with no caching
5. Point your domain DNS to CloudFront

---

## Step 8: Create CloudWatch Log Groups

```bash
aws logs create-log-group --log-group-name /ecs/cadence-backend
aws logs create-log-group --log-group-name /ecs/cadence-frontend

# Set 30-day retention
aws logs put-retention-policy --log-group-name /ecs/cadence-backend --retention-in-days 30
aws logs put-retention-policy --log-group-name /ecs/cadence-frontend --retention-in-days 30
```

---

## Estimated Monthly Costs (low-traffic, us-east-1)

| Service         | Config                    | Est. Cost/mo |
|----------------|---------------------------|--------------|
| ECS Fargate    | 0.5 vCPU, 1 GB, 1 task   | ~$15         |
| RDS PostgreSQL | db.t3.micro, 20 GB, no Multi-AZ (dev) | ~$15 |
| CloudFront     | < 1 GB/month              | ~$1          |
| ECR            | < 1 GB images             | ~$0.10       |
| ALB            | 1 LCU                     | ~$16         |
| **Total**      |                           | **~$47/mo**  |

For production with Multi-AZ RDS (db.t3.small): ~$85/month.

---

## Troubleshooting

**ECS task won't start:**
- Check CloudWatch logs: `aws logs tail /ecs/cadence-backend --follow`
- Verify secrets are accessible from ECS execution role
- Confirm security groups allow DB access

**502 Bad Gateway:**
- Backend health check failing
- Check `GET /health` endpoint exists in backend
- Review ECS service events in console

**Database connection refused:**
- RDS security group must allow inbound 5432 from ECS security group
- Verify DATABASE_URL secret is correct
