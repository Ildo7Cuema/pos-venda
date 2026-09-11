@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Empacotar KAMBA POS
chcp 65001 >nul

echo.
echo  ============================================
echo   KAMBA Money - Criar instalador Windows
echo  ============================================
echo.
echo  Este passo corre nesta maquina de desenvolvimento.
echo  No fim, use a pasta dist\KambaPOS-Instalador
echo  (ou o ZIP) no computador do cliente.
echo.
echo  Pode demorar varios minutos.
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\pack-windows.ps1"
set "EXIT_CODE=%ERRORLEVEL%"

echo.
if "%EXIT_CODE%"=="0" (
    echo  Concluido. Abra a pasta dist para copiar o instalador.
    explorer "%~dp0dist"
) else (
    echo  O empacotamento falhou. Leia as mensagens acima.
)
echo.
pause
exit /b %EXIT_CODE%
