$replacements = @{
    "from '@/hooks/" = "from '@/shared/lib/hooks/"
    "from `"@/hooks/" = "from `"@/shared/lib/hooks/"
    "../ui/EventCard" = "@/shared/ui/EventCard"
    "../ui/ThemeToggle" = "@/features/theme/ui/ThemeToggle"
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

Write-Host "Additional import fixes complete!"
