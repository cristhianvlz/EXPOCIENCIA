@echo off
title JARVIS - Sistema Expociencia

echo.
echo  ================================================
echo    JARVIS - SISTEMA EXPOCIENCIA
echo    Backend  /  Frontend  /  App Tribunal
echo  ================================================
echo.

echo  [1/3] Iniciando Backend Django en 0.0.0.0:8000 ...
start "JARVIS - Backend Django" cmd /k "cd /d %~dp0backend && venv\Scripts\activate && python manage.py runserver 0.0.0.0:8000"

echo  [2/3] Iniciando Frontend React en puerto 3000 ...
start "JARVIS - Frontend React" cmd /k "cd /d %~dp0frontend && npm start"

echo  [3/3] Abriendo navegador en 8 segundos ...
timeout /t 8 /nobreak > NUL
start http://localhost:3000

echo.
echo  ================================================
echo   Backend  ->  http://192.168.100.8:8000
echo   Frontend ->  http://192.168.100.8:3000
echo  ------------------------------------------------
echo   App Tribunal: conecta el celular al mismo WiFi
echo   Credencial demo: usuario=12345 / pass=12345
echo  ================================================
echo.
echo  Puedes cerrar esta ventana. Los servidores siguen
echo  corriendo en sus propias ventanas.
echo.
pause
