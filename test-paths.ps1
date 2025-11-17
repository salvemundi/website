# Test different endpoint paths
$DirectusUrl = "https://admin.salvemundi.nl"

Write-Host "[TEST] Testing different endpoint paths..." -ForegroundColor Cyan
Write-Host ""

$paths = @(
    "/auth/login/entra",
    "/extensions/directus-extension-entra-auth/auth/login/entra",
    "/directus-extension-entra-auth/auth/login/entra"
)

foreach ($path in $paths) {
    $endpoint = "$DirectusUrl$path"
    Write-Host "Testing: $endpoint" -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest -Uri $endpoint -Method POST `
            -ContentType "application/json" `
            -Body '{"token":"test","email":"test@test.com"}' `
            -ErrorAction SilentlyContinue

        Write-Host "  [OK] Status: $($response.StatusCode)" -ForegroundColor Green
        break
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        
        if ($statusCode -eq 404) {
            Write-Host "  [404] Not found at this path" -ForegroundColor Red
        } elseif ($statusCode -eq 400) {
            Write-Host "  [OK] Found! (400 = validation error, expected)" -ForegroundColor Green
            Write-Host "  Correct endpoint: $endpoint" -ForegroundColor Cyan
            break
        } elseif ($statusCode -eq 500) {
            Write-Host "  [OK] Found! (500 = server error)" -ForegroundColor Yellow
            Write-Host "  Correct endpoint: $endpoint" -ForegroundColor Cyan
            break
        } else {
            Write-Host "  Status: $statusCode" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
