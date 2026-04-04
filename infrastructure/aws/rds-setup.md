# RDS PostgreSQL Setup Guide

## Recommended Instance Types

| Environment | Instance     | Storage  | Multi-AZ | Notes                    |
|-------------|-------------|----------|----------|--------------------------|
| Development | db.t3.micro | 20 GB GP2 | No      | ~$15/mo, fine for dev    |
| Staging     | db.t3.small | 20 GB GP2 | No      | ~$30/mo                  |
| Production  | db.t3.small | 50 GB GP2 | Yes     | ~$70/mo, auto-failover   |

## Step-by-Step Setup

### 1. Create the RDS Instance

```bash
aws rds create-db-instance \
  --db-instance-identifier cadence-prod \
  --db-instance-class db.t3.small \
  --engine postgres \
  --engine-version 16 \
  --master-username cadence \
  --master-user-password YOUR_STRONG_PASSWORD \
  --allocated-storage 50 \
  --storage-type gp2 \
  --vpc-security-group-ids sg-xxxxxxxx \
  --db-subnet-group-name cadence-subnet-group \
  --backup-retention-period 7 \
  --multi-az \
  --no-publicly-accessible \
  --region us-east-1
```

Or via AWS Console:
1. Go to RDS → Create database
2. Standard create → PostgreSQL 16
3. Template: Production (enables Multi-AZ)
4. DB instance identifier: `cadence-prod`
5. Master username: `cadence`
6. Set a strong master password
7. Instance class: `db.t3.small`
8. Storage: 50 GB GP2, enable auto-scaling to 100 GB
9. VPC: Select your VPC
10. **Public access: No** (only accessible from ECS)
11. Create new security group: `cadence-rds-sg`

### 2. Security Group Rules

**cadence-rds-sg** (RDS security group):
| Type       | Protocol | Port | Source              | Description                  |
|------------|----------|------|---------------------|------------------------------|
| PostgreSQL | TCP      | 5432 | cadence-ecs-sg      | Allow ECS backend access     |
| PostgreSQL | TCP      | 5432 | Your IP (dev only)  | Dev machine access (remove in prod) |

**cadence-ecs-sg** (ECS task security group):
| Type   | Protocol | Port | Source    | Description         |
|--------|----------|------|-----------|---------------------|
| HTTP   | TCP      | 80   | 0.0.0.0/0 | Frontend traffic    |
| Custom | TCP      | 4001 | ALB SG    | Backend from ALB    |
| All outbound | All | All | 0.0.0.0/0 | Outbound traffic |

### 3. Create the Database

Once RDS is running, connect and create the app database:

```sql
-- Connect using master credentials
CREATE DATABASE cadence;
CREATE USER cadence_app WITH ENCRYPTED PASSWORD 'app_password';
GRANT ALL PRIVILEGES ON DATABASE cadence TO cadence_app;
```

### 4. Run Migrations

```bash
# From your local machine (or CI/CD)
DATABASE_URL="postgresql://cadence_app:app_password@your-rds-endpoint:5432/cadence" \
  npx prisma migrate deploy
```

### 5. Connection String Format

```
postgresql://USERNAME:PASSWORD@RDS_ENDPOINT:5432/DATABASE_NAME
```

Example:
```
postgresql://cadence_app:strongpassword@cadence-prod.abc123.us-east-1.rds.amazonaws.com:5432/cadence
```

Store this in **AWS Secrets Manager** (never in code):
```bash
aws secretsmanager create-secret \
  --name cadence/DATABASE_URL \
  --secret-string "postgresql://cadence_app:strongpassword@cadence-prod.abc123.us-east-1.rds.amazonaws.com:5432/cadence"
```

## Backups

- Automated backups: 7-day retention (configured above)
- Manual snapshots before migrations: `aws rds create-db-snapshot --db-instance-identifier cadence-prod --db-snapshot-identifier pre-migration-$(date +%Y%m%d)`
- See `scripts/backup-db.sh` for local backup scripts

## Monitoring

Enable these CloudWatch alarms:
- `FreeStorageSpace` < 5 GB → alert
- `CPUUtilization` > 80% for 5 minutes → alert
- `DatabaseConnections` > 80 → alert
