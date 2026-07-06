$files = @('job_response.json','sample.pdf','sample_text.pdf','init.sql')
foreach($f in $files){
  $p = Join-Path $PWD.Path $f
  if(Test-Path $p){
    $len = (Get-Item $p).Length
    Write-Output "$f|EXISTS|$len"
    if($len -eq 0){
      git ls-files --error-unmatch $f 2>$null
      if($?){
        Write-Output "$f|TRACKED_ZERO|restoring"
        git checkout -- $f
        if(Test-Path $p){ $len2=(Get-Item $p).Length; Write-Output "$f|RESTORED|$len2" } else { Write-Output "$f|RESTORE_FAILED" }
      } else {
        Write-Output "$f|UNTRACKED_ZERO|skipped"
      }
    }
  } else {
    Write-Output "$f|MISSING"
  }
}
Write-Output "CHECK_DONE"
