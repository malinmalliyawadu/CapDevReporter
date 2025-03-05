variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t2.micro"
}

variable "ubuntu_ami" {
  description = "Ubuntu 22.04 LTS AMI ID"
  type        = string
  default     = "ami-0c7217cdde317cfec" # Ubuntu 22.04 LTS in us-east-1
}

variable "ssh_public_key_path" {
  description = "Path to the SSH public key for EC2 instance access"
  type        = string
}

variable "your_ip_address" {
  description = "Your IP address for SSH access (CIDR format)"
  type        = string
}

variable "db_username" {
  description = "Username for the RDS PostgreSQL instance"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Password for the RDS PostgreSQL instance"
  type        = string
  sensitive   = true
} 