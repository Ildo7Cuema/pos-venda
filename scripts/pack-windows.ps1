# Empacota o KAMBA POS para instalar noutro computador Windows.
# Uso: powershell -ExecutionPolicy Bypass -File scripts/pack-windows.ps1

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$Root = Split-Path -Parent $PSScriptRoot
$DistRoot = Join-Path $Root 'dist'
$Stage = Join-Path $DistRoot 'KambaPOS-Instalador'
$AppDir = Join-Path $Stage 'app'
$RuntimeCache = Join-Path $PSScriptRoot 'windows\runtime-cache'
$NodeCache = Join-Path $RuntimeCache 'node.exe'
$WindowsScripts = Join-Path $PSScriptRoot 'windows'

function Write-Step($message) {
    Write-Host ""
    Write-Host ">> $message" -ForegroundColor Cyan
}

Set-Location $Root

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  KAMBA Many - Empacotar para Windows" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw "npm nao encontrado. Instale Node.js LTS nesta maquina de desenvolvimento antes de empacotar."
}

Write-Step "A instalar dependencias"
npm install --no-fund --no-audit
if ($LASTEXITCODE -ne 0) { throw "npm install falhou." }

$schemaSrc = Join-Path $Root 'database\schema.sql'
$schemaDestDir = Join-Path $Root 'public\database'
$wasmSrcDir = Join-Path $Root 'node_modules\sql.js\dist'
$wasmDestDir = Join-Path $Root 'public\sql-wasm'
if (Test-Path $schemaSrc) {
    New-Item -ItemType Directory -Force -Path $schemaDestDir | Out-Null
    Copy-Item $schemaSrc (Join-Path $schemaDestDir 'schema.sql') -Force
}
if (Test-Path $wasmSrcDir) {
    New-Item -ItemType Directory -Force -Path $wasmDestDir | Out-Null
    Copy-Item (Join-Path $wasmSrcDir 'sql-wasm.wasm') $wasmDestDir -Force
    Copy-Item (Join-Path $wasmSrcDir 'sql-wasm.js') $wasmDestDir -Force
}

Write-Step "A compilar o sistema (npm run build)"
$env:NODE_ENV = 'production'
npm run build
if ($LASTEXITCODE -ne 0) { throw "npm run build falhou. Corrija os erros antes de empacotar." }

$standalone = Join-Path $Root '.next\standalone'
$standaloneServer = Get-ChildItem $standalone -Recurse -Filter 'server.js' -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $standaloneServer) {
    throw "Build standalone incompleto (server.js em falta). Verifique next.config.ts (output: 'standalone')."
}

