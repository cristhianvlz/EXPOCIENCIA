@echo off
title Sistema de Evaluacion - Iniciando...
color 0A

echo ================================================
echo   SISTEMA DE GESTION DE PROYECTOS DE GRADO
echo ================================================
echo.

REM ── Verificar que el celular este conectado (opcional) ──────────────
echo [1/3] Verificando dispositivos conectados...
where adb >nul 2>&1
if %errorlevel%==0 (
    adb devices
) else (
    echo     [INFO] adb no encontrado - no se necesita para Wi-Fi
)
echo.

REM ── Iniciar Backend Django ───────────────────────────────────────────
echo [2/3] Iniciando Backend (Django)...
cd /d "%~dp0backend"
start "Backend Django" cmd /k "call venv\Scripts\activate && python manage.py runserver 0.0.0.0:8000"
timeout /t 3 /nobreak >nul
echo     Backend iniciado en http://192.168.100.50:8000
echo.

REM ── Iniciar Frontend React ───────────────────────────────────────────
echo [3/3] Iniciando Frontend (React)...
cd /d "%~dp0frontend"
start "Frontend React" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul
echo     Frontend iniciado en http://localhost:5173
echo.

echo ================================================
echo   TODO LISTO
echo ================================================
echo.
echo   Backend:  http://192.168.100.50:8000
echo   Frontend: http://localhost:5173
echo   App movil: conectar al Wi-Fi de esta PC
echo.
echo   Para cerrar todo, cierra las ventanas abiertas
echo   o presiona Ctrl+C en cada una.
echo.
pause
