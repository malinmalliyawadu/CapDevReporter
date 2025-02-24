#!/bin/sh

# Check if the database file exists
if [ ! -f "/app/data/timesheet.db" ]; then
    echo "Initializing database..."
    # Run Prisma migrations
    npx prisma migrate deploy
    # Generate Prisma client
    npx prisma generate
    echo "Database initialization complete."
else
    echo "Database already exists, skipping initialization."
fi 