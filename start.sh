#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

echo "========================================"
echo "  Draw & Guess - 环境检查"
echo "========================================"

# --- Check Node.js ---
if ! command -v node &>/dev/null; then
    echo "[ERROR] Node.js not found. Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

NODE_VER=$(node -v | sed 's/v//')
NODE_MAJOR=$(echo "$NODE_VER" | cut -d. -f1)
if [ "$NODE_MAJOR" -lt 18 ]; then
    echo "[ERROR] Node.js version >=18 required, current: v$NODE_VER"
    exit 1
fi
echo "[OK] Node.js v$NODE_VER"

# --- Check dependencies ---
if [ ! -d "node_modules" ]; then
    echo "[INFO] Installing root dependencies..."
    npm install
fi

if [ ! -d "server/node_modules" ]; then
    echo "[INFO] Installing server dependencies..."
    (cd server && npm install)
fi

if [ ! -d "client/node_modules" ]; then
    echo "[INFO] Installing client dependencies..."
    (cd client && npm install)
fi
echo "[OK] Dependencies installed"

# --- Check if already running ---
if lsof -i :8081 -sTCP:LISTEN 2>/dev/null | grep -q node; then
    echo "[WARN] Port 8081 already in use - server may already be running"
fi

echo ""
echo "========================================"
echo "  Starting Draw & Guess..."
echo "========================================"
npm run dev
