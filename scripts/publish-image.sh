#!/bin/bash
set -e

# Configuration
AWS_REGION="ap-southeast-2"
ECR_REGISTRY="1234.dkr.ecr.${AWS_REGION}.amazonaws.com"
REPOSITORY_NAME="***REMOVED***/timesheet"
IMAGE_TAG="latest"

echo "🚀 Publishing image to ECR..."

# Create repository if it doesn't exist
echo "📦 Ensuring repository exists..."
aws ecr describe-repositories --repository-names ${REPOSITORY_NAME} --region ${AWS_REGION} || \
    aws ecr create-repository --repository-name ${REPOSITORY_NAME} --region ${AWS_REGION}

# Login to ECR
echo "🔑 Logging in to ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}

# Build the image
echo "🏗️ Building Docker image..."
docker build -t ${REPOSITORY_NAME}:${IMAGE_TAG} .

# Tag the image
echo "🏷️ Tagging image..."
docker tag ${REPOSITORY_NAME}:${IMAGE_TAG} ${ECR_REGISTRY}/${REPOSITORY_NAME}:${IMAGE_TAG}

# Push the image
echo "⬆️ Pushing image to ECR..."
docker push ${ECR_REGISTRY}/${REPOSITORY_NAME}:${IMAGE_TAG}

echo "✅ Image published successfully!"
echo "Image URL: ${ECR_REGISTRY}/${REPOSITORY_NAME}:${IMAGE_TAG}" 