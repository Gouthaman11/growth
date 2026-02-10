# 🚀 Vercel Deployment Guide

## Prerequisites

- Vercel account (https://vercel.com)
- AWS RDS PostgreSQL database already configured
- Git repository (GitHub, GitLab, or Bitbucket)

---

## Step 1: Push to Git Repository

```bash
git add .
git commit -m "Add Vercel deployment configuration"
git push origin main
```

---

## Step 2: Import Project to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your Git repository
4. Select the **edugrow-plus** folder as the root directory

---

## Step 3: Configure Environment Variables

In the Vercel project settings, add these environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_HOST` | AWS RDS endpoint | `database-1.xxx.rds.amazonaws.com` |
| `DB_NAME` | Database name | `postgres` |
| `DB_USER` | Database username | `postgres` |
| `DB_PASS` | Database password | `your-password` |
| `DB_PORT` | Database port | `5432` |
| `JWT_SECRET` | Secret for JWT tokens | `your-super-secret-key` |

### Adding Environment Variables:

1. Go to your project in Vercel
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable with its value
4. Check the environments where it should apply (Production, Preview, Development)

---

## Step 4: Configure AWS RDS Security Group

Your AWS RDS instance needs to accept connections from Vercel's IP addresses.

### Option A: Allow All IPs (Development/Testing - Less Secure)

1. Go to AWS Console → RDS → Your Database
2. Click on the **VPC Security Group**
3. Edit inbound rules
4. Add rule: Type: **PostgreSQL**, Source: **0.0.0.0/0**

### Option B: Use AWS Secrets Manager (Production - More Secure)

Consider using AWS Secrets Manager with proper IAM roles for production deployments.

---

## Step 5: Deploy

1. Click **"Deploy"** in Vercel
2. Wait for the build to complete
3. Your app will be live at `https://your-project.vercel.app`

---

## Project Structure for Vercel

```
edugrow-plus/
├── api/
│   └── index.js          # Serverless API function
├── src/                   # React frontend
├── public/               # Static assets
├── vercel.json           # Vercel configuration
├── package.json          # Dependencies (includes server deps)
└── vite.config.js        # Vite configuration
```

---

## How It Works

- **Frontend**: Built with Vite and served as static files
- **API**: Runs as Vercel Serverless Functions (`/api/*` routes)
- **Database**: PostgreSQL on AWS RDS (SSL connection)

---

## Local Development

For local development, create a `.env` file:

```bash
cp .env.example .env
# Edit .env with your AWS credentials
```

Run the frontend:
```bash
npm run dev
```

Run the backend (in separate terminal):
```bash
cd server
npm run dev
```

---

## Troubleshooting

### Database Connection Issues

1. Verify AWS RDS security group allows connections
2. Check environment variables are set correctly in Vercel
3. Ensure RDS instance is publicly accessible (if using public endpoint)

### API Not Working

1. Check Vercel function logs in the dashboard
2. Verify `vercel.json` rewrites are correct
3. Test the health endpoint: `https://your-app.vercel.app/api/health`

### Build Failures

1. Check that all dependencies are in root `package.json`
2. Verify Node.js version compatibility
3. Review build logs in Vercel dashboard

---

## Environment Variables Reference

```env
# Required for database
DB_HOST=your-rds-endpoint.rds.amazonaws.com
DB_NAME=postgres
DB_USER=postgres
DB_PASS=your-password
DB_PORT=5432

# Required for authentication
JWT_SECRET=generate-a-secure-random-string

# Optional for local development
VITE_API_URL=http://localhost:5000/api
```

---

## Useful Commands

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from command line
vercel

# Deploy to production
vercel --prod

# Check logs
vercel logs your-project.vercel.app
```

---

**Last Updated:** February 10, 2026
