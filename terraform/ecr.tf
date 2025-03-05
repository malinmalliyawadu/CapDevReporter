data "aws_ecr_repository" "timesheet" {
  name = "***REMOVED***/timesheet"
}

resource "aws_ecr_repository_policy" "timesheet_policy" {
  repository = data.aws_ecr_repository.timesheet.name
  policy     = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowPull"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.ecs_task_execution_role.arn
        }
        Action = [
          "ecr:BatchGetImage",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchCheckLayerAvailability"
        ]
      }
    ]
  })
}

# ECR Lifecycle Policy to limit image count
resource "aws_ecr_lifecycle_policy" "timesheet_lifecycle" {
  repository = data.aws_ecr_repository.timesheet.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep only the last 10 images"
        selection = {
          tagStatus     = "any"
          countType     = "imageCountMoreThan"
          countNumber   = 10
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
} 