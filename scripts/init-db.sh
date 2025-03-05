#!/bin/sh

echo "Ensuring database is up to date..."
# Run Prisma migrations
npx prisma migrate deploy
# Generate Prisma client
npx prisma generate

echo "Database initialization complete." 