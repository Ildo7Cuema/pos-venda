@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Instalar KAMBA POS
chcp 65001 >nul

echo.
echo  ============================================
echo   KAMBA Many - Instalacao no computador
echo  ============================================
echo.

set "SOURCE_APP=%~dp0app"
if not exist "%SOURCE_APP%\iniciar.bat" (
    echo  ERRO: Pasta app\ incompleta. Extraia o instalador completo.
    echo.
    pause
    exit /b 1
)

set "INSTALL_DIR=C:\KambaPOS"
mkdir "%INSTALL_DIR%" >nul 2>&1
if not exist "%INSTALL_DIR%" (
    set "INSTALL_DIR=%LOCALAPPDATA%\KambaPOS"
    mkdir "%INSTALL_DIR%" >nul 2>&1
)

echo  Destino: %INSTALL_DIR%
echo  A copiar ficheiros...
echo.

robocopy "%SOURCE_APP%" "%INSTALL_DIR%" /E /NFL /NDL /NJH /NJS /nc /ns /np >nul
set "RC=%ERRORLEVEL%"
if %RC% GEQ 8 (
    echo  ERRO ao copiar ficheiros ^(codigo robocopy %RC%^).
    echo  Tente executar este instalador como Administrador.
    echo.
    pause
    exit /b 1
)

copy /Y "%~dp0DESINSTALAR.bat" "%INSTALL_DIR%\DESINSTALAR.bat" >nul 2>&1
copy /Y "%~dp0LEIA-ME.txt" "%INSTALL_DIR%\LEIA-ME.txt" >nul 2>&1
powershell -NoProfile -Command "Get-ChildItem -LiteralPath '%INSTALL_DIR%' -Recurse -File | Unblock-File -ErrorAction SilentlyContinue"

powershell -NoProfile -ExecutionPolicy Bypass -File "%INSTALL_DIR%\criar-atalho.ps1" -InstallDir "%INSTALL_DIR%"
if errorlevel 1 (
    echo  Aviso: nao foi possivel criar o atalho automaticamente.
    echo  Pode abrir o sistema com: %INSTALL_DIR%\iniciar.bat
)

echo.
echo  Instalacao concluida.
echo  Icone "KAMBA Many" colocado no Ambiente de Trabalho.
echo.
echo  Ao clicar no icone, o sistema abre no navegador.
echo  Nao feche a janela do servidor enquanto estiver a vender.
echo.

choice /C SN /M "Deseja abrir o KAMBA Many agora"
if errorlevel 2 goto :end
if errorlevel 1 start "" "%INSTALL_DIR%\iniciar.bat"

:end
echo.
pause
exit /b 0
