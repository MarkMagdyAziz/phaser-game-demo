#Requires -Version 5.1
<#
  Curates the Kenney CC0 packs in art-source\kenney into the tightly-cropped,
  right-sized set that src/app/game-3 actually loads.

  Why: every Kenney sprite ships inside an oversized transparent canvas
  (characters are 78x98 of art inside 128x128; particles are ~380x380 inside
  512x512). Leaving that padding in place makes sprite origins, rotations and
  Arcade physics bodies wrong. This script trims the alpha bounding box and
  optionally downscales with high-quality filtering, so the shipped PNGs are
  tight and the game can treat them as exact rectangles.

  Every source here is CC0 (see ASSETS.md at the repo root, which records the
  pack each file came from). Re-run from the repo root to regenerate the
  shipped set after re-extracting the packs:

      powershell.exe -NoProfile -ExecutionPolicy Bypass -File art-source\tools\curate-game3-assets.ps1
#>

[CmdletBinding()]
param(
  [string]$SourceRoot,
  [string]$OutRoot
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

# $PSScriptRoot is not populated while the param block is being bound in
# Windows PowerShell 5.1, so resolve the defaults here instead.
$toolsDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
if (-not $SourceRoot) { $SourceRoot = Join-Path $toolsDir '..\kenney' }
if (-not $OutRoot)    { $OutRoot    = Join-Path $toolsDir '..\..\public\assets\game-3' }

# The raw Kenney extracts are deliberately NOT committed (art-source/kenney is
# git-ignored): they are ~25 MB of mostly-unused art. This script regenerates
# the shipped set from a fresh extract, so fail with actionable instructions
# rather than emitting a half-empty asset tree.
if (-not (Test-Path -LiteralPath $SourceRoot)) {
  throw @"
Kenney source packs not found at:
  $SourceRoot

Re-extract the CC0 packs listed in ASSETS.md so their contents land under that
folder (Sprites\, PNG\, PNG (Transparent)\, Fonts\), then re-run:

  powershell.exe -NoProfile -ExecutionPolicy Bypass -File art-source\tools\curate-game3-assets.ps1

The already-curated files in public\assets\game-3 are committed, so this is
only needed when changing which art is used.
"@
}

# source (relative to $SourceRoot) | destination (relative to $OutRoot) | target width (0 = keep cropped size)
$Plan = @(
  # ---- player: Kenney New Platformer Pack 1.1, beige character -------------
  # All player frames are padded onto one shared 84x98 canvas (the largest
  # frame) so the game can set a single Arcade body / origin for every pose
  # instead of re-tweaking per frame.
  #
  # Only three poses are shipped. The front/climb frames were dropped: the
  # climb pair is a walk cycle, and alternating it made the character march
  # instead of ski. The crouch doubles as the riding pose.
  @{ s = 'Sprites\Characters\Default\character_beige_duck.png';    d = 'player\skier_ride.png';   w = 0; padW = 84; padH = 98 }
  @{ s = 'Sprites\Characters\Default\character_beige_jump.png';    d = 'player\skier_air.png';    w = 0; padW = 84; padH = 98 }
  @{ s = 'Sprites\Characters\Default\character_beige_hit.png';     d = 'player\skier_crash.png';  w = 0; padW = 84; padH = 98 }

  # ---- terrain: snow crust / strip / ramp ----------------------------------
  # No solid-fill tile is emitted: TerrainGenerator draws the packed-snow body
  # as a Graphics polygon, so only the crust band and the foreground strip need
  # artwork. Keeping an unused fill PNG here would contradict the "no unused
  # assets" rule.
  @{ s = 'Sprites\Tiles\Default\terrain_snow_cloud_middle.png'; d = 'terrain\snow_crust.png';      w = 0 }
  @{ s = 'Sprites\Tiles\Default\terrain_snow_cloud_left.png';   d = 'terrain\snow_crust_left.png';  w = 0 }
  @{ s = 'Sprites\Tiles\Default\terrain_snow_cloud_right.png';  d = 'terrain\snow_crust_right.png'; w = 0 }
  @{ s = 'Sprites\Tiles\Default\terrain_snow_horizontal_middle.png'; d = 'terrain\snow_strip.png'; w = 0 }
  @{ s = 'Sprites\Tiles\Default\terrain_snow_ramp_short_a.png';  d = 'terrain\ramp.png';            w = 0 }

  # ---- obstacles -----------------------------------------------------------
  # Foliage Pack. 025 and 026 are the SAME bare-tree silhouette in two colour
  # ways: 026 (#E9D5B7 cream) reads as a snow-covered tree and 025 (#BD8958
  # brown) as the bare trunk, which is what a winter slope actually looks like.
  # foliagePack_012/013 are autumn canopies (#D78100) and were rejected.
  @{ s = 'PNG\Default size\foliagePack_026.png'; d = 'obstacles\tree_snow.png'; w = 0 }
  @{ s = 'PNG\Default size\foliagePack_025.png'; d = 'obstacles\tree_bare.png'; w = 0 }
  @{ s = 'Sprites\Tiles\Default\rock.png';         d = 'obstacles\rock.png';       w = 0 }
  @{ s = 'Sprites\Tiles\Default\snow.png';         d = 'obstacles\snowdrift.png';  w = 0 }
  @{ s = 'Sprites\Tiles\Default\bush.png';         d = 'obstacles\snowbush.png';   w = 0 }

  # ---- collectible ---------------------------------------------------------
  @{ s = 'Sprites\Tiles\Default\coin_gold.png'; d = 'collectibles\coin_gold.png'; w = 0 }

  # ---- parallax background -------------------------------------------------
  # Kenney's background_* files are OPAQUE 256x256 scenes: flat sky on top,
  # scenery below, horizontally tileable. Stacking them whole would hide each
  # other, so each layer is cropped to just its scenery band. Every band is
  # fully opaque edge-to-edge, so no colour keying is needed and the sky stays
  # visible above each layer.
  @{ s = 'Sprites\Backgrounds\Default\background_solid_sky.png';   d = 'background\sky.png';         w = 0 }
  @{ s = 'Sprites\Backgrounds\Default\background_clouds.png';      d = 'background\clouds.png';      w = 0; bandTop = 110; bandBottom = 256 }
  @{ s = 'Sprites\Backgrounds\Default\background_fade_trees.png';  d = 'background\trees_far.png';   w = 0; bandTop = 80;  bandBottom = 256 }
  @{ s = 'Sprites\Backgrounds\Default\background_color_trees.png'; d = 'background\trees_near.png';  w = 0; bandTop = 80;  bandBottom = 176 }

  # ---- particles (Kenney Particle Pack, 512x512 canvases -> small) --------
  # circle_02 for snowfall/trails, star_01 for coins, smoke_04 for crashes.
  # Each texture has exactly one consumer in EffectsSystem.
  @{ s = 'PNG (Transparent)\circle_02.png'; d = 'effects\particle_snow.png';  w = 24 }
  @{ s = 'PNG (Transparent)\star_01.png';   d = 'effects\particle_star.png';  w = 32 }
  @{ s = 'PNG (Transparent)\smoke_04.png';  d = 'effects\particle_smoke.png'; w = 48 }

  # ---- UI chrome (Kenney UI Pack, 9-slice friendly 64x64) -----------------
  # Only the three textures with a consumer are kept: panel_dark for the HUD,
  # round for the touch buttons, banner for the game-over title.
  @{ s = 'PNG\Default\panel_grey_dark.png'; d = 'ui\panel_dark.png'; w = 0 }
  @{ s = 'PNG\Default\round_grey.png';      d = 'ui\round.png';      w = 0 }
  @{ s = 'PNG\Default\banner_modern.png';   d = 'ui\banner.png';     w = 0 }
)

function Get-AlphaBounds {
  param([System.Drawing.Bitmap]$Bitmap)
  $rect = New-Object System.Drawing.Rectangle 0, 0, $Bitmap.Width, $Bitmap.Height
  $locked = $Bitmap.LockBits(
    $rect,
    [System.Drawing.Imaging.ImageLockMode]::ReadOnly,
    [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
  )
  try {
    $bytes = New-Object byte[] ([Math]::Abs($locked.Stride) * $locked.Height)
    [System.Runtime.InteropServices.Marshal]::Copy($locked.Scan0, $bytes, 0, $bytes.Length)
    $minX = $Bitmap.Width; $maxX = -1; $minY = $Bitmap.Height; $maxY = -1
    for ($y = 0; $y -lt $Bitmap.Height; $y++) {
      $row = $y * $locked.Stride
      for ($x = 0; $x -lt $Bitmap.Width; $x++) {
        if ($bytes[$row + $x * 4 + 3] -gt 8) {
          if ($x -lt $minX) { $minX = $x }
          if ($x -gt $maxX) { $maxX = $x }
          if ($y -lt $minY) { $minY = $y }
          if ($y -gt $maxY) { $maxY = $y }
        }
      }
    }
    if ($maxX -lt 0) { return $null }
    return [System.Drawing.Rectangle]::new($minX, $minY, $maxX - $minX + 1, $maxY - $minY + 1)
  }
  finally { $Bitmap.UnlockBits($locked) }
}

function Export-Curated {
  param(
    [System.Drawing.Bitmap]$Source,
    [System.Drawing.Rectangle]$Crop,
    [string]$DestPath,
    [int]$TargetWidth,
    [int]$PadWidth = 0,
    [int]$PadHeight = 0
  )

  if ($PadWidth -gt 0 -and $PadHeight -gt 0) {
    # Normalise onto a shared canvas, content centred. Used for the player
    # animation so one Arcade body/origin works for every frame.
    $width  = $PadWidth
    $height = $PadHeight
    $dx = [int][Math]::Round(($width  - $Crop.Width)  / 2)
    $dy = [int][Math]::Round(($height - $Crop.Height) / 2)
    if ($dx -lt 0) { $dx = 0 }
    if ($dy -lt 0) { $dy = 0 }
    $destRect = New-Object System.Drawing.Rectangle $dx, $dy, $Crop.Width, $Crop.Height
  }
  else {
    $aspect = $Crop.Height / $Crop.Width
    $width  = if ($TargetWidth -gt 0) { $TargetWidth } else { $Crop.Width }
    $height = [Math]::Max(1, [int][Math]::Round($width * $aspect))
    $destRect = New-Object System.Drawing.Rectangle 0, 0, $width, $height
  }

  $canvas = New-Object System.Drawing.Bitmap $width, $height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  try {
    $canvas.SetResolution(96, 96)
    $g = [System.Drawing.Graphics]::FromImage($canvas)
    try {
      $g.Clear([System.Drawing.Color]::Transparent)
      # HighQualityBicubic downsampling keeps Kenney's soft vector edges clean;
      # NearestNeighbor would alias them badly at particle sizes.
      $g.CompositingMode    = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
      $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
      $g.DrawImage($Source, $destRect, $Crop, [System.Drawing.GraphicsUnit]::Pixel)
    }
    finally { $g.Dispose() }

    $dir = Split-Path -Parent $DestPath
    if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    $canvas.Save($DestPath, [System.Drawing.Imaging.ImageFormat]::Png)
  }
  finally { $canvas.Dispose() }

  return "${width}x${height}"
}

$SourceRoot = (Resolve-Path $SourceRoot).Path
$written = 0

foreach ($entry in $Plan) {
  $srcPath = Join-Path $SourceRoot $entry.s
  if (-not (Test-Path -LiteralPath $srcPath)) {
    Write-Warning "missing source, skipped: $($entry.s)"
    continue
  }

  $bitmap = [System.Drawing.Bitmap]::FromFile($srcPath)
  try {
    $bandTop = [int]$entry.bandTop
    if ($bandTop -gt 0) {
      # Band crop: full-width rectangle, no alpha trim. Used for the opaque
      # Kenney background scenes so each parallax layer is only its scenery.
      $bottom = [int]$entry.bandBottom
      if ($bottom -le 0 -or $bottom -gt $bitmap.Height) { $bottom = $bitmap.Height }
      $crop = New-Object System.Drawing.Rectangle 0, $bandTop, $bitmap.Width, ($bottom - $bandTop)
    }
    else {
      $crop = Get-AlphaBounds -Bitmap $bitmap
    }
    if ($null -eq $crop) { Write-Warning "nothing to export, skipped: $($entry.s)"; continue }

    $size = Export-Curated `
      -Source $bitmap `
      -Crop $crop `
      -DestPath (Join-Path $OutRoot $entry.d) `
      -TargetWidth $entry.w `
      -PadWidth ([int]$entry.padW) `
      -PadHeight ([int]$entry.padH)
  }
  finally { $bitmap.Dispose() }

  '{0,-30} {1,-8} -> {2,-34} {3}' -f (Split-Path $entry.s -Leaf), "$($crop.Width)x$($crop.Height)", $entry.d, $size
  $written++
}

# ---- fonts (copied verbatim; no cropping applies) --------------------------
$fontOut = Join-Path $OutRoot 'fonts'
if (-not (Test-Path -LiteralPath $fontOut)) { New-Item -ItemType Directory -Path $fontOut -Force | Out-Null }
foreach ($font in 'Kenney Future.ttf', 'Kenney Blocks.ttf', 'Kenney Pixel.ttf') {
  $srcFont = Join-Path $SourceRoot "Fonts\$font"
  if (Test-Path -LiteralPath $srcFont) {
    Copy-Item -LiteralPath $srcFont -Destination (Join-Path $fontOut $font) -Force
    "fonts\$font"
    $written++
  }
}

Write-Output ''
Write-Output "curated $written files into $OutRoot"