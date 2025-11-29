# PowerShell setup script for Windows

Write-Host "🚀 Setting up WataOmi NestJS Backend..." -ForegroundColor Green

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "⚠️  .env file not found. Please create one from .env.example" -ForegroundColor Yellow
    exit 1
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
npm install

# Generate migration
Write-Host "🔄 Generating database migration..." -ForegroundColor Cyan
npm run migration:generate -- src/database/migrations/InitialWataomiMigration

# Run migrations
Write-Host "🗄️  Running migrations..." -ForegroundColor Cyan
npm run migration:run

Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To start the server:" -ForegroundColor Yellow
Write-Host "  npm run start:dev" -ForegroundColor White
Write-Host ""
Write-Host "API will be available at: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Swagger docs at: http://localhost:8000/docs" -ForegroundColor Cyan