Write-Step "A preparar a pasta do instalador"
if (Test-Path $DistRoot) {
    Remove-Item $DistRoot -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $AppDir | Out-Null

& robocopy $standalone $AppDir /E /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
if ($LASTEXITCODE -ge 8) { throw "Falha ao copiar o build standalone (robocopy $LASTEXITCODE)." }
$global:LASTEXITCODE = 0

$serverJs = Join-Path $AppDir 'server.js'
if (-not (Test-Path $serverJs)) {
    $found = Get-ChildItem $AppDir -Recurse -Filter 'server.js' | Select-Object -First 1
    if (-not $found) { throw "server.js nao foi gerado no build standalone." }
    Write-Host "   A reorganizar estrutura standalone aninhada..."
    $temp = Join-Path $DistRoot '_app_tmp'
    if (Test-Path $temp) { Remove-Item $temp -Recurse -Force }
    Move-Item $found.DirectoryName $temp
    Remove-Item $AppDir -Recurse -Force
    Move-Item $temp $AppDir
}

$staticSrc = Join-Path $Root '.next\static'
$staticDest = Join-Path $AppDir '.next\static'
if (Test-Path $staticSrc) {
    New-Item -ItemType Directory -Force -Path $staticDest | Out-Null
    & robocopy $staticSrc $staticDest /E /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
    if ($LASTEXITCODE -ge 8) { throw "Falha ao copiar .next/static (robocopy $LASTEXITCODE)." }
    $global:LASTEXITCODE = 0
}

$publicSrc = Join-Path $Root 'public'
$publicDest = Join-Path $AppDir 'public'
if (Test-Path $publicSrc) {
    New-Item -ItemType Directory -Force -Path $publicDest | Out-Null
    & robocopy $publicSrc $publicDest /E /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
    if ($LASTEXITCODE -ge 8) { throw "Falha ao copiar public (robocopy $LASTEXITCODE)." }
    $global:LASTEXITCODE = 0
}

Copy-Item (Join-Path $WindowsScripts 'start-server.js') (Join-Path $AppDir 'start-server.js') -Force
Copy-Item (Join-Path $WindowsScripts 'iniciar.bat') (Join-Path $AppDir 'iniciar.bat') -Force
Copy-Item (Join-Path $WindowsScripts 'parar.bat') (Join-Path $AppDir 'parar.bat') -Force
Copy-Item (Join-Path $WindowsScripts 'criar-atalho.ps1') (Join-Path $AppDir 'criar-atalho.ps1') -Force
Copy-Item (Join-Path $WindowsScripts 'config.env.example') (Join-Path $AppDir 'config.env.example') -Force

$assetsDest = Join-Path $AppDir 'assets'
New-Item -ItemType Directory -Force -Path $assetsDest | Out-Null
Copy-Item (Join-Path $WindowsScripts 'assets\kamba.ico') (Join-Path $assetsDest 'kamba.ico') -Force

Copy-Item (Join-Path $WindowsScripts 'INSTALAR.bat') (Join-Path $Stage 'INSTALAR.bat') -Force
Copy-Item (Join-Path $WindowsScripts 'DESINSTALAR.bat') (Join-Path $Stage 'DESINSTALAR.bat') -Force
Copy-Item (Join-Path $WindowsScripts 'LEIA-ME.txt') (Join-Path $Stage 'LEIA-ME.txt') -Force

$configEnv = Join-Path $AppDir 'config.env'
Copy-Item (Join-Path $WindowsScripts 'config.env.example') $configEnv -Force
foreach ($envName in @('.env.local', '.env.production', '.env')) {
    $envFile = Join-Path $Root $envName
    if (Test-Path $envFile) {
        Write-Host "   A incluir $envName no pacote."
        Copy-Item $envFile (Join-Path $AppDir $envName) -Force
    }
}

Write-Step "A incluir Node.js portatil (copiado desta maquina para o PC do cliente nao precisar de o instalar)"
$runtimeDest = Join-Path $AppDir 'runtime'
New-Item -ItemType Directory -Force -Path $RuntimeCache | Out-Null
New-Item -ItemType Directory -Force -Path $runtimeDest | Out-Null

$localNode = $null
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCmd -and $nodeCmd.Source -and (Test-Path $nodeCmd.Source)) {
    $localNode = $nodeCmd.Source
}

if ($localNode) {
    Copy-Item $localNode $NodeCache -Force
    Write-Host "   A usar Node.js local: $localNode"
} elseif (-not (Test-Path $NodeCache)) {
    Write-Host "   AVISO: node.exe nao encontrado. O cliente precisara de Node.js 20+ instalado." -ForegroundColor Yellow
}

if (Test-Path $NodeCache) {
    Copy-Item $NodeCache (Join-Path $runtimeDest 'node.exe') -Force
    Unblock-File -Path (Join-Path $runtimeDest 'node.exe') -ErrorAction SilentlyContinue
    Write-Host "   Node.js portatil incluido no instalador."
}

Write-Step "A criar o ZIP para copiar para o outro computador"
$zipPath = Join-Path $DistRoot 'KambaPOS-Instalador.zip'
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Push-Location $DistRoot
try {
    tar -a -c -f 'KambaPOS-Instalador.zip' 'KambaPOS-Instalador'
    if ($LASTEXITCODE -ne 0) {
        Compress-Archive -Path $Stage -DestinationPath $zipPath -Force
    }
} finally {
    Pop-Location
}

$sizeMb = [math]::Round((Get-Item $zipPath).Length / 1MB, 1)
Write-Host ""
Write-Host "Pacote pronto." -ForegroundColor Green
Write-Host "  Pasta: $Stage"
Write-Host "  ZIP:   $zipPath  ($sizeMb MB)"
Write-Host ""
Write-Host "No outro computador: extraia o ZIP e execute INSTALAR.bat"
Write-Host "O icone KAMBA POS fica no Ambiente de Trabalho."
Write-Host ""
