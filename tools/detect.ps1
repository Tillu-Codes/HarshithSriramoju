Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap("D:\Opencode\Harshport\assets\pics&gifs\2.gif")

function Lum($c){ return 0.299*$c.R + 0.587*$c.G + 0.114*$c.B }

function TextBands($x0,$x1,$y0,$y1,$label){
  $rows = @{}
  for($y=$y0;$y -lt $y1;$y++){
    $cnt=0; $lo=9999; $hi=-1
    for($x=$x0;$x -lt $x1;$x++){
      $c=$bmp.GetPixel($x,$y)
      if((Lum $c) -lt 130){
        $cnt++
        if($x -lt $lo){$lo=$x}
        if($x -gt $hi){$hi=$x}
      }
    }
    if($cnt -gt 0){ $rows[$y] = @($cnt,$lo,$hi) }
  }
  $ys = ($rows.Keys | Sort-Object)
  $bands=@(); $cur=$null
  foreach($y in $ys){
    if($null -eq $cur){ $cur = @{ y0=$y; y1=$y; lo=$rows[$y][1]; hi=$rows[$y][2] } }
    elseif($y - $cur.y1 -le 3){
      $cur.y1=$y
      if($rows[$y][1] -lt $cur.lo){$cur.lo=$rows[$y][1]}
      if($rows[$y][2] -gt $cur.hi){$cur.hi=$rows[$y][2]}
    } else { $bands+=$cur; $cur = @{ y0=$y; y1=$y; lo=$rows[$y][1]; hi=$rows[$y][2] } }
  }
  if($null -ne $cur){ $bands+=$cur }
  "=== $label ==="
  foreach($b in $bands){
    if(($b.y1-$b.y0) -ge 3){
      "  y {0,4}..{1,4} (h={2,3})   x {3,4}..{4,4} (w={5,4})" -f $b.y0,$b.y1,($b.y1-$b.y0),$b.lo,$b.hi,($b.hi-$b.lo)
    }
  }
}

TextBands 440 960 100 630 "LEFT COLUMN"
TextBands 965 1320 100 630 "RIGHT COLUMN"

# ---- red frame edges ----
"=== RED FRAME ==="
$hrows=@()
for($y=60;$y -lt 730;$y++){
  $n=0
  for($x=110;$x -lt 420;$x++){ $c=$bmp.GetPixel($x,$y)
    if($c.R -gt 150 -and ($c.R-$c.G) -gt 60){$n++} }
  if($n -gt 120){ $hrows += "$y(n=$n)" }
}
"horizontal edges: " + ($hrows -join ', ')

$vcols=@()
for($x=110;$x -lt 420;$x++){
  $n=0
  for($y=60;$y -lt 730;$y++){ $c=$bmp.GetPixel($x,$y)
    if($c.R -gt 150 -and ($c.R-$c.G) -gt 60){$n++} }
  if($n -gt 150){ $vcols += "$x(n=$n)" }
}
"vertical edges: " + ($vcols -join ', ')

# ---- white handle squares (near-white, boxed by red) ----
"=== HANDLES (white blobs) ==="
$seen=@{}
for($y=60;$y -lt 730;$y++){
  for($x=110;$x -lt 420;$x++){
    $c=$bmp.GetPixel($x,$y)
    if((Lum $c) -gt 246){
      $k="$x,$y"
      if(-not $seen.ContainsKey($k)){
        # flood fill small blob
        $q=New-Object System.Collections.Queue; $q.Enqueue(@($x,$y)); $seen[$k]=$true
        $minX=$x;$maxX=$x;$minY=$y;$maxY=$y;$n=0
        while($q.Count -gt 0){
          $p=$q.Dequeue(); $px=$p[0]; $py=$p[1]; $n++
          if($px -lt $minX){$minX=$px}; if($px -gt $maxX){$maxX=$px}
          if($py -lt $minY){$minY=$py}; if($py -gt $maxY){$maxY=$py}
          foreach($d in @(@(1,0),@(-1,0),@(0,1),@(0,-1))){
            $nx=$px+$d[0]; $ny=$py+$d[1]
            if($nx -ge 110 -and $nx -lt 420 -and $ny -ge 60 -and $ny -lt 730){
              $nk="$nx,$ny"
              if(-not $seen.ContainsKey($nk)){
                $nc=$bmp.GetPixel($nx,$ny)
                if((Lum $nc) -gt 246){ $seen[$nk]=$true; $q.Enqueue(@($nx,$ny)) }
              }
            }
          }
        }
        if($n -ge 60 -and $n -le 600){
          $w=$maxX-$minX+1; $h=$maxY-$minY+1
          if($w -ge 8 -and $w -le 26 -and $h -ge 8 -and $h -le 26){
            "  blob n=$n x $minX..$maxX y $minY..$maxY  -> center ($([int](($minX+$maxX)/2)),$([int](($minY+$maxY)/2))) ${w}x${h}"
          }
        }
      }
    }
  }
}
$bmp.Dispose()
