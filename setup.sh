#!/bin/bash

# CoCreate Setup Script for macOS/Linux

echo "🚀 CoCreate Self-Hosted Setup"
echo "=============================="

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Install from https://docker.com"
    exit 1
fi

echo "✅ Docker found"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose not found. Install from https://docker.com"
    exit 1
fi

echo "✅ Docker Compose found"

# Check Node
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install from https://nodejs.org"
    exit 1
fi

echo "✅ Node.js found ($(node --version))"

# Setup backend
echo ""
echo "📦 Setting up backend..."
cd server
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created server/.env"
fi

npm install --silent
echo "✅ Backend dependencies installed"
cd ..

# Setup frontend
echo ""
echo "📦 Setting up frontend..."
npm install --silent
echo "✅ Frontend dependencies installed"

# Start Docker
echo ""
echo "🐳 Starting Docker containers..."
docker-compose down -v 2>/dev/null
docker-compose up -d

# Wait for services
echo ""
echo "⏳ Waiting for services to start..."
sleep 10

# Check status
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "✅ Setup complete!"
echo ""
echo "🌐 Open in browser:"
echo "   Frontend: http://localhost:5173"
echo "   API: http://localhost:3000"
echo ""
echo "📝 To view logs:"
echo "   docker-compose logs -f server"
echo "   docker-compose logs -f postgres"
echo ""
echo "🛑 To stop everything:"
echo "   docker-compose down"
echo ""
