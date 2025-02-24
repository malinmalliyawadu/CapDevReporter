#!/bin/bash

# Enable error handling and logging
set -e
exec 1> >(logger -s -t $(basename $0)) 2>&1

echo "Starting initialization script..."

# Update system packages
echo "Updating system packages..."
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y

# Install required packages
echo "Installing required packages..."
DEBIAN_FRONTEND=noninteractive apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    software-properties-common \
    nginx \
    docker.io

# Start and enable Docker
echo "Configuring Docker..."
systemctl start docker
systemctl enable docker

# Create directory for persistent database storage
echo "Setting up data directory..."
mkdir -p /app/data
chown -R 1001:1001 /app/data

# Configure nginx
echo "Configuring nginx..."
cat > /etc/nginx/sites-available/timesheet << 'EOL'
server {
    listen 80;
    server_name _;

    # Add access and error logs
    access_log /var/log/nginx/timesheet-access.log;
    error_log /var/log/nginx/timesheet-error.log;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Add timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOL

# Enable nginx site
echo "Enabling nginx configuration..."
ln -sf /etc/nginx/sites-available/timesheet /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# Create backup script
echo "Setting up backup script..."
cat > /usr/local/bin/backup-db.sh << 'EOL'
#!/bin/bash
set -e
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/home/ubuntu/backups

mkdir -p $BACKUP_DIR
if [ -f /app/data/timesheet.db ]; then
    cp /app/data/timesheet.db "$BACKUP_DIR/timesheet_$TIMESTAMP.db"
    find $BACKUP_DIR -type f -mtime +7 -delete
    echo "Backup completed successfully"
else
    echo "Database file not found, skipping backup"
fi
EOL

chmod +x /usr/local/bin/backup-db.sh

# Add backup cron job
echo "Setting up backup cron job..."
(crontab -l 2>/dev/null; echo "0 0 * * * /usr/local/bin/backup-db.sh") | crontab -

# Install Docker monitoring (Portainer)
echo "Installing Portainer..."
docker run -d \
  --name=portainer \
  --restart=always \
  -p 9000:9000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest

# Final status check
echo "Checking service status..."
systemctl status docker --no-pager
systemctl status nginx --no-pager
docker ps

echo "Initialization complete. Check /var/log/syslog for detailed logs."

# Write a completion flag
touch /var/log/user-data-complete 