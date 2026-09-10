@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Parar KAMBA POS

if exist "%~dp0kamba.pid" (
    set /p PID=<"%~dp0kamba.pid"
    if defined PID (
        taskkill /PID %PID% /F >nul 2>&1
    )
    del /f /q "%~dp0kamba.pid" >nul 2>&1
)

taskkill /FI "WINDOWTITLE eq KAMBA POS - Nao feche esta janela*" /F >nul 2>&1
echo KAMBA POS parado.
exit /b 0
