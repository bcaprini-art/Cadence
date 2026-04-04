# CloudFront CDN Setup Guide

CloudFront sits in front of the frontend and routes `/api/*` to the backend (Application Load Balancer), while serving static assets from the CDN edge.

## Architecture

```
Users → CloudFront → /api/* → ALB → ECS backend
                  → /*      → ALB → ECS frontend (nginx)
```

## Step 1: Set Up an Application Load Balancer (ALB)

Before CloudFront, you need an ALB that routes to your ECS service.

1. Go to EC2 → Load Balancers → Create Load Balancer
2. Application Load Balancer
3. Scheme: Internet-facing
4. Listeners: HTTP (80), HTTPS (443)
5. Target groups:
   - `cadence-frontend-tg` → port 80 (ECS frontend tasks)
   - `cadence-backend-tg` → port 4001 (ECS backend tasks)
6. ALB rules:
   - `IF path starts with /api` → forward to `cadence-backend-tg`
   - `DEFAULT` → forward to `cadence-frontend-tg`

## Step 2: Request an SSL Certificate (ACM)

```bash
aws acm request-certificate \
  --domain-name app.yourcadencedomain.com \
  --validation-method DNS \
  --region us-east-1
```

Validate via DNS (add the CNAME record to your domain registrar).

## Step 3: Create a CloudFront Distribution

### Via AWS Console:

1. Go to CloudFront → Create Distribution

2. **Origin:**
   - Origin domain: `your-alb-name.us-east-1.elb.amazonaws.com`
   - Protocol: HTTP only (ALB → CloudFront is internal, HTTPS at CloudFront edge)
   - Origin path: (leave empty)

3. **Default cache behavior (static assets):**
   - Compress objects: Yes
   - Viewer protocol policy: **Redirect HTTP to HTTPS**
   - Allowed HTTP methods: GET, HEAD
   - Cache policy: `CachingOptimized` (long TTL for static assets)
   - Origin request policy: `AllViewer`

4. **Add cache behavior for `/api/*`:**
   - Path pattern: `/api/*`
   - Viewer protocol policy: Redirect HTTP to HTTPS
   - Allowed HTTP methods: **GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE**
   - Cache policy: **CachingDisabled** (never cache API responses)
   - Origin request policy: `AllViewer` (forward all headers/cookies)

5. **Settings:**
   - Price class: Use only North America and Europe (cheaper)
   - Alternate domain name (CNAME): `app.yourcadencedomain.com`
   - Custom SSL certificate: select the ACM certificate from Step 2
   - Default root object: `index.html`

6. **Custom error responses (for React SPA routing):**
   - 404 → `/index.html` with HTTP 200
   - 403 → `/index.html` with HTTP 200

### Via AWS CLI:

```bash
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json
```

## Step 4: Point Your Domain to CloudFront

Add a CNAME record (or ALIAS for root domains) in your DNS:

```
app.yourcadencedomain.com → d1234abcd.cloudfront.net
```

## Cache Behaviors Summary

| Path Pattern | Cache Policy    | Methods            | Use Case            |
|-------------|-----------------|---------------------|---------------------|
| `/api/*`    | CachingDisabled | All (incl. POST)    | API — no cache      |
| `/*`        | CachingOptimized| GET, HEAD           | SPA static assets   |

## Cache Invalidation (After Deploy)

After deploying new frontend code, invalidate the CloudFront cache:

```bash
aws cloudfront create-invalidation \
  --distribution-id EDFDVBD6EXAMPLE \
  --paths "/*"
```

Add this to your GitHub Actions deploy workflow after pushing new images.

## Cost Estimate

- CloudFront: ~$0.0085/10k requests + $0.0085/GB transferred
- For a low-traffic app: likely **< $5/month**
