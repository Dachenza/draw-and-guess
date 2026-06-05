#!/usr/bin/env bash
cd "$(dirname "$0")"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "========================================"
echo "  Draw & Guess - Linux 一键环境配置"
echo "========================================"

# --- Detect package manager ---
if command -v apt &>/dev/null; then
    PKG="apt"
    INSTALL="apt install -y"
    UPDATE="apt update"
elif command -v yum &>/dev/null; then
    PKG="yum"
    INSTALL="yum install -y"
    UPDATE="yum check-update"
elif command -v dnf &>/dev/null; then
    PKG="dnf"
    INSTALL="dnf install -y"
    UPDATE="dnf check-update"
elif command -v pacman &>/dev/null; then
    PKG="pacman"
    INSTALL="pacman -S --noconfirm"
    UPDATE="pacman -Sy"
else
    echo -e "${RED}[ERROR] Unsupported package manager${NC}"
    exit 1
fi
echo -e "${GREEN}[OK] Package manager: $PKG${NC}"

# --- Install git ---
if ! command -v git &>/dev/null; then
    echo "[INFO] Installing git..."
    $UPDATE >/dev/null 2>&1 || true
    $INSTALL git
fi
echo -e "${GREEN}[OK] git $(git --version | awk '{print $3}')${NC}"

# --- Install Node.js ---
if command -v node &>/dev/null; then
    NODE_VER=$(node -v | sed 's/v//')
    NODE_MAJOR=$(echo "$NODE_VER" | cut -d. -f1)
    echo -e "${GREEN}[OK] Node.js v$NODE_VER${NC}"
    if [ "$NODE_MAJOR" -lt 18 ]; then
        echo -e "${YELLOW}[WARN] Node.js v$NODE_VER is too old, upgrading to 18+...${NC}"
        NODE_NEED_UPGRADE=1
    fi
else
    NODE_NEED_UPGRADE=1
fi

if [ -n "$NODE_NEED_UPGRADE" ]; then
    # Check glibc version for Node.js compatibility
    GLIBC_VER=$(ldd --version 2>&1 | head -1 | grep -oE '[0-9]+\.[0-9]+' | head -1)
    GLIBC_MAJOR=$(echo "$GLIBC_VER" | cut -d. -f1)
    GLIBC_MINOR=$(echo "$GLIBC_VER" | cut -d. -f2)
    if [ "$GLIBC_MAJOR" -gt 2 ] || { [ "$GLIBC_MAJOR" = 2 ] && [ "$GLIBC_MINOR" -ge 28 ]; }; then
        NODE_MAJOR="22"
    else
        echo -e "${YELLOW}[INFO] glibc $GLIBC_VER detected, using Node.js 18.x (compatible)${NC}"
        NODE_MAJOR="18"
    fi
    echo "[INFO] Installing Node.js ${NODE_MAJOR}.x LTS..."
    if [ "$PKG" = "apt" ]; then
        curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
        $INSTALL nodejs
    elif [ "$PKG" = "yum" ] || [ "$PKG" = "dnf" ]; then
        curl -fsSL "https://rpm.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
        $INSTALL nodejs
    elif [ "$PKG" = "pacman" ]; then
        $INSTALL nodejs npm
    fi
    echo -e "${GREEN}[OK] Node.js $(node -v)${NC}"
fi

# --- Verify npm ---
if ! command -v npm &>/dev/null; then
    echo -e "${RED}[ERROR] npm not found${NC}"
    exit 1
fi
echo -e "${GREEN}[OK] npm $(npm -v)${NC}"

# --- Install project dependencies ---
echo ""
echo "----------------------------------------"
echo "  Installing project dependencies..."
echo "----------------------------------------"

for dir in "." "server" "client"; do
    if [ ! -d "$dir/node_modules" ]; then
        echo "[INFO] $dir/node_modules not found, running npm install..."
        (cd "$dir" && npm install)
        echo -e "${GREEN}[OK] $dir dependencies installed${NC}"
    else
        echo -e "${GREEN}[OK] $dir/node_modules exists${NC}"
    fi
done

echo ""
echo "========================================"
echo -e "  ${GREEN}Environment ready!${NC}"
echo "========================================"
echo ""
echo "Quick start:"
echo "  ./start.sh              # Start dev server"
echo "  ./stop.sh               # Stop dev server"
echo "  ./restart.sh            # Restart dev server"
echo ""
echo "Or run directly:"
echo "  npm run dev"
echo ""
echo "Then open http://localhost:5173 in your browser."
