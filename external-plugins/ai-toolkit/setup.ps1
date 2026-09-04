# God's Eye View — AI Toolkit Setup
# Run: powershell -ExecutionPolicy Bypass -File ai-toolkit/setup.ps1

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host " God's Eye View — AI Toolkit Setup  " -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check Python
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Python not found. Install Python 3.10+ first." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] $pythonVersion" -ForegroundColor Green

# Create virtual environment
$venvPath = Join-Path $PSScriptRoot ".venv"
if (-not (Test-Path $venvPath)) {
    Write-Host "[...] Creating virtual environment..." -ForegroundColor Yellow
    python -m venv $venvPath
    Write-Host "[OK] Virtual environment created at $venvPath" -ForegroundColor Green
} else {
    Write-Host "[OK] Virtual environment already exists" -ForegroundColor Green
}

# Activate and install
$activateScript = Join-Path $venvPath "Scripts\Activate.ps1"
Write-Host "[...] Activating virtual environment..." -ForegroundColor Yellow
& $activateScript

Write-Host "[...] Installing AI toolkit dependencies..." -ForegroundColor Yellow
$reqFile = Join-Path $PSScriptRoot "requirements.txt"
pip install -r $reqFile --quiet

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "====================================" -ForegroundColor Green
    Write-Host " AI Toolkit Ready!                  " -ForegroundColor Green
    Write-Host "====================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Installed tools:" -ForegroundColor Cyan
    Write-Host "  - CrewAI        (multi-agent orchestration)"
    Write-Host "  - LangGraph     (workflow orchestration)"
    Write-Host "  - DSPy          (prompt optimization)"
    Write-Host "  - Graphiti      (temporal knowledge graphs)"
    Write-Host "  - Giskard       (AI security testing)"
    Write-Host "  - LangChain     (core AI framework)"
    Write-Host ""
    Write-Host "To activate later: $activateScript" -ForegroundColor Yellow
} else {
    Write-Host "[ERROR] Some packages failed to install. Check errors above." -ForegroundColor Red
}
