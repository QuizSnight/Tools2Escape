$ErrorActionPreference = "Stop"

$deploymentId = $env:T2E_GOOGLE_SCRIPT_DEPLOYMENT_ID
if (-not $deploymentId) {
  $deploymentId = "AKfycbzpJLJv2SjzXJcPHpircVRHXQJcFk4n3V9uterXn3Cc92XQ1x7qGjazdypFLyEIFhmw"
}

Write-Host "Pushing Google Sheets sync code to Apps Script..."
$pushOutput = & clasp push 2>&1
$pushOutput | ForEach-Object { Write-Host $_ }
if ($LASTEXITCODE -ne 0) {
  throw "clasp push failed."
}

Write-Host "Deploying Google Sheets sync web app..."
$description = "Tools2EscApp Sheets Sync $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$deployOutput = & clasp deploy --deploymentId $deploymentId --description $description 2>&1
$deployOutput | ForEach-Object { Write-Host $_ }
if ($LASTEXITCODE -ne 0 -or ($deployOutput -join "`n") -match "Apps Script API") {
  throw "clasp deploy failed. Enable the Apps Script API at https://script.google.com/home/usersettings and retry."
}

Write-Host "Done."
