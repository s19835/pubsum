# ──────────────────────────────────────────────────────────────────
#  pubsum — Windows PowerShell install script
#  Usage:  iwr -useb https://raw.githubusercontent.com/s19835/pubsum/main/scripts/install.ps1 | iex
# ──────────────────────────────────────────────────────────────────

$ErrorActionPreference = "Stop"

function Write-Info    { param($msg) Write-Host "  [i]  $msg" -ForegroundColor Cyan }
function Write-Success { param($msg) Write-Host "  [v]  $msg" -ForegroundColor Green }
function Write-Warn    { param($msg) Write-Host "  [!]  $msg" -ForegroundColor Yellow }
function Write-Fail    { param($msg) Write-Host "  [x]  $msg" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "  pubsum installer" -ForegroundColor White -BackgroundColor DarkBlue
Write-Host "  Academic Publication Summariser"
Write-Host ""

# ── Check for Node.js ─────────────────────────────────────────────
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-Warn "Node.js not found."
    Write-Host ""
    Write-Host "  Install Node.js (LTS) from: https://nodejs.org"
    Write-Host "  Or use winget:"
    Write-Host "    winget install OpenJS.NodeJS.LTS"
    Write-Host ""
    Write-Host "  Then re-run this script."
    exit 1
}

$nodeVersion = (node --version).TrimStart("v")
$major = [int]($nodeVersion.Split(".")[0])

if ($major -lt 16) {
    Write-Fail "Node.js >= 16 is required. You have v$nodeVersion. Download LTS from https://nodejs.org"
}

Write-Info "Node.js v$nodeVersion found."

# ── Check for npm ─────────────────────────────────────────────────
$npmCmd = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npmCmd) {
    Write-Fail "npm not found. Re-install Node.js from https://nodejs.org"
}

# ── Install pubsum ────────────────────────────────────────────────
Write-Info "Installing pubsum..."
npm install -g @decoding/pubsum

# ── Verify ───────────────────────────────────────────────────────
$pubCmd = Get-Command pub -ErrorAction SilentlyContinue
if ($pubCmd) {
    Write-Host ""
    Write-Success "pubsum installed successfully!"
    Write-Host ""
    Write-Host "  Run: " -NoNewline
    Write-Host "pub help" -ForegroundColor Cyan
    Write-Host "  Run: " -NoNewline
    Write-Host 'pub search "your topic"' -ForegroundColor Cyan
    Write-Host ""
} else {
    $npmPrefix = (npm config get prefix)
    Write-Warn "Installed, but '$npmPrefix' may not be on your PATH."
    Write-Host ""
    Write-Host "  Add this folder to your PATH in System Environment Variables:"
    Write-Host "    $npmPrefix" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Or run from PowerShell:"
    Write-Host "    `$env:PATH += `";$npmPrefix`"" -ForegroundColor Cyan
    Write-Host ""
}
