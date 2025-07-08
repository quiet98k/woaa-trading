#!/bin/bash

set -e  # Exit immediately if a command fails
set -o pipefail


echo "📥 Pulling latest changes from Git..."
git pull origin main

echo "🧹 Shutting down existing containers..."
docker compose down

echo "🔧 Rebuilding and starting containers..."
docker compose up -d --build

echo "✅ Deployment complete."
