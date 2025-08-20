# Chatbot AI - Server Startup Script
# This script starts both frontend and backend servers

Write-Host "🚀 Starting Chatbot AI Servers..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Start Backend Server
Write-Host "📚 Starting Backend Server (Port 5000)..." -ForegroundColor Yellow
Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; Write-Host '🔧 Backend Server Starting...' -ForegroundColor Cyan; node server.js"

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start Frontend Server  
Write-Host "🎨 Starting Frontend Server (Port 3000)..." -ForegroundColor Yellow
Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; Write-Host '🎨 Frontend Server Starting...' -ForegroundColor Cyan; npm run dev"

Write-Host ""
Write-Host "🎉 Servers are starting!" -ForegroundColor Green
Write-Host "📖 Backend API: http://localhost:5000" -ForegroundColor Cyan
Write-Host "🌐 Frontend App: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚡ Make sure Ollama is running on http://localhost:11434" -ForegroundColor Yellow
Write-Host "📝 Check the opened terminal windows for server logs" -ForegroundColor Gray
