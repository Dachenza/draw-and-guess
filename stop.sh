#!/usr/bin/env bash
echo "Stopping Draw & Guess..."
pkill -f "node.*index.js" 2>/dev/null
pkill -f "node.*vite" 2>/dev/null
echo "Stopped."
