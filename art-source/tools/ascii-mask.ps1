#Requires -Version 5.1
<#
  Prints a downsampled ASCII alpha mask (plus dominant colour) for candidate
  sprites. Text-only stand-in for eyeballing a contact sheet, so art choices
  can be verified without opening an image viewer.

    pwsh -File art-source/tools/ascii-mask.ps1 -Files 'PNG\Default size\foliagePack_012.png','...'
#>

[CmdletBinding()]
param(
  # Semicolon-separated list; a bare string keeps this callable via -File.
  [Parameter(Mandatory)][string]$FileList,
  [string]$SourceRoot,
  [int]$Cols = 34,
  # alpha = silhouette via coverage (for transparent sprites)
  # luma  = brightness map (for opaque Kenney background scenes)
  [ValidateSet('alpha', 'luma')][string]$Mode = 'alpha'
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$toolsDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
if (-not $SourceRoot) { $SourceRoot = Join-Path $toolsDir '..\kenney' }
$SourceRoot = (Resolve-Path $SourceRoot).Path

$Files = $FileList.Split(';') | Where-Object { $_.Trim() } | ForEach-Object { $_.Trim() }

$RAMP = @(' ', '.', ':', '-', '=', '+', '*', '#', '%', '@')

foreach ($rel in $Files) {
  $path = Join-Path $SourceRoot $rel
  if (-not (Test-Path -LiteralPath $path)) { Write-Output "MISSING $rel"; continue }

  $bmp = [System.Drawing.Bitmap]::FromFile($path)
  try {
    $w = $bmp.Width; $h = $bmp.Height
    $rect = New-Object System.Drawing.Rectangle 0, 0, $w, $h
    $lk = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $bytes = New-Object byte[] ([Math]::Abs($lk.Stride) * $lk.Height)
    [System.Runtime.InteropServices.Marshal]::Copy($lk.Scan0, $bytes, 0, $bytes.Length)
    $bmp.UnlockBits($lk)

    # dominant opaque colour
    $hist = @{}
    for ($i = 0; $i -lt $bytes.Length; $i += 4) {
      if ($bytes[$i + 3] -gt 200) {
        $k = '{0:X2}{1:X2}{2:X2}' -f $bytes[$i + 2], $bytes[$i + 1], $bytes[$i]
        $hist[$k] = 1 + ($hist[$k] -as [int])
      }
    }
    $top = ($hist.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 3 |
      ForEach-Object { "#$($_.Key)" }) -join ' '

    $rows = [Math]::Max(4, [int]($Cols * 0.5 * $h / $w))
    Write-Output ''
    Write-Output ("=== {0}  [{1}x{2}]  {3}  ===" -f $rel, $w, $h, $top)

    for ($ry = 0; $ry -lt $rows; $ry++) {
      $line = ''
      for ($rx = 0; $rx -lt $Cols; $rx++) {
        $x0 = [int]($rx * $w / $Cols); $x1 = [int](($rx + 1) * $w / $Cols)
        $y0 = [int]($ry * $h / $rows); $y1 = [int](($ry + 1) * $h / $rows)
        $sum = 0.0; $total = 0
        for ($y = $y0; $y -lt $y1; $y++) {
          for ($x = $x0; $x -lt $x1; $x++) {
            $o = $y * $lk.Stride + $x * 4
            $total++
            if ($Mode -eq 'alpha') {
              if ($bytes[$o + 3] -gt 24) { $sum += 1 }
            } else {
              $sum += 0.2126 * $bytes[$o + 2] + 0.7152 * $bytes[$o + 1] + 0.0722 * $bytes[$o]
            }
          }
        }
        if ($total -eq 0) { $line += ' '; continue }
        $v = $sum / $total
        if ($Mode -eq 'alpha') {
          $idx = [Math]::Min($RAMP.Count - 1, [int]($v * $RAMP.Count))
        } else {
          # luma: invert so "bright" prints as a light glyph, dark prints solid
          $n = [Math]::Min(1.0, $v / 255)
          $idx = [Math]::Min($RAMP.Count - 1, [int]((1 - $n) * ($RAMP.Count - 1)))
        }
        $line += $RAMP[$idx]
      }
      Write-Output $line
    }
  }
  finally { $bmp.Dispose() }
}