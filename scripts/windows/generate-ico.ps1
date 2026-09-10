Add-Type -AssemblyName System.Drawing

function Convert-PngToWindowsIco {
    param(
        [Parameter(Mandatory = $true)][string]$PngPath,
        [Parameter(Mandatory = $true)][string]$IcoPath
    )

    if (-not (Test-Path $PngPath)) {
        throw "PNG nao encontrado: $PngPath"
    }

    $src = [System.Drawing.Image]::FromFile((Resolve-Path $PngPath))
    $sizes = @(16, 32, 48, 256)
    $images = @()

    try {
        foreach ($size in $sizes) {
            $bmp = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
            $g = [System.Drawing.Graphics]::FromImage($bmp)
            $g.Clear([System.Drawing.Color]::Transparent)
            $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
            $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
            $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
            $g.DrawImage($src, 0, 0, $size, $size)
            $g.Dispose()

            $stride = $size * 4
            $xorSize = $stride * $size
            $andStride = [int]([Math]::Ceiling($size / 32.0) * 4)
            $andSize = $andStride * $size

            $ms = New-Object System.IO.MemoryStream
            $w = New-Object System.IO.BinaryWriter $ms
            $w.Write([uint32]40)
            $w.Write([int32]$size)
            $w.Write([int32]($size * 2))
            $w.Write([uint16]1)
            $w.Write([uint16]32)
            $w.Write([uint32]0)
            $w.Write([uint32]($xorSize + $andSize))
            $w.Write([int32]0)
            $w.Write([int32]0)
            $w.Write([uint32]0)
            $w.Write([uint32]0)

            for ($y = $size - 1; $y -ge 0; $y--) {
                for ($x = 0; $x -lt $size; $x++) {
                    $c = $bmp.GetPixel($x, $y)
                    $w.Write([byte]$c.B)
                    $w.Write([byte]$c.G)
                    $w.Write([byte]$c.R)
                    $w.Write([byte]$c.A)
                }
            }

            $w.Write((New-Object byte[] $andSize))
            $w.Flush()
            $images += ,@{ Width = $size; Data = $ms.ToArray() }
            $w.Dispose()
            $ms.Dispose()
            $bmp.Dispose()
        }
    } finally {
        $src.Dispose()
    }

    $headerSize = 6
    $entrySize = 16
    $offset = $headerSize + ($entrySize * $images.Count)

    $ico = New-Object System.IO.MemoryStream
    $bw = New-Object System.IO.BinaryWriter $ico
    $bw.Write([uint16]0)
    $bw.Write([uint16]1)
    $bw.Write([uint16]$images.Count)

    foreach ($img in $images) {
        $dim = if ($img.Width -ge 256) { [byte]0 } else { [byte]$img.Width }
        $bw.Write($dim)
        $bw.Write($dim)
        $bw.Write([byte]0)
        $bw.Write([byte]0)
        $bw.Write([uint16]1)
        $bw.Write([uint16]32)
        $bw.Write([uint32]$img.Data.Length)
        $bw.Write([uint32]$offset)
        $offset += $img.Data.Length
    }

    foreach ($img in $images) {
        $bw.Write($img.Data)
    }

    $bw.Flush()
    $dir = Split-Path -Parent $IcoPath
    if ($dir -and -not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    [System.IO.File]::WriteAllBytes($IcoPath, $ico.ToArray())
    $bw.Dispose()
    $ico.Dispose()
}

$here = $PSScriptRoot
$png = Join-Path $here 'assets\kamba-icon.png'
$ico = Join-Path $here 'assets\kamba.ico'
Convert-PngToWindowsIco -PngPath $png -IcoPath $ico
Write-Host "ICO criado: $ico ($((Get-Item $ico).Length) bytes)"
