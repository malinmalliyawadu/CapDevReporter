#!/bin/sh

echo "Ensuring database is up to date..."
# Run Prisma migrations
npx prisma migrate deploy
# Generate Prisma client
npx prisma generate

# Check if the database exists and has data
if [ ! -f "/app/data/timesheet.db" ] || [ ! -s "/app/data/timesheet.db" ]; then
    echo "Database is empty or doesn't exist. Seeding the database..."
    npx prisma db seed
else
    echo "Database already exists and contains data. Skipping seed."
fi

echo "Database initialization complete." 