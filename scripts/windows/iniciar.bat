@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title KAMBA Many - Nao feche esta janela
chcp 65001 >nul

set "NODE_ENV=production"
if not defined PORT set "PORT=3000"
if not defined HOSTNAME set "HOSTNAME=127.0.0.1"

if exist "%~dp0config.env" (
    for /f "usebackq eol=# tokens=1,* delims==" %%A in ("%~dp0config.env") do (
        if not "%%A"=="" set "%%A=%%B"
    )
)

set "NODE_EXE=%~dp0runtime\node.exe"
if not exist "%NODE_EXE%" set "NODE_EXE=node"

set "APP_URL=http://127.0.0.1:%PORT%/"

powershell -NoProfile -Command "try { Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 '%APP_URL%' | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if %ERRORLEVEL%==0 (
    start "" "%APP_URL%"
    exit /b 0
)

echo.
echo   KAMBA Many - O Amigo do Seu Negocio
echo   A iniciar o sistema de producao...
echo   Nao feche esta janela enquanto estiver a usar o POS.
echo.

start "" /b powershell -NoProfile -ExecutionPolicy Bypass -Command "for ($i=0; $i -lt 90; $i++) { try { Invoke-WebRequest -UseBasicParsing -TimeoutSec 1 '%APP_URL%' | Out-Null; Start-Process '%APP_URL%'; break } catch { Start-Sleep -Milliseconds 500 } }"

"%NODE_EXE%" "%~dp0start-server.js"
set "EXIT_CODE=%ERRORLEVEL%"

echo.
if not "%EXIT_CODE%"=="0" (
    echo   O servidor terminou com erro. Veja kamba.log nesta pasta.
    pause
)
exit /b %EXIT_CODE%
