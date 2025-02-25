#!/bin/bash

# Enable error handling and logging
set -e
exec 1> >(logger -s -t $(basename $0)) 2>&1

echo "[Init] Starting initialization script"

# Update system packages
echo "[Init] Updating system packages"
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y

# Install required packages
echo "[Init] Installing required packages"
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    software-properties-common \
    docker.io \
    unzip \
    nginx \
    openssl

# Install AWS CLI
echo "[Init] Installing AWS CLI"
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install
rm -rf aws awscliv2.zip

# Start and enable Docker
echo "[Init] Starting Docker service"
systemctl start docker
systemctl enable docker

# Add ubuntu user to docker group
echo "[Init] Adding ubuntu user to docker group"
usermod -aG docker ubuntu

# Create directory for persistent database storage
echo "[Init] Setting up data directory"
mkdir -p /app/data
chown -R 1001:1001 /app/data

# Generate self-signed certificate
echo "[Init] Generating self-signed SSL certificate"
mkdir -p /etc/nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/nginx.key \
    -out /etc/nginx/ssl/nginx.crt \
    -subj "/C=AU/ST=NSW/L=Sydney/O=PartStrader/CN=$(curl -s http://169.254.169.254/latest/meta-data/public-hostname)"

# Configure nginx with SSL
echo "[Init] Configuring nginx"
cat > /etc/nginx/sites-available/timesheet << EOL
# HTTP - redirect all requests to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name _;
    return 301 https://\$host\$request_uri;
}

# HTTPS - proxy all requests to local app
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name _;

    ssl_certificate /etc/nginx/ssl/nginx.crt;
    ssl_certificate_key /etc/nginx/ssl/nginx.key;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_session_timeout 10m;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;

    # Next.js static files (most specific first)
    location /_next/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # Portainer websocket (needs to be before the main Portainer location)
    location /portainer/api/websocket/ {
        proxy_pass http://localhost:9000/api/websocket/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # Portainer
    location ^~ /portainer/ {
        rewrite ^/portainer/(.*) /\$1 break;
        proxy_pass http://localhost:9000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # Additional Portainer settings
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header X-Forwarded-Port \$server_port;
        proxy_read_timeout 900;
        proxy_connect_timeout 900;
        proxy_send_timeout 900;
        proxy_buffering off;
    }

    # Main app (least specific last)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header X-Forwarded-Port \$server_port;
        
        # WebSocket support
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Next.js specific
        proxy_redirect off;
        proxy_buffering off;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    # Sync endpoint - optimized for streaming
    location /api/projects/sync {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Disable all buffering for streaming
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_cache off;
        
        # Increase timeouts for long-running sync
        proxy_read_timeout 600s;
        proxy_send_timeout 600s;
        proxy_connect_timeout 600s;
        
        # Keep connection alive
        proxy_set_header Connection '';
        keepalive_timeout 600s;
        keepalive_requests 1000;
        
        # Chunked transfer encoding
        proxy_set_header Transfer-Encoding chunked;
        
        # Disable compression
        proxy_set_header Accept-Encoding '';
    }
}
EOL

# Enable nginx site
ln -sf /etc/nginx/sites-available/timesheet /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# Create backup script
echo "[Init] Setting up backup script"
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

# Set up ECR variables
ECR_ACCOUNT="1234"
ECR_REGION="${aws_region}"
ECR_REGISTRY="$ECR_ACCOUNT.dkr.ecr.$ECR_REGION.amazonaws.com"
ECR_REPOSITORY="${ecr_repository}"
ECR_IMAGE="$ECR_REGISTRY/$ECR_REPOSITORY:latest"

# Pull and run the application from ECR
echo "[Init] Authenticating with ECR at $ECR_REGISTRY"
if ! aws ecr get-login-password --region $ECR_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY; then
    echo "[Init] ERROR: Failed to authenticate with ECR"
    exit 1
fi

echo "[Init] Pulling container image from ECR: $ECR_IMAGE"
if ! docker pull $ECR_IMAGE; then
    echo "[Init] ERROR: Failed to pull image from ECR"
    aws ecr describe-repositories --region $ECR_REGION
    aws ecr describe-images --region $ECR_REGION --repository-name $ECR_REPOSITORY || true
    exit 1
fi

echo "[Init] Stopping any existing container"
docker stop timesheet-app || true
docker rm timesheet-app || true

echo "[Init] Starting timesheet container"
if ! docker run -d \
    --name=timesheet-app \
    --restart=always \
    -p 3000:3000 \
    -v /app/data:/app/data \
    $ECR_IMAGE; then
    echo "[Init] ERROR: Failed to start container"
    exit 1
fi

# Verify container is running
echo "[Init] Verifying container status"
if docker ps | grep -q timesheet-app; then
    echo "[Init] Timesheet container is running successfully"
    docker logs timesheet-app
else
    echo "[Init] ERROR: Timesheet container failed to start"
    echo "[Init] Docker logs:"
    docker logs timesheet-app
    exit 1
fi

# Install Docker monitoring (Portainer)
echo "[Init] Installing Portainer"
docker run -d \
  --name=portainer \
  --restart=always \
  --restart=always \
  -p 9000:9000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  --env HIDE_TOOLBAR=1 \
  portainer/portainer-ce:latest \
  --http-enabled \
  --admin-password-file /dev/null \
  --base-url /portainer/

echo "[Init] Initialization complete"

# Note: After the instance is up, you'll need to run:
# sudo certbot --nginx -d your-domain.com 