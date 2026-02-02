# Start the Job Portal backend (FastAPI) on http://localhost:8000
# Run from backend folder: .\start-server.ps1

Set-Location $PSScriptRoot

if (-not (Test-Path ".env")) {
    Write-Host "No .env file found. Copy .env.example to .env and set MONGO_URL and DB_NAME." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "Created .env from .env.example. Edit .env and run this script again." -ForegroundColor Yellow
    }
    exit 1
}

Write-Host "Starting backend at http://localhost:8000 ..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop." -ForegroundColor Gray
python server.py
