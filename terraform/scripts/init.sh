#!/bin/bash

# Update system packages
apt-get update
apt-get upgrade -y

# Install required packages
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    software-properties-common \
    nginx \
    docker.io

# Start and enable Docker
systemctl start docker
systemctl enable docker

# Create directory for persistent database storage
mkdir -p /app/data
chown -R 1001:1001 /app/data

# Configure nginx
cat > /etc/nginx/sites-available/timesheet << 'EOL'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOL

# Enable nginx site
ln -s /etc/nginx/sites-available/timesheet /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# Create backup script
cat > /usr/local/bin/backup-db.sh << 'EOL'
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/home/ubuntu/backups

mkdir -p $BACKUP_DIR
cp /app/data/timesheet.db "$BACKUP_DIR/timesheet_$TIMESTAMP.db"
find $BACKUP_DIR -type f -mtime +7 -delete
EOL

chmod +x /usr/local/bin/backup-db.sh

# Add backup cron job
(crontab -l 2>/dev/null; echo "0 0 * * * /usr/local/bin/backup-db.sh") | crontab -

# Install Docker monitoring (Portainer)
docker run -d \
  --name=portainer \
  -p 9000:9000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest 