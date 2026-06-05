@echo off
cd /d "%~dp0"
echo Starting Draw & Guess...
start "DrawAndGuess" cmd /c "npm run dev"
echo Server started on http://localhost:8081
echo Client started on http://localhost:5173
echo.
echo Use stop.bat to stop the server.
