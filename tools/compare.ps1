param([string]$Orig = "D:\Opencode\Harshport\assets\pics&gifs\2.gif",
      [string]$New  = "D:\Opencode\Harshport\tools\render.png")

Add-Type -AssemblyName System.Drawing
$bo = New-Object System.Drawing.Bitmap($Orig)
$bn = New-Object System.Drawing.Bitmap($New)

# label, x0, x1, y0, y1  (windows taken from the measured original bands)
$rows = @(
  @('HELLO',      440, 960, 110, 215),
  @('lead',       440, 960, 216, 248),
  @('body L1',    440, 960, 252, 273),
  @('body L4',    440, 960, 338, 360),
  @('body last',  440, 960, 410, 452),
  @('EDUCATION',  440, 960, 475, 520),
  @('degree',     440, 960, 536, 562),
  @('school',     440, 960, 566, 596),
  @('SKILLS',     965,1330, 112, 155),
  @('skill row1', 965,1330, 170, 252),
  @('skill row2', 965,1330, 254, 334),
  @('EXPERIENCE', 965,1330, 372, 415),
  @('xp1 period', 965,1330, 436, 464),
  @('xp1 role',   965,1330, 465, 494),
  @('xp2 period', 965,1330, 532, 560),
  @('xp2 role',   965,1330, 561, 590)
)

function BBox($bmp, $x0,$x1,$y0,$y1){
  $loX=9999;$hiX=-1;$loY=9999;$hiY=-1
  for($y=$y0;$y -lt $y1;$y++){
    for($x=$x0;$x -lt $x1;$x++){
      $c=$bmp.GetPixel($x,$y)
      if((0.299*$c.R+0.587*$c.G+0.114*$c.B) -lt 130){
        if($x -lt $loX){$loX=$x}; if($x -gt $hiX){$hiX=$x}
        if($y -lt $loY){$loY=$y}; if($y -gt $hiY){$hiY=$y}
      }
    }
  }
  if($hiX -lt 0){ return $null }
  return ,@($loY,$hiY,$loX,$hiX)
}

""
"{0,-13} {1,24} {2,24}   {3,5} {4,5} {5,5} {6,5}" -f `
  'element','ORIGINAL y/x span','REBUILT y/x span','dTop','dBot','dLeft','dWidth'

foreach($r in $rows){
  $lbl=$r[0]; $x0=[int]$r[1]; $x1=[int]$r[2]; $y0=[int]$r[3]; $y1=[int]$r[4]
  $a = BBox $bo $x0 $x1 $y0 $y1
  $b = BBox $bn $x0 $x1 $y0 $y1
  if(-not $a -or -not $b){
    "{0,-13} {1}" -f $lbl, $(if(-not $a){'original: no ink'}else{'rebuilt: no ink'})
    continue
  }
  $sa = "{0}..{1}  {2}..{3}" -f $a[0],$a[1],$a[2],$a[3]
  $sb = "{0}..{1}  {2}..{3}" -f $b[0],$b[1],$b[2],$b[3]
  $wA = $a[3]-$a[2]; $wB = $b[3]-$b[2]
  "{0,-13} {1,20} {2,20}   {3,5} {4,5} {5,5} {6,5}" -f `
    $lbl, $sa, $sb, ($b[0]-$a[0]), ($b[1]-$a[1]), ($b[2]-$a[2]), ($wB-$wA)
}

$bo.Dispose(); $bn.Dispose()
