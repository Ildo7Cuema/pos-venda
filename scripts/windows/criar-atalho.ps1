param(
    [Parameter(Mandatory = $true)]
    [string]$InstallDir
)

$ErrorActionPreference = 'Stop'

function New-KambaShortcut {
    param(
        [string]$Path,
        [string]$Target,
        [string]$WorkDir,
        [string]$Icon,
        [string]$Description
    )

    $folder = Split-Path -Parent $Path
    if (-not (Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
    }

    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($Path)
    $shortcut.TargetPath = $Target
    $shortcut.WorkingDirectory = $WorkDir
    $shortcut.WindowStyle = 7
    if (Test-Path $Icon) {
        $shortcut.IconLocation = $Icon
    }
    $shortcut.Description = $Description
    $shortcut.Save()
}

$target = Join-Path $InstallDir 'iniciar.bat'
$icon = Join-Path $InstallDir 'assets\kamba.ico'
$description = 'KAMBA Many - Ponto de Venda e Facturacao'

$desktop = [Environment]::GetFolderPath('Desktop')
New-KambaShortcut -Path (Join-Path $desktop 'KAMBA POS.lnk') -Target $target -WorkDir $InstallDir -Icon $icon -Description $description

$startMenu = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\KAMBA POS'
New-KambaShortcut -Path (Join-Path $startMenu 'KAMBA POS.lnk') -Target $target -WorkDir $InstallDir -Icon $icon -Description $description
New-KambaShortcut -Path (Join-Path $startMenu 'Parar KAMBA POS.lnk') -Target (Join-Path $InstallDir 'parar.bat') -WorkDir $InstallDir -Icon $icon -Description 'Parar o servidor KAMBA POS'

Write-Host "Atalhos criados no Ambiente de Trabalho e no Menu Iniciar."
