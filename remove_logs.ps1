# Script to remove all console.log statements
$files = Get-ChildItem -Path "src" -Recurse -Include "*.js","*.jsx","*.ts","*.tsx"

foreach ($file in $files) {
    $content = Get-Content $file.FullName
    $newContent = $content | Where-Object { $_ -notmatch "console\.log" }
    Set-Content -Path $file.FullName -Value $newContent
    Write-Host "Processed: $($file.Name)"
}

Write-Host "All console.log statements removed!"
