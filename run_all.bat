@echo off
title SmritiSetu NER - Launcher
echo ===================================================
echo     SmritiSetu NER (স্মৃতি সেতু) Full-Stack Launcher
echo ===================================================
echo.

cd /d "%~dp0"

echo [1/3] Seeding demo patient data (Assamese 30-day longitudinal timeline)...
py -3.11 -m server.scripts.seed_demo_data
echo [OK] Database ready.
echo.

echo [2/3] Launching FastAPI Backend on http://localhost:8000 ...
start "SmritiSetu Backend (FastAPI)" cmd /k "py -3.11 -m uvicorn server.main:app --reload --port 8000"

timeout /t 2 >nul

echo [3/3] Launching Vite Frontend on http://localhost:5173 ...
start "SmritiSetu Frontend (Vite React)" cmd /k "npm run dev"

timeout /t 3 >nul

echo Opening browser to http://localhost:5173 ...
start http://localhost:5173

echo.
echo ===================================================
echo   System running!
echo   - Frontend: http://localhost:5173
echo   - Backend Docs: http://localhost:8000/docs
echo ===================================================
pause
