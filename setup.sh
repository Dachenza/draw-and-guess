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

# --- Install Node.js (via nvm) ---
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
    echo "[INFO] Installing Node.js 18 LTS via nvm..."

    # Install build dependencies
    if [ "$PKG" = "yum" ] || [ "$PKG" = "dnf" ]; then
        $UPDATE >/dev/null 2>&1 || true
        $INSTALL curl ca-certificates xz 2>/dev/null || true
    elif [ "$PKG" = "apt" ]; then
        $UPDATE >/dev/null 2>&1 || true
        $INSTALL curl ca-certificates xz-utils 2>/dev/null || true
    fi

    # Detect architecture
    ARCH=$(uname -m)
    case "$ARCH" in
        x86_64)  NODE_ARCH="x64" ;;
        aarch64) NODE_ARCH="arm64" ;;
        armv7l)  NODE_ARCH="armv7l" ;;
        *)       NODE_ARCH="x64" ;;
    esac

    # Determine best Node.js version based on glibc
    GLIBC_VER=$(ldd --version 2>&1 | head -1 | grep -oE '[0-9]+\.[0-9]+' | head -1)
    GLIBC_MAJOR=$(echo "$GLIBC_VER" | cut -d. -f1)
    GLIBC_MINOR=$(echo "$GLIBC_VER" | cut -d. -f2)
    if [ "$GLIBC_MAJOR" -gt 2 ] || { [ "$GLIBC_MAJOR" = 2 ] && [ "$GLIBC_MINOR" -ge 28 ]; }; then
        NODE_VERSION="22.14.0"
    else
        echo -e "${YELLOW}[INFO] glibc $GLIBC_VER detected, using Node.js 18.20.7 (compatible)${NC}"
        NODE_VERSION="18.20.7"
    fi

    # Download and install Node.js binary directly
    echo "[INFO] Downloading Node.js $NODE_VERSION ($NODE_ARCH)..."
    NODE_URL="https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-${NODE_ARCH}.tar.xz"
    INSTALL_DIR="/usr/local/lib/nodejs"

    rm -rf "$INSTALL_DIR" 2>/dev/null || true
    mkdir -p "$INSTALL_DIR"

    curl -fsSL "$NODE_URL" | tar -xJ -C "$INSTALL_DIR" --strip-components=1

    # Symlink binaries
    for bin in node npm npx; do
        ln -sf "$INSTALL_DIR/bin/$bin" "/usr/local/bin/$bin" 2>/dev/null || true
    done

    hash -r
    echo -e "${GREEN}[OK] Node.js $(node -v), npm $(npm -v)${NC}"
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
