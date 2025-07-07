# Setup script for Windows production deployment

Write-Host "🐳 Setting up Trackazzo Bot with Docker..." -ForegroundColor Cyan

# Create necessary directories
if (!(Test-Path "data")) { New-Item -ItemType Directory -Path "data" }
if (!(Test-Path "logs")) { New-Item -ItemType Directory -Path "logs" }

# Check if .env exists
if (!(Test-Path ".env")) {
    Write-Host "❌ File .env non trovato!" -ForegroundColor Red
    Write-Host "📝 Crea il file .env con le seguenti variabili:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "BOT_TOKEN=your_telegram_bot_token"
    Write-Host "WEBHOOK_URL=https://your-domain.com/webhook"
    Write-Host "DATABASE_URL=file:./data/trackazzo.db"
    Write-Host ""
    exit 1
}

# Build and run with docker-compose
Write-Host "🏗️ Building Docker image..." -ForegroundColor Yellow
docker-compose build

Write-Host "🚀 Starting services..." -ForegroundColor Green
docker-compose up -d

Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check if container is running
$status = docker-compose ps
if ($status -match "Up") {
    Write-Host "✅ Trackazzo Bot is running!" -ForegroundColor Green
    Write-Host "📊 Status: docker-compose ps" -ForegroundColor Cyan
    Write-Host "📜 Logs: docker-compose logs -f" -ForegroundColor Cyan
    Write-Host "🛑 Stop: docker-compose down" -ForegroundColor Cyan
} else {
    Write-Host "❌ Failed to start services" -ForegroundColor Red
    Write-Host "📜 Check logs: docker-compose logs" -ForegroundColor Yellow
    exit 1
}
