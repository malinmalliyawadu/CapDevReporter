terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  profile = "***REMOVED***-dev-sso"
  region  = "ap-southeast-2"
  default_tags {
    tags = {
      Account     = "***REMOVED***-dev"
      Description = "Timesheet App"
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
    Name = "timesheet-vpc"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "timesheet-igw"
  }
}

# Create two subnets in different AZs for ECS requirements
resource "aws_subnet" "main" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = {
    Name = "timesheet-subnet-a"
  }
}

resource "aws_subnet" "secondary" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "${var.aws_region}b"
  map_public_ip_on_launch = true

  tags = {
    Name = "timesheet-subnet-b"
  }
}

# Create private subnets for RDS
resource "aws_subnet" "private_a" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = "${var.aws_region}a"

  tags = {
    Name = "timesheet-private-subnet-a"
  }
}

resource "aws_subnet" "private_b" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.4.0/24"
  availability_zone = "${var.aws_region}b"

  tags = {
    Name = "timesheet-private-subnet-b"
  }
}

resource "aws_route_table" "main" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "timesheet-route-table"
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
  name        = "timesheet-ecs-sg"
  description = "Security group for Timesheet ECS service"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "Allow inbound traffic from ALB"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "timesheet-ecs-sg"
  }
}

# Security Group for ALB
resource "aws_security_group" "alb" {
  name        = "timesheet-alb-sg"
  description = "Security group for Timesheet ALB"
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
    Name = "timesheet-alb-sg"
  }
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name        = "timesheet-rds-sg"
  description = "Security group for Timesheet RDS instance"
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
    Name = "timesheet-rds-sg"
  }
}

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "timesheet-db-subnet-group"
  subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_b.id]

  tags = {
    Name = "Timesheet DB Subnet Group"
  }
}

# RDS MySQL Instance
resource "aws_db_instance" "main" {
  identifier             = "timesheet-db"
  engine                 = "mysql"
  engine_version         = "8.0"
  instance_class         = "db.t4g.micro"
  allocated_storage      = 20
  storage_type           = "gp3"
  db_name                = "timesheet"
  username               = "timesheet_admin"
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  skip_final_snapshot    = true
  publicly_accessible    = false
  multi_az               = false
  
  tags = {
    Name = "timesheet-db"
  }
}

# IAM Role for ECS Task Execution
resource "aws_iam_role" "ecs_task_execution_role" {
  name = "timesheet-ecs-task-execution-role"

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
  name = "timesheet-ecs-task-execution-secrets-policy"
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
          "${aws_secretsmanager_secret.timesheet_secrets.arn}*"
        ]
      }
    ]
  })
}

# IAM Role for ECS Task
resource "aws_iam_role" "ecs_task_role" {
  name = "timesheet-ecs-task-role"

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
  name = "timesheet-cluster"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "app" {
  name              = "/ecs/timesheet-app"
  retention_in_days = 30
}

# Create AWS Secrets Manager secret
resource "aws_secretsmanager_secret" "timesheet_secrets" {
  name = "timesheet-app"
  
  tags = {
    Name = "timesheet-app-secrets"
    Description = "Secrets for Timesheet App"
  }
}

resource "aws_secretsmanager_secret_version" "timesheet_secrets" {
  secret_id = aws_secretsmanager_secret.timesheet_secrets.id
  secret_string = jsonencode({
    DATABASE_URL           = "mysql://timesheet_admin:${var.db_password}@${replace(aws_db_instance.main.endpoint, ":3306", "")}/timesheet"
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
  name = "timesheet-ecs-task-secrets-policy"
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
          aws_secretsmanager_secret.timesheet_secrets.arn
        ]
      }
    ]
  })
}

# Update ECS Task Definition to include all secrets
resource "aws_ecs_task_definition" "app" {
  family                   = "timesheet-app"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "timesheet-app"
      image     = "1234.dkr.ecr.${var.aws_region}.amazonaws.com/***REMOVED***/timesheet:latest"
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
          value = "http://${aws_lb.app.dns_name}/api/ipayroll/auth/callback"
        },
        {
          name  = "NEXTAUTH_URL",
          value = "http://${aws_lb.app.dns_name}"
        },
        {
          name  = "NODE_ENV",
          value = "production"
        }
      ]
      
      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = "${aws_secretsmanager_secret.timesheet_secrets.arn}:DATABASE_URL::"
        },
        {
          name      = "JIRA_API_TOKEN"
          valueFrom = "${aws_secretsmanager_secret.timesheet_secrets.arn}:JIRA_API_TOKEN::"
        },
        {
          name      = "JIRA_USER_EMAIL"
          valueFrom = "${aws_secretsmanager_secret.timesheet_secrets.arn}:JIRA_USER_EMAIL::"
        },
        {
          name      = "IPAYROLL_CLIENT_ID"
          valueFrom = "${aws_secretsmanager_secret.timesheet_secrets.arn}:IPAYROLL_CLIENT_ID::"
        },
        {
          name      = "IPAYROLL_CLIENT_SECRET"
          valueFrom = "${aws_secretsmanager_secret.timesheet_secrets.arn}:IPAYROLL_CLIENT_SECRET::"
        },
        {
          name      = "AZURE_AD_CLIENT_ID"
          valueFrom = "${aws_secretsmanager_secret.timesheet_secrets.arn}:AZURE_AD_CLIENT_ID::"
        },
        {
          name      = "AZURE_AD_CLIENT_SECRET"
          valueFrom = "${aws_secretsmanager_secret.timesheet_secrets.arn}:AZURE_AD_CLIENT_SECRET::"
        },
        {
          name      = "AZURE_AD_TENANT_ID"
          valueFrom = "${aws_secretsmanager_secret.timesheet_secrets.arn}:AZURE_AD_TENANT_ID::"
        },
        {
          name      = "NEXTAUTH_SECRET"
          valueFrom = "${aws_secretsmanager_secret.timesheet_secrets.arn}:NEXTAUTH_SECRET::"
        }
      ]
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.app.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "timesheet"
        }
      }
    }
  ])
}

# Application Load Balancer
resource "aws_lb" "app" {
  name               = "timesheet-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = [aws_subnet.main.id, aws_subnet.secondary.id]
  
  enable_deletion_protection = false
}

resource "aws_lb_target_group" "app" {
  name        = "timesheet-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"
  
  health_check {
    enabled             = true
    interval            = 30
    path                = "/api/health"
    port                = "traffic-port"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 10
    protocol            = "HTTP"
    matcher             = "200-399"
    startup_grace_period = 120
  }

  deregistration_delay = 0

  stickiness {
    enabled = false
    type    = "lb_cookie"
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.app.arn
  port              = 80
  protocol          = "HTTP"
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

# ECS Service
resource "aws_ecs_service" "app" {
  name            = "timesheet-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 1
  launch_type     = "FARGATE"
  force_new_deployment = true
  wait_for_steady_state = false
  
  deployment_minimum_healthy_percent = 0
  deployment_maximum_percent = 200
  
  network_configuration {
    subnets          = [aws_subnet.main.id, aws_subnet.secondary.id]
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = true
  }
  
  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "timesheet-app"
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

output "rds_endpoint" {
  value = aws_db_instance.main.endpoint
  description = "The connection endpoint for the RDS database"
} 
