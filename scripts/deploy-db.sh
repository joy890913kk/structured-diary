#!/bin/bash
# Database deployment script for Vercel Postgres

echo "🚀 Deploying database schema to Vercel Postgres..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL environment variable is not set"
  echo "Please run: vercel env pull .env.local"
  echo "Or set DATABASE_URL manually from Vercel dashboard"
  exit 1
fi

echo "✅ DATABASE_URL is set"

# Push schema to database (this will create tables without migrations)
echo "📤 Pushing schema to database..."
npx prisma db push --accept-data-loss

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

# Seed database
echo "🌱 Seeding database..."
npm run seed

echo "✅ Database deployment complete!"
echo "🎉 Your database is ready to use"
