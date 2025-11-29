#!/bin/bash

echo "🚀 Setting up WataOmi NestJS Backend..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Please create one from .env.example"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate migration
echo "🔄 Generating database migration..."
npm run migration:generate -- src/database/migrations/InitialWataomiMigration

# Run migrations
echo "🗄️  Running migrations..."
npm run migration:run

echo "✅ Setup complete!"
echo ""
echo "To start the server:"
echo "  npm run start:dev"
echo ""
echo "API will be available at: http://localhost:8000"
echo "Swagger docs at: http://localhost:8000/docs"
