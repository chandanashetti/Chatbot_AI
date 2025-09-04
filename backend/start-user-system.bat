@echo off
echo 🚀 Starting User Management System...
echo.

echo 📋 Step 1: Checking dependencies...
call npm list jsonwebtoken bcryptjs multer

echo.
echo 📋 Step 2: Killing any existing Node processes...
taskkill /F /IM node.exe 2>nul

echo.
echo 📋 Step 3: Starting server...
echo 💡 If server hangs, press Ctrl+C and check MongoDB connection
echo.

node server.js

pause
