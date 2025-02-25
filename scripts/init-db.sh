#!/bin/sh

echo "Ensuring database is up to date..."
# Run Prisma migrations
npx prisma migrate deploy
# Generate Prisma client
npx prisma generate
# Seed the database
echo "Seeding the database..."
npx prisma db seed
echo "Database initialization complete." 