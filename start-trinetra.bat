@echo off
echo ========================================================
echo        Starting Trinetra-3D (SIH26158 NTRO)
echo ========================================================
echo.

echo [1/2] Installing dependencies if needed...
cd /d "%~dp0backend"
if not exist node_modules (
    echo Installing backend packages...
    call npm install
)
start "Trinetra-3D Backend (Port 5000)" cmd /k "node src/server.js"

echo [2/2] Launching frontend...
cd /d "%~dp0frontend"
if not exist node_modules (
    echo Installing frontend packages...
    call npm install
)
start "Trinetra-3D Frontend (Port 3000)" cmd /k "npm run dev"

echo.
echo ========================================================
echo Both Backend & Frontend servers are launching!
echo Frontend will be live at: http://localhost:3000
echo Backend API will be live at: http://localhost:5000
echo ========================================================
pause
