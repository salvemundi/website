$content = Get-Content "src/app/commissies/[slug]/page.tsx" | ForEach-Object {
    $_ -replace "from '@/hooks/useSalvemundiApi'", "from '@/shared/lib/hooks/useSalvemundiApi'" `
       -replace "from '@/lib/api/salvemundi'", "from '@/shared/lib/api/salvemundi'" `
       -replace "from '@/lib/utils/slug'", "from '@/shared/lib/utils/slug'"
}
$content | Set-Content "src/app/commissies/[slug]/page.tsx"
Write-Host "Fixed imports in committee detail page"
