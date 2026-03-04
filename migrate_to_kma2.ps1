$newUrl = "https://tguxydfhxcmqvcrenqbl.supabase.co"
$newKey = "sb_publishable_xTtXPnIrJctAzPIR15pb8A_ju-NIXBx"
$newId = "tguxydfhxcmqvcrenqbl"

# Old IDs/URLs to replace
$oldIds = @("spqjbrmpwgwjcynvbadr", "oqtlakdvlmkaalymgrwd")

$files = Get-ChildItem -Path "src", "server.js" -Recurse -Include *.js, *.jsx, *.env

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $modified = $false

    foreach ($oldId in $oldIds) {
        if ($content -match $oldId) {
            $content = $content -replace "https://$oldId.supabase.co", $newUrl
            $content = $content -replace $oldId, $newId # Catch naked IDs
            $modified = $true
        }
    }
    
    # Specific fix for hardcoded keys if they exist (naive replacement of known old keys won't work easily if we don't have them all, 
    # but replacing the *variable assignment* pattern might be safer if we want to be thorough. 
    # For now, relying on ID replacement for URL is key. 
    # The .env update handles the main key source.
    # We will try to replace specific long JWT strings if found, but might just rely on the ID check for URLs.)

    if ($modified) {
        Set-Content -Path $file.FullName -Value $content
        Write-Host "Updated: $($file.Name)"
    }
}
