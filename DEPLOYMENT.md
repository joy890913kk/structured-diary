# Deployment Guide

## Prerequisites

- Vercel account
- Vercel CLI installed: `npm i -g vercel`

## Step 1: Create Vercel Postgres Database

1. Go to your Vercel project dashboard
2. Navigate to the **Storage** tab
3. Click **Create Database**
4. Select **Postgres**
5. Choose a region close to your users
6. Click **Create**

Vercel will automatically add these environment variables to your project:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `DATABASE_URL` (automatically set to `POSTGRES_PRISMA_URL`)

## Step 2: Deploy Database Schema

### Option A: Using the Deploy Script (Recommended)

```bash
# 1. Install Vercel CLI if you haven't
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. Link your project
vercel link

# 4. Pull environment variables
vercel env pull .env.local

# 5. Deploy database schema and seed data
npm run deploy:db
```

### Option B: Manual Deployment

```bash
# 1. Get your DATABASE_URL from Vercel dashboard
#    Settings → Environment Variables → POSTGRES_PRISMA_URL

# 2. Push schema to database
DATABASE_URL="your-postgres-url" npx prisma db push

# 3. Generate Prisma Client
npx prisma generate

# 4. Seed the database
DATABASE_URL="your-postgres-url" npm run seed
```

## Step 3: Redeploy Your Application

After setting up the database, trigger a new deployment:

### Via Vercel Dashboard
1. Go to **Deployments**
2. Click the three dots on the latest deployment
3. Click **Redeploy**

### Via Git
```bash
git commit --allow-empty -m "Trigger redeploy"
git push origin master
```

## Verifying the Deployment

1. Open your deployed application URL
2. You should see the calendar page with no errors
3. Try adding a new entry to test database connectivity
4. Check the Reports page to see the seeded categories

## Troubleshooting

### "Application error: a client-side exception has occurred"

**Cause**: Database not set up or migrations not run

**Solution**: Follow Step 2 above to deploy the database schema

### "PrismaClientInitializationError"

**Cause**: DATABASE_URL environment variable not set

**Solution**:
1. Check Vercel dashboard → Settings → Environment Variables
2. Ensure `DATABASE_URL` is set
3. Redeploy the application

### Database Connection Issues

**Cause**: Connection pooling or SSL issues

**Solution**: Make sure you're using `POSTGRES_PRISMA_URL` for the `DATABASE_URL` environment variable (not `POSTGRES_URL`)

## Environment Variables Checklist

Make sure these are set in Vercel:
- ✅ `DATABASE_URL` (set to `POSTGRES_PRISMA_URL`)
- ✅ `POSTGRES_URL`
- ✅ `POSTGRES_PRISMA_URL`
- ✅ `POSTGRES_URL_NON_POOLING`

## Local Development with Vercel Postgres

To develop locally with the production database:

```bash
# Pull environment variables
vercel env pull .env.local

# Start development server
npm run dev
```

**Warning**: This connects to your production database. For safer development, consider:
1. Creating a separate Vercel project for staging
2. Using a local PostgreSQL database
3. Using Docker for local PostgreSQL

## Resetting the Database

If you need to reset the database:

```bash
# Pull environment variables
vercel env pull .env.local

# Reset and reseed
npm run deploy:db
```

## Production Best Practices

1. **Backups**: Enable Vercel Postgres automated backups in the dashboard
2. **Monitoring**: Check Vercel Analytics for errors and performance
3. **Scaling**: Monitor database usage and upgrade plan if needed
4. **Security**: Never commit `.env.local` to git

## Support

If you encounter issues:
- Check Vercel deployment logs
- Review Prisma error messages
- Ensure all environment variables are correctly set
- Verify database connection in Vercel dashboard
