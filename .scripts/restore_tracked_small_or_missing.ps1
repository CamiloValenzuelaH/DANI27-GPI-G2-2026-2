$files = @('job_response.json','sample.pdf','sample_text.pdf','init.sql')
foreach($f in $files){
  $p = Join-Path $PWD.Path $f
  $exists = Test-Path $p
  $len = 0
  if($exists){ $len=(Get-Item $p).Length }
  Write-Output "$f|EXISTS:$exists|LENGTH:$len"
  git ls-files --error-unmatch $f 2>$null
  if($?){
    Write-Output "$f|TRACKED"
    if((!$exists) -or ($len -le 1)){
      Write-Output "$f|WILL_RESTORE_FROM_GIT"
      git checkout -- $f
      if(Test-Path $p){ $len2=(Get-Item $p).Length; Write-Output "$f|RESTORED|$len2" } else { Write-Output "$f|RESTORE_FAILED" }
    } else {
      Write-Output "$f|OK_NO_RESTORE"
    }
  } else {
    Write-Output "$f|UNTRACKED_NO_ACTION"
  }
}
Write-Output "RESTORE_RUN_DONE"
