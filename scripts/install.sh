#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────
#  pubsum — Linux / macOS install script
#  Usage:  curl -fsSL https://raw.githubusercontent.com/s19835/pubsum/main/scripts/install.sh | bash
# ──────────────────────────────────────────────────────────────────
set -e

RESET="\033[0m"
BOLD="\033[1m"
GREEN="\033[32m"
CYAN="\033[36m"
RED="\033[31m"
YELLOW="\033[33m"

info()    { echo -e "  ${CYAN}ℹ${RESET}  $*"; }
success() { echo -e "  ${GREEN}✔${RESET}  $*"; }
warn()    { echo -e "  ${YELLOW}⚠${RESET}  $*"; }
error()   { echo -e "  ${RED}✖${RESET}  $*" >&2; exit 1; }

echo ""
echo -e "  ${BOLD}pubsum installer${RESET}"
echo -e "  Academic Publication Summariser"
echo ""

# ── Check for Node.js ─────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  warn "Node.js not found. Attempting to install via nvm..."

  if ! command -v curl &>/dev/null; then
    error "curl is required. Install it with: sudo apt install curl   OR   brew install curl"
  fi

  # Install nvm if not present
  if [ ! -d "$HOME/.nvm" ]; then
    info "Installing nvm..."
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  fi

  # Load nvm in this shell session
  export NVM_DIR="$HOME/.nvm"
  # shellcheck source=/dev/null
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

  nvm install --lts
  nvm use --lts
fi

# ── Verify Node version ───────────────────────────────────────────
NODE_VERSION=$(node --version | sed 's/v//')
MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)

if [ "$MAJOR" -lt 16 ]; then
  error "Node.js ≥ 16 is required. You have v${NODE_VERSION}. Run: nvm install --lts"
fi

info "Node.js v${NODE_VERSION} ✔"

# ── Check for npm ─────────────────────────────────────────────────
if ! command -v npm &>/dev/null; then
  error "npm not found. Re-install Node.js from https://nodejs.org"
fi

# ── Install pubsum ────────────────────────────────────────────────
info "Installing pubsum..."
npm install -g @decoding/pubsum

# ── Verify ───────────────────────────────────────────────────────
if command -v pub &>/dev/null; then
  echo ""
  success "pubsum installed successfully!"
  echo ""
  echo -e "  Run ${CYAN}pub help${RESET} to get started."
  echo -e "  Run ${CYAN}pub search \"your topic\"${RESET} to search publications."
  echo ""
else
  # npm global bin may not be on PATH yet
  NPM_BIN=$(npm config get prefix)/bin
  warn "Installed, but ${NPM_BIN} may not be on your PATH."
  echo ""
  echo "  Add this to your ~/.bashrc or ~/.zshrc:"
  echo -e "    ${CYAN}export PATH=\"\$PATH:${NPM_BIN}\"${RESET}"
  echo ""
  echo "  Then reload your shell:  source ~/.bashrc"
  echo ""
fi
