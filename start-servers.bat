@echo off
echo 🚀 Starting Chatbot AI Servers...
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

echo ✅ Node.js is installed
echo.

:: Start Backend Server
echo 📚 Starting Backend Server (Port 5000)...
start "Backend Server" cmd /k "cd /d %~dp0backend && echo 🔧 Backend Server Starting... && node server.js"

:: Wait for backend to start
timeout /t 3 /nobreak >nul

:: Start Frontend Server
echo 🎨 Starting Frontend Server (Port 3000)...
start "Frontend Server" cmd /k "cd /d %~dp0 && echo 🎨 Frontend Server Starting... && npm run dev"

echo.
echo 🎉 Servers are starting!
echo 📖 Backend API: http://localhost:5000
echo 🌐 Frontend App: http://localhost:3000
echo.
echo ⚡ Make sure Ollama is running on http://localhost:11434
echo 📝 Check the opened terminal windows for server logs
echo.
pause
