param(
    [Parameter(Mandatory = $true)]
    [string]$InstallDir
)

$ErrorActionPreference = 'Stop'

function Remove-KambaShortcut {
    param([string[]]$Paths)
    foreach ($path in $Paths) {
        if ($path -and (Test-Path $path)) {
            Remove-Item -LiteralPath $path -Force -ErrorAction SilentlyContinue
        }
    }
}

function New-KambaShortcut {
    param(
        [string]$Path,
        [string]$LaunchFile,
        [string]$WorkDir,
        [string]$Icon,
        [string]$Description
    )

    $folder = Split-Path -Parent $Path
    if (-not (Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
    }

    $cmd = Join-Path $env:SystemRoot 'System32\cmd.exe'
    $iconLocation = "$Icon,0"

    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($Path)
    $shortcut.TargetPath = $cmd
    $shortcut.Arguments = "/d /c `"$LaunchFile`""
    $shortcut.WorkingDirectory = $WorkDir
    $shortcut.WindowStyle = 7
    $shortcut.IconLocation = $iconLocation
    $shortcut.Description = $Description
    $shortcut.Save()
}

$InstallDir = $InstallDir.TrimEnd('\')
$startFile = Join-Path $InstallDir 'iniciar.bat'
$stopFile = Join-Path $InstallDir 'parar.bat'
$icon = Join-Path $InstallDir 'assets\kamba.ico'

if (-not (Test-Path $startFile)) {
    throw "iniciar.bat nao encontrado em $InstallDir"
}
if (-not (Test-Path $icon)) {
    throw "Icone nao encontrado: $icon"
}

$desktop = [Environment]::GetFolderPath('Desktop')
$startMenu = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\KAMBA Money'
$legacyMenus = @(
    (Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\KAMBA POS'),
    (Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\KAMBA Many')
)

Remove-KambaShortcut @(
    (Join-Path $desktop 'KAMBA POS.lnk'),
    (Join-Path $desktop 'KAMBA Many.lnk'),
    (Join-Path $desktop 'KAMBA Money.lnk')
)
foreach ($legacy in $legacyMenus) {
    if (Test-Path $legacy) {
        Remove-Item -LiteralPath $legacy -Recurse -Force -ErrorAction SilentlyContinue
    }
}

$description = 'KAMBA Money - Ponto de Venda e Facturacao'
New-KambaShortcut -Path (Join-Path $desktop 'KAMBA Money.lnk') -LaunchFile $startFile -WorkDir $InstallDir -Icon $icon -Description $description
New-KambaShortcut -Path (Join-Path $startMenu 'KAMBA Money.lnk') -LaunchFile $startFile -WorkDir $InstallDir -Icon $icon -Description $description
New-KambaShortcut -Path (Join-Path $startMenu 'Parar KAMBA Money.lnk') -LaunchFile $stopFile -WorkDir $InstallDir -Icon $icon -Description 'Parar o servidor KAMBA Money'

Write-Host "Atalho 'KAMBA Money' criado no Ambiente de Trabalho e no Menu Iniciar."
