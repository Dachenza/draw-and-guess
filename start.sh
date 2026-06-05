#!/usr/bin/env bash
cd "$(dirname "$0")"
echo "Starting Draw & Guess..."
nohup npm run dev > /dev/null 2>&1 &
echo "Server started on http://localhost:8081"
echo "Client started on http://localhost:5173"
echo ""
echo "Use stop.sh to stop the server."
