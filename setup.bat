@echo off
REM CoCreate Setup Script for Windows

echo 🚀 CoCreate Self-Hosted Setup
echo ==============================

REM Check Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker not found. Install from https://docker.com
    exit /b 1
)

echo ✅ Docker found

REM Check Docker Compose
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose not found. Install from https://docker.com
    exit /b 1
)

echo ✅ Docker Compose found

REM Check Node
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found. Install from https://nodejs.org
    exit /b 1
)

echo ✅ Node.js found
node --version

REM Setup backend
echo.
echo 📦 Setting up backend...
cd server
if not exist .env (
    copy .env.example .env
    echo ✅ Created server\.env
)

call npm install --silent
echo ✅ Backend dependencies installed
cd ..

REM Setup frontend
echo.
echo 📦 Setting up frontend...
call npm install --silent
echo ✅ Frontend dependencies installed

REM Start Docker
echo.
echo 🐳 Starting Docker containers...
call docker-compose down -v 2>nul
call docker-compose up -d

REM Wait for services
echo.
echo ⏳ Waiting for services to start...
timeout /t 10

REM Check status
echo.
echo 📊 Service Status:
call docker-compose ps

echo.
echo ✅ Setup complete!
echo.
echo 🌐 Open in browser:
echo    Frontend: http://localhost:5173
echo    API: http://localhost:3000
echo.
echo 📝 To view logs:
echo    docker-compose logs -f server
echo    docker-compose logs -f postgres
echo.
echo 🛑 To stop everything:
echo    docker-compose down
echo.
pause
