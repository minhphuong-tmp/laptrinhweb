$files = Get-ChildItem -Path "src" -Recurse | Where-Object { $_.Extension -eq ".js" -or $_.Extension -eq ".jsx" }
foreach ($file in $files) {
    Write-Host "Processing $($file.FullName)"
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    if ($content -match 'oqtlakdvlmkaalymgrwd') {
        $newContent = $content -replace 'oqtlakdvlmkaalymgrwd', 'spqjbrmpwgwjcynvbadr' -replace 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwcWpicm1wd2d3amN5bnZiYWRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NTc2MzAsImV4cCI6MjA4NjUzMzYzMH0.kZAA9T_C3lsinqRFOyhKxEaCZ-KpobflDdhQeN2HCWM'
        Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8
        Write-Host "Updated $($file.Name)"
    }
}
