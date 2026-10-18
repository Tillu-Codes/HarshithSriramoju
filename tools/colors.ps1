Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap("D:\Opencode\Harshport\assets\pics&gifs\2.gif")

function Darkest($x0,$x1,$y0,$y1){
  $best=$null; $bl=999
  for($y=$y0;$y -le $y1;$y++){
    for($x=$x0;$x -le $x1;$x++){
      $c=$bmp.GetPixel($x,$y)
      $l=0.299*$c.R+0.587*$c.G+0.114*$c.B
      if($l -lt $bl){ $bl=$l; $best=$c }
    }
  }
  return ("{0},{1},{2}" -f $best.R,$best.G,$best.B)
}

"HELLO        " + (Darkest 474 861 127 198)
"lead         " + (Darkest 475 623 224 235)
"body         " + (Darkest 475 914 259 270)
"EDUCATION h  " + (Darkest 473 742 483 510)
"degree       " + (Darkest 474 729 544 555)
"school       " + (Darkest 474 770 574 586)
"SKILLS h     " + (Darkest 992 1141 120 146)
"exp period   " + (Darkest 994 1136 445 456)
"exp role     " + (Darkest 993 1113 473 484)
"exp org      " + (Darkest 994 1066 499 508)
"EXPERIENCE h " + (Darkest 993 1287 381 407)

# frame red: sample the middle of the top edge away from handles
$fx=@()
foreach($p in @(@(160,82),@(200,82),@(350,82),@(129,200),@(398,200))){
  $c=$bmp.GetPixel($p[0],$p[1]); $fx += "($($p[0]),$($p[1]))=$($c.R),$($c.G),$($c.B)"
}
"frame red: " + ($fx -join '  ')

# handle interior + immediate border
foreach($p in @(@(128,83),@(124,83),@(121,83),@(135,83),@(137,83))){
  $c=$bmp.GetPixel($p[0],$p[1]); "handle ($($p[0]),$($p[1])) = $($c.R),$($c.G),$($c.B)"
}

# paper samples across the sheet
$pp=@()
foreach($p in @(@(60,30),@(600,30),@(1350,30),@(60,600),@(1350,600))){
  $c=$bmp.GetPixel($p[0],$p[1]); $pp += "($($p[0]),$($p[1]))=$($c.R),$($c.G),$($c.B)"
}
"paper: " + ($pp -join '  ')

# heptagon red (bottom centre)
foreach($p in @(@(700,700),@(760,760))){
  $c=$bmp.GetPixel($p[0],$p[1]); "heptagon ($($p[0]),$($p[1])) = $($c.R),$($c.G),$($c.B)"
}

$bmp.Dispose()
