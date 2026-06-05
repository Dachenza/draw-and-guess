@echo off
cd /d "%~dp0"
echo Stopping Draw & Guess...
taskkill /f /im node.exe >nul 2>&1
echo Stopped.
