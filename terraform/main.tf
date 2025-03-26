terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  profile = "***REMOVED***-dev-sso"
  region  = "ap-southeast-2"
  default_tags {
    tags = {
      Account     = "***REMOVED***-dev"
      Description = "CapDevReporter App"
      Terraform   = "true"
      Owner = "Malin Malliya Wadu"
    }
  }
}

# VPC and Networking
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "capdevreporter-vpc"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "capdevreporter-igw"
  }
}

# Create two subnets in different AZs for ECS requirements
resource "aws_subnet" "main" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = {
    Name = "capdevreporter-subnet-a"
  }
}

resource "aws_subnet" "secondary" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "${var.aws_region}b"
  map_public_ip_on_launch = true

  tags = {
    Name = "capdevreporter-subnet-b"
  }
}

# Create private subnets for RDS
resource "aws_subnet" "private_a" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = "${var.aws_region}a"

  tags = {
    Name = "capdevreporter-private-subnet-a"
  }
}

resource "aws_subnet" "private_b" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.4.0/24"
  availability_zone = "${var.aws_region}b"

  tags = {
    Name = "capdevreporter-private-subnet-b"
  }
}

resource "aws_route_table" "main" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "capdevreporter-route-table"
  }
}

resource "aws_route_table_association" "main" {
  subnet_id      = aws_subnet.main.id
  route_table_id = aws_route_table.main.id
}

resource "aws_route_table_association" "secondary" {
  subnet_id      = aws_subnet.secondary.id
  route_table_id = aws_route_table.main.id
}

# Security Group for ECS Fargate Tasks
resource "aws_security_group" "ecs" {
  name        = "capdevreporter-ecs-sg"
  description = "Security group for CapDevReporter ECS service"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "Allow inbound traffic from ALB"
  }
  
  # Allow health check traffic from anywhere within the VPC
  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
    description = "Allow health check traffic from within VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "capdevreporter-ecs-sg"
  }
}

# Security Group for ALB
resource "aws_security_group" "alb" {
  name        = "capdevreporter-alb-sg"
  description = "Security group for CapDevReporter ALB"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [var.your_ip_address]
    description = "HTTP access"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.your_ip_address]
    description = "HTTPS access"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "capdevreporter-alb-sg"
  }
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name        = "capdevreporter-rds-sg"
  description = "Security group for CapDevReporter RDS instance"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
    description     = "MySQL access from ECS tasks"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "capdevreporter-rds-sg"
  }
}

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "capdevreporter-db-subnet-group"
  subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_b.id]

  tags = {
    Name = "CapDevReporter DB Subnet Group"
  }
}

# Aurora MySQL Cluster
resource "aws_rds_cluster" "main" {
  cluster_identifier     = "capdevreporter-cluster"
  engine                = "aurora-mysql"
  engine_version        = "8.0"
  database_name         = "capdevreporter"
  master_username       = "capdevreporter_admin"
  master_password       = var.db_password
  db_subnet_group_name  = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  skip_final_snapshot   = true
  
  tags = {
    Name = "capdevreporter-aurora-cluster"
  }
}

# Aurora MySQL Instance
resource "aws_rds_cluster_instance" "main" {
  count               = 1
  identifier          = "capdevreporter-instance-${count.index}"
  cluster_identifier  = aws_rds_cluster.main.id
  instance_class      = "db.t4g.medium"
  engine              = aws_rds_cluster.main.engine
  engine_version      = aws_rds_cluster.main.engine_version
  
  tags = {
    Name = "capdevreporter-aurora-instance-${count.index}"
  }
}

# IAM Role for ECS Task Execution
resource "aws_iam_role" "ecs_task_execution_role" {
  name = "capdevreporter-ecs-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Add Secrets Manager access to ECS Task Execution Role
resource "aws_iam_role_policy" "ecs_task_execution_secrets_policy" {
  name = "capdevreporter-ecs-task-execution-secrets-policy"
  role = aws_iam_role.ecs_task_execution_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          "${aws_secretsmanager_secret.capdevreporter_secrets.arn}*"
        ]
      }
    ]
  })
}

# IAM Role for ECS Task
resource "aws_iam_role" "ecs_task_role" {
  name = "capdevreporter-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "capdevreporter-cluster"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "app" {
  name              = "/ecs/capdevreporter-app"
  retention_in_days = 30
}

# Create AWS Secrets Manager secret
resource "aws_secretsmanager_secret" "capdevreporter_secrets" {
  name = "capdevreporter-app"
  
  tags = {
    Name = "capdevreporter-app-secrets"
    Description = "Secrets for CapDevReporter App"
  }
}

