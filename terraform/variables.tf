variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-southeast-2"
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
  description = "Your IP address for ALB access (CIDR format)"
  type        = string
}

variable "db_password" {
  description = "Password for the RDS instance"
  type        = string
  sensitive   = true
}

variable "ipayroll_client_id" {
  description = "iPayroll OAuth client ID"
  type        = string
  sensitive   = true
}

variable "ipayroll_client_secret" {
  description = "iPayroll OAuth client secret"
  type        = string
  sensitive   = true
}

variable "jira_api_token" {
  description = "Jira API token"
  type        = string
  sensitive   = true
}

variable "jira_user_email" {
  description = "Jira user email"
  type        = string
}

variable "azure_ad_client_id" {
  description = "Azure AD client ID for authentication"
  type        = string
  sensitive   = true
}

variable "azure_ad_client_secret" {
  description = "Azure AD client secret for authentication"
  type        = string
  sensitive   = true
}

variable "azure_ad_tenant_id" {
  description = "Azure AD tenant ID for authentication"
  type        = string
  sensitive   = true
}

variable "nextauth_secret" {
  description = "Secret key for NextAuth.js"
  type        = string
  sensitive   = true
} 