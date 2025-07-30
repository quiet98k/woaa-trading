#!/bin/bash

set -e
set -o pipefail

if ! git diff-index --quiet HEAD --; then
  echo "⚠️  Uncommitted changes detected. Please commit or stash them first."
  exit 1
fi

echo "📥 Pulling latest changes from Git..."
git pull origin main

echo "🧹 Shutting down existing containers..."
sudo docker compose down --remove-orphans
sudo docker compose -f loki/docker-compose.yaml down --remove-orphans

echo "🧼 Pruning unused Docker resources..."
sudo docker system prune -f

echo "🔧 Rebuilding and starting containers..."
sudo docker compose up -d --build
sudo docker compose -f loki/docker-compose.yaml up -d --build

echo "📊 Container status:"
sudo docker compose ps
sudo docker compose -f loki/docker-compose.yaml ps

echo "✅ Deployment complete."

read -p "📜 Tail logs now? (y/N) " yn
if [[ "$yn" == "y" || "$yn" == "Y" ]]; then
  echo "Which logs do you want to follow?"
  select option in "Main stack" "Loki stack" "Both"; do
    case $option in
      "Main stack") sudo docker compose logs -f ;;
      "Loki stack") sudo docker compose -f loki/docker-compose.yaml logs -f ;;
      "Both") 
        sudo docker compose logs -f &
        sudo docker compose -f loki/docker-compose.yaml logs -f
        ;;
    esac
    break
  done
fi
