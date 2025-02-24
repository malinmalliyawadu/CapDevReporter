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
          AWS = aws_iam_role.ec2_role.arn
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