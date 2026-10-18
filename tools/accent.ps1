Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap("D:\Opencode\Harshport\assets\pics&gifs\2.gif")

# --- most saturated reds along the selection frame ---
$frame = @{}
for($y=83;$y -le 704;$y++){
  foreach($x in @(128,129,130,397,398,399)){
    $c=$bmp.GetPixel($x,$y)
    if($c.R -gt 90 -and ($c.R-$c.G) -gt 30){
      $k="{0},{1},{2}" -f $c.R,$c.G,$c.B
      if($frame.ContainsKey($k)){ $frame[$k]++ } else { $frame[$k]=1 }
    }
  }
}
for($x=130;$x -le 397;$x++){
  foreach($y in @(81,82,83,704,705,706)){
    $c=$bmp.GetPixel($x,$y)
    if($c.R -gt 90 -and ($c.R-$c.G) -gt 30){
      $k="{0},{1},{2}" -f $c.R,$c.G,$c.B
      if($frame.ContainsKey($k)){ $frame[$k]++ } else { $frame[$k]=1 }
    }
  }
}
"=== FRAME red (top 12 by count) ==="
$frame.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 12 |
  ForEach-Object { "  {0}  n={1}" -f $_.Key,$_.Value }

# --- heptagon / portrait red ---
$hep = @{}
for($y=640;$y -lt 788;$y++){
  for($x=470;$x -lt 930;$x++){
    $c=$bmp.GetPixel($x,$y)
    if($c.R -gt 130 -and $c.G -lt 95 -and $c.B -lt 95){
      $k="{0},{1},{2}" -f $c.R,$c.G,$c.B
      if($hep.ContainsKey($k)){ $hep[$k]++ } else { $hep[$k]=1 }
    }
  }
}
"=== HEPTAGON red (top 8 by count) ==="
$hep.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 8 |
  ForEach-Object { "  {0}  n={1}" -f $_.Key,$_.Value }

# --- white handle border check: walk across the top-left handle ---
"=== handle cross-section y=83, x=118..142 ==="
$s=@()
for($x=118;$x -le 142;$x++){ $c=$bmp.GetPixel($x,83); $s += "$x=[$($c.R),$($c.G),$($c.B)]" }
$s -join ' '

$bmp.Dispose()
