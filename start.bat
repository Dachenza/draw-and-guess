@echo off
cd /d "%~dp0"

echo ========================================
echo   Draw ^& Guess - 环境检查
echo ========================================

REM --- Check Node.js ---
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)

for /f "tokens=1-3 delims=." %%a in ('node -v') do set NODE_VER=%%a
set NODE_NUM=%NODE_VER:~1%
if %NODE_NUM% LSS 18 (
    echo [ERROR] Node.js version ^>=18 required, current: %NODE_VER%
    pause
    exit /b 1
)
echo [OK] Node.js %NODE_VER%

REM --- Check dependencies ---
if not exist "node_modules" (
    echo [INFO] Installing root dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed
        pause
        exit /b 1
    )
)
:check_server
if not exist "server\node_modules" (
    echo [INFO] Installing server dependencies...
    cd server
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Server npm install failed
        pause
        exit /b 1
    )
    cd ..
)
:check_client
if not exist "client\node_modules" (
    echo [INFO] Installing client dependencies...
    cd client
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Client npm install failed
        pause
        exit /b 1
    )
    cd ..
)
echo [OK] Dependencies installed

REM --- Port check ---
echo.
echo ========================================
echo   Starting Draw ^& Guess...
echo ========================================
start "DrawAndGuess" cmd /c "npm run dev"
echo.
echo Server: http://localhost:8081
echo Client: http://localhost:5173
echo.
echo Use stop.bat to stop.
