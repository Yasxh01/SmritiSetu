# SmritiSetu NER PowerShell Full-Stack Launcher
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "    SmritiSetu NER (স্মৃতি সেতু) Full-Stack Launcher" -ForegroundColor Yellow
Write-Host "===================================================" -ForegroundColor Cyan

Set-Location $PSScriptRoot

Write-Host "`n[1/3] Seeding demo patient data..." -ForegroundColor Green
python -m server.scripts.seed_demo_data

Write-Host "`n[2/3] Launching FastAPI Backend on http://localhost:8000 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python -m uvicorn server.main:app --reload --port 8000"

Start-Sleep -Seconds 2

Write-Host "`n[3/3] Launching Vite Frontend on http://localhost:5173 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

Start-Sleep -Seconds 3

Write-Host "`nOpening browser at http://localhost:5173 ..." -ForegroundColor Cyan
Start-Process "http://localhost:5173"

Write-Host "`nAll services active!" -ForegroundColor Green
Write-Host "Frontend:     http://localhost:5173" -ForegroundColor White
Write-Host "Backend Docs: http://localhost:8000/docs" -ForegroundColor White
