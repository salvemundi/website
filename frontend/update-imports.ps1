$replacements = @{
    "@/lib/" = "@/shared/lib/"
    "@/hooks/" = "@/shared/lib/hooks/"
    "@/config/" = "@/shared/config/"
    "@/types/" = "@/shared/model/types/"
    "@/shared/components/ui/" = "@/shared/ui/"
    "@/shared/components/sections/Footer" = "@/widgets/footer/ui/Footer"
    "@/shared/components/sections/Header" = "@/widgets/header/ui/Header"
    "@/shared/components/sections/Hero" = "@/widgets/hero/ui/Hero"
    "@/shared/components/sections/EventsSection" = "@/widgets/events-section/ui/EventsSection"
    "@/shared/components/sections/BottomNav" = "@/widgets/bottom-nav/ui/BottomNav"
    "@/shared/components/sections/InstallPromptBanner" = "@/widgets/install-prompt-banner/ui/InstallPromptBanner"
    "@/shared/components/activities/" = "@/entities/activity/ui/"
    "@/shared/components/safe-havens/" = "@/entities/safe-haven/ui/"
    "@/shared/components/stickers/" = "@/entities/sticker/ui/"
    "@/shared/components/layout/MainLayout" = "@/shared/ui/MainLayout"
    "@/shared/contexts/PWAContext" = "@/features/pwa/lib/PWAContext"
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

Write-Host "Import path updates complete!"