resource "aws_secretsmanager_secret_version" "capdevreporter_secrets" {
  secret_id = aws_secretsmanager_secret.capdevreporter_secrets.id
  secret_string = jsonencode({
    DATABASE_URL           = "mysql://${aws_rds_cluster.main.master_username}:${var.db_password}@${aws_rds_cluster.main.endpoint}/${aws_rds_cluster.main.database_name}"
    JIRA_API_TOKEN         = var.jira_api_token
    JIRA_USER_EMAIL        = var.jira_user_email
    IPAYROLL_CLIENT_ID     = var.ipayroll_client_id
    IPAYROLL_CLIENT_SECRET = var.ipayroll_client_secret
    AZURE_AD_CLIENT_ID     = var.azure_ad_client_id
    AZURE_AD_CLIENT_SECRET = var.azure_ad_client_secret
    AZURE_AD_TENANT_ID     = var.azure_ad_tenant_id
    NEXTAUTH_SECRET        = var.nextauth_secret
  })
}

# Add Secrets Manager access to ECS Task Role
resource "aws_iam_role_policy" "ecs_task_secrets_policy" {
  name = "capdevreporter-ecs-task-secrets-policy"
  role = aws_iam_role.ecs_task_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.capdevreporter_secrets.arn
        ]
      }
    ]
  })
}

# Update the main task definition to include healthcheck
resource "aws_ecs_task_definition" "app" {
  family                   = "capdevreporter-app"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "1024"
  memory                   = "2048"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "capdevreporter-app"
      image     = "1234.dkr.ecr.${var.aws_region}.amazonaws.com/***REMOVED***/capdevreporter:latest"
      essential = true
      
      portMappings = [
        {
          containerPort = 3000
          hostPort      = 3000
          protocol      = "tcp"
        }
      ]
      
      environment = [
        {
          name  = "DEPLOY_TIMESTAMP",
          value = timestamp()
        },
        {
          name  = "IPAYROLL_REDIRECT_URI",
          value = "https://${aws_lb.app.dns_name}/api/ipayroll/auth/callback"
        },
        {
          name  = "NEXTAUTH_URL",
          value = "https://${aws_lb.app.dns_name}"
        },
        {
          name  = "NODE_ENV",
          value = "production"
        },
        {
          name  = "JIRA_HOST",
          value = "***REMOVED***.atlassian.net"
        },
        {
          name  = "IPAYROLL_API_URL",
          value = "https://demo.ipayroll.co.nz"
        },
        {
          name  = "DISABLE_AUTH",
          value = var.disable_auth
        }
      ]
      
      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = "${aws_secretsmanager_secret.capdevreporter_secrets.arn}:DATABASE_URL::"
        },
        {
          name      = "JIRA_API_TOKEN"
          valueFrom = "${aws_secretsmanager_secret.capdevreporter_secrets.arn}:JIRA_API_TOKEN::"
        },
        {
          name      = "JIRA_USER_EMAIL"
          valueFrom = "${aws_secretsmanager_secret.capdevreporter_secrets.arn}:JIRA_USER_EMAIL::"
        },
        {
          name      = "IPAYROLL_CLIENT_ID"
          valueFrom = "${aws_secretsmanager_secret.capdevreporter_secrets.arn}:IPAYROLL_CLIENT_ID::"
        },
        {
          name      = "IPAYROLL_CLIENT_SECRET"
          valueFrom = "${aws_secretsmanager_secret.capdevreporter_secrets.arn}:IPAYROLL_CLIENT_SECRET::"
        },
        {
          name      = "AZURE_AD_CLIENT_ID"
          valueFrom = "${aws_secretsmanager_secret.capdevreporter_secrets.arn}:AZURE_AD_CLIENT_ID::"
        },
        {
          name      = "AZURE_AD_CLIENT_SECRET"
          valueFrom = "${aws_secretsmanager_secret.capdevreporter_secrets.arn}:AZURE_AD_CLIENT_SECRET::"
        },
        {
          name      = "AZURE_AD_TENANT_ID"
          valueFrom = "${aws_secretsmanager_secret.capdevreporter_secrets.arn}:AZURE_AD_TENANT_ID::"
        },
        {
          name      = "NEXTAUTH_SECRET"
          valueFrom = "${aws_secretsmanager_secret.capdevreporter_secrets.arn}:NEXTAUTH_SECRET::"
        }
      ]
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.app.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "capdevreporter"
        }
      }
    }
  ])
}

# Self-signed certificate for ALB
resource "tls_private_key" "alb" {
  algorithm = "RSA"
}

resource "tls_self_signed_cert" "alb" {
  private_key_pem = tls_private_key.alb.private_key_pem

  subject {
    common_name  = "*.elb.amazonaws.com"
    organization = "CapDevReporter App"
  }

  validity_period_hours = 8760 # 1 year

  allowed_uses = [
    "key_encipherment",
    "digital_signature",
    "server_auth",
  ]
}

resource "aws_acm_certificate" "app" {
  private_key      = tls_private_key.alb.private_key_pem
  certificate_body = tls_self_signed_cert.alb.cert_pem
}

# Application Load Balancer
resource "aws_lb" "app" {
  name               = "capdevreporter-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = [aws_subnet.main.id, aws_subnet.secondary.id]
  
  enable_deletion_protection = false
}

resource "aws_lb_target_group" "app" {
  name        = "capdevreporter-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"
  
  deregistration_delay = 30

  stickiness {
    enabled = false
    type    = "lb_cookie"
  }
}

