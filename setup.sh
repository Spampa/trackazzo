#!/bin/bash

# Setup script for production deployment

echo "🐳 Setting up Trackazzo Bot with Docker..."

# Create necessary directories
mkdir -p data logs

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ File .env non trovato!"
    echo "📝 Crea il file .env con le seguenti variabili:"
    echo ""
    echo "BOT_TOKEN=your_telegram_bot_token"
    echo "WEBHOOK_URL=https://your-domain.com/webhook"
    echo "DATABASE_URL=file:./data/trackazzo.db"
    echo ""
    exit 1
fi

# Build and run with docker-compose
echo "🏗️ Building Docker image..."
docker-compose build

echo "🚀 Starting services..."
docker-compose up -d

echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if container is running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Trackazzo Bot is running!"
    echo "📊 Status: docker-compose ps"
    echo "📜 Logs: docker-compose logs -f"
    echo "🛑 Stop: docker-compose down"
else
    echo "❌ Failed to start services"
    echo "📜 Check logs: docker-compose logs"
    exit 1
fi
