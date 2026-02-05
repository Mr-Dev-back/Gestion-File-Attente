#!/bin/bash

# Configuration
REPO_URL="https://github.com/Mr-Dev-back/Gestion-File-Attente.git"
PROJECT_DIR="PROJET-GFA"
ENV_FILE=".env.prod"

echo "Starting Deployment..."

# 1. Handle Repository
if [ ! -d ".git" ]; then
    echo "This directory is not a Git repository. Re-initializing or cloning might be needed."
    echo "Attempting to sync with: $REPO_URL"
    # If the user is running this script from outside the project or wants to reset
    # We will assume they want to ensure origin is set correctly if it is a git repo
    # But since it's NOT a git repo yet, let's offer a way to initialize it or just pull if possible
    git init
    git remote add origin $REPO_URL
    git fetch
    git checkout -f main
else
    echo "Pulling latest code from $REPO_URL..."
    git pull origin main
fi

# 2. Build and start containers
echo "Building and starting containers using $ENV_FILE..."
if [ ! -f "$ENV_FILE" ]; then
    echo "Error: $ENV_FILE not found! Please create it from the template."
    exit 1
fi

docker-compose --env-file $ENV_FILE -f docker-compose.prod.yml up -d --build

# 3. Run database migrations
echo "Running database migrations..."   
docker-compose --env-file $ENV_FILE -f docker-compose.prod.yml exec -T backend npm run db:migrate

# 4. Clean up unused images
echo "Cleaning up..."
docker image prune -f

echo "Deployment Complete! Application is running."