# HTTP Listener - Redirects to HTTPS
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.app.arn
  port              = 80
  protocol          = "HTTP"
  
  default_action {
    type = "redirect"
    
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# HTTPS Listener
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.app.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = aws_acm_certificate.app.arn
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

# Create a migration task definition
resource "aws_ecs_task_definition" "migration" {
  family                   = "capdevreporter-migration"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "1024"
  memory                   = "2048"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "capdevreporter-migration"
      image     = "1234.dkr.ecr.${var.aws_region}.amazonaws.com/***REMOVED***/capdevreporter:latest"
      essential = true
      
      command = ["sh", "-c", "npx prisma migrate deploy"]
      workingDirectory = "/app",
      
      environment = [
        {
          name  = "NODE_ENV",
          value = "production"
        },
        {
          name  = "DISABLE_AUTH",
          value = var.disable_auth
        }
      ]
      
      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = "${aws_secretsmanager_secret.capdevreporter_secrets.arn}:DATABASE_URL::"
        }
      ]
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.app.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "migration"
        }
      }
    }
  ])
}

# Create a migration ECS service for GitHub Actions deployments
resource "aws_ecs_service" "migration" {
  name            = "capdevreporter-migration-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.migration.arn
  desired_count   = 0  # We don't want this service to keep tasks running
  launch_type     = "FARGATE"
  
  network_configuration {
    subnets          = [aws_subnet.main.id, aws_subnet.secondary.id]
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = true
  }

  lifecycle {
    ignore_changes = [desired_count, task_definition]  # Ignore changes since GH Actions will update these
  }
}

# Create a db reset task definition
resource "aws_ecs_task_definition" "db_reset" {
  family                   = "capdevreporter-db-reset"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "1024"
  memory                   = "2048"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "capdevreporter-db-reset"
      image     = "1234.dkr.ecr.${var.aws_region}.amazonaws.com/***REMOVED***/capdevreporter:latest"
      essential = true
      
      command = ["sh", "-c", "echo 'DROP DATABASE IF EXISTS capdevreporter;' | npx prisma db execute --stdin && npx prisma migrate deploy && npx prisma db seed"]
      workingDirectory = "/app",
      
      environment = [
        {
          name  = "NODE_ENV",
          value = "production"
        },
        {
          name  = "DISABLE_AUTH",
          value = var.disable_auth
        }
      ]
      
      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = "${aws_secretsmanager_secret.capdevreporter_secrets.arn}:DATABASE_URL::"
        }
      ]
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.app.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "db-reset"
        }
      }
    }
  ])
}

# Create a db reset service for manual triggering
resource "aws_ecs_service" "db_reset" {
  name            = "capdevreporter-db-reset-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.db_reset.arn
  desired_count   = 0  # We don't want this service to keep tasks running
  launch_type     = "FARGATE"
  
  network_configuration {
    subnets          = [aws_subnet.main.id, aws_subnet.secondary.id]
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = true
  }

  lifecycle {
    ignore_changes = [desired_count, task_definition]  # Ignore changes since workflow will update these
  }
}

# Make the main app service depend on the migration task
resource "aws_ecs_service" "app" {
  name            = "capdevreporter-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 2
  launch_type     = "FARGATE"
  force_new_deployment = true
  wait_for_steady_state = true
  
  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent = 200
  
  network_configuration {
    subnets          = [aws_subnet.main.id, aws_subnet.secondary.id]
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = true
  }
  
  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "capdevreporter-app"
    container_port   = 3000
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }
}

# Output values
output "alb_dns_name" {
  value = aws_lb.app.dns_name
  description = "The DNS name of the load balancer"
}

output "aurora_cluster_endpoint" {
  value = aws_rds_cluster.main.endpoint
  description = "The connection endpoint for the Aurora cluster"
}

output "aurora_reader_endpoint" {
  value = aws_rds_cluster.main.reader_endpoint
  description = "The reader endpoint for the Aurora cluster"
}

# Add a new output for executing the migration
output "run_migration_command" {
  value       = "aws ecs run-task --cluster ${aws_ecs_cluster.main.name} --task-definition ${aws_ecs_task_definition.migration.family}:${aws_ecs_task_definition.migration.revision} --network-configuration awsvpcConfiguration={subnets=[${aws_subnet.main.id}],securityGroups=[${aws_security_group.ecs.id}],assignPublicIp=ENABLED} --launch-type FARGATE --profile ***REMOVED***-dev-sso --region ${var.aws_region}"
  description = "Command to run the database migration task"
}

output "run_db_reset_command" {
  value       = "aws ecs run-task --cluster ${aws_ecs_cluster.main.name} --task-definition ${aws_ecs_task_definition.db_reset.family}:${aws_ecs_task_definition.db_reset.revision} --network-configuration awsvpcConfiguration={subnets=[${aws_subnet.main.id}],securityGroups=[${aws_security_group.ecs.id}],assignPublicIp=ENABLED} --launch-type FARGATE --profile ***REMOVED***-dev-sso --region ${var.aws_region}"
  description = "Command to run the database reset task"
} 
