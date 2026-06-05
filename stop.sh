#!/usr/bin/env bash
cd "$(dirname "$0")"
echo "Stopping Draw & Guess..."

if [ -f ".pid" ]; then
    PID=$(cat ".pid")
    if kill -0 "$PID" 2>/dev/null; then
        kill "$PID" 2>/dev/null
        sleep 1
        kill -9 "$PID" 2>/dev/null
    fi
    rm -f ".pid"
fi

# Fallback: kill any remaining node processes from this project
pkill -f "node.*index.js" 2>/dev/null
pkill -f "node.*vite" 2>/dev/null
echo "Stopped."
