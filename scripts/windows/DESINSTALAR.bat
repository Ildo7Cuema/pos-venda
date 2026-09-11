@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Desinstalar KAMBA POS
chcp 65001 >nul

echo.
echo  Vai remover o KAMBA POS deste computador.
echo  Os dados de vendas no navegador NAO sao apagados.
echo.
choice /C SN /M "Continuar"
if errorlevel 2 exit /b 0

if exist "%~dp0parar.bat" call "%~dp0parar.bat"

set "INSTALL_DIR=%~dp0"
if "%INSTALL_DIR:~-1%"=="\" set "INSTALL_DIR=%INSTALL_DIR:~0,-1%"

powershell -NoProfile -Command "try { $d = [Environment]::GetFolderPath('Desktop'); Remove-Item -Force -ErrorAction SilentlyContinue (Join-Path $d 'KAMBA POS.lnk'), (Join-Path $d 'KAMBA Many.lnk'), (Join-Path $d 'KAMBA Money.lnk') } catch {}"
rmdir /s /q "%APPDATA%\Microsoft\Windows\Start Menu\Programs\KAMBA POS" >nul 2>&1
rmdir /s /q "%APPDATA%\Microsoft\Windows\Start Menu\Programs\KAMBA Many" >nul 2>&1
rmdir /s /q "%APPDATA%\Microsoft\Windows\Start Menu\Programs\KAMBA Money" >nul 2>&1

echo.
echo  Atalhos removidos. A pasta do programa sera apagada dentro de segundos.
start "" /min cmd /c ping 127.0.0.1 -n 4 ^>nul ^& rmdir /s /q "%INSTALL_DIR%"
exit /b 0
