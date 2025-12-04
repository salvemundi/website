$replacements = @{
    "@/shared/ui/PageHeader" = "@/widgets/page-header/ui/PageHeader"
    "@/shared/ui/HomeHeader" = "@/widgets/home-header/ui/HomeHeader"
}

Get-ChildItem -Path "src" -Include *.ts,*.tsx -Recurse | ForEach-Object {
    $file = $_
    $content = Get-Content $file.FullName -Raw
    $modified = $false
    
    foreach ($key in $replacements.Keys) {
        if ($content -match [regex]::Escape($key)) {
            $content = $content -replace [regex]::Escape($key), $replacements[$key]
            $modified = $true
        }
    }
    
    if ($modified) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated: $($file.FullName)"
    }
}

Write-Host "Widget import path updates complete!"
