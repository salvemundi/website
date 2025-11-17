# Test script for Directus Entra ID extension
# This tests if the endpoint exists and responds correctly

$DirectusUrl = "https://admin.salvemundi.nl"
$Endpoint = "$DirectusUrl/auth/login/entra"

Write-Host "[TEST] Testing Directus Entra ID Extension..." -ForegroundColor Cyan
Write-Host "[INFO] Endpoint: $Endpoint" -ForegroundColor Gray
Write-Host ""

# Test 1: Check if endpoint exists (should return 400 for missing data, not 404)
Write-Host "Test 1: Checking if endpoint exists..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri $Endpoint -Method POST `
        -ContentType "application/json" `
        -Body '{"token": "test", "email": "test@test.com"}' `
        -ErrorAction SilentlyContinue

    Write-Host "  [OK] Endpoint exists! Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "  Response: $($response.Content.Substring(0, [Math]::Min(200, $response.Content.Length)))" -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorBody = ""
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        $reader.Close()
    }
    
    Write-Host "  Status Code: $statusCode" -ForegroundColor Yellow
    
    if ($statusCode -eq 404) {
        Write-Host "  [ERROR] Endpoint NOT FOUND (404)" -ForegroundColor Red
        Write-Host "  Extension is not loaded or endpoint path is wrong" -ForegroundColor Yellow
        Write-Host "" 
        Write-Host "  [TIP] Make sure you:" -ForegroundColor Yellow
        Write-Host "     1. Built extension: cd extensions/.../directus-extension-entra-auth && npm run build" -ForegroundColor Gray
        Write-Host "     2. Restarted Directus" -ForegroundColor Gray
        Write-Host "     3. Check Directus logs for extension loading errors" -ForegroundColor Gray
    } elseif ($statusCode -eq 400) {
        Write-Host "  [OK] Endpoint EXISTS! (400 = validation error, expected for test data)" -ForegroundColor Green
        if ($errorBody) {
            Write-Host "  Error response: $($errorBody.Substring(0, [Math]::Min(200, $errorBody.Length)))" -ForegroundColor Gray
        }
    } elseif ($statusCode -eq 500) {
        Write-Host "  [WARN] Endpoint exists but has SERVER ERROR (500)" -ForegroundColor Yellow
        Write-Host "  The extension is loaded but throwing an error" -ForegroundColor Yellow
        if ($errorBody) {
            Write-Host "  Error: $($errorBody.Substring(0, [Math]::Min(300, $errorBody.Length)))" -ForegroundColor Gray
        }
        Write-Host "  Check Directus server logs for details" -ForegroundColor Gray
    } elseif ($statusCode -eq 0 -or $null -eq $statusCode) {
        Write-Host "  [ERROR] No response from server (CORS or network issue)" -ForegroundColor Red
        Write-Host "  Check if Directus CORS is configured for localhost" -ForegroundColor Yellow
    } else {
        Write-Host "  [INFO] Status: $statusCode" -ForegroundColor Yellow
        if ($errorBody) {
            Write-Host "  Response: $($errorBody.Substring(0, [Math]::Min(200, $errorBody.Length)))" -ForegroundColor Gray
        }
    }
}

Write-Host ""
Write-Host "Test 2: Checking Directus server..." -ForegroundColor Yellow

try {
    $extensionsResponse = Invoke-WebRequest -Uri "$DirectusUrl/server/info" `
        -Method GET `
        -ErrorAction SilentlyContinue
    
    Write-Host "  [OK] Directus is responding" -ForegroundColor Green
    
    # Try to parse and show version
    $info = $extensionsResponse.Content | ConvertFrom-Json
    if ($info.data.directus.version) {
        Write-Host "  [INFO] Directus version: $($info.data.directus.version)" -ForegroundColor Gray
    }
} catch {
    Write-Host "  [WARN] Could not connect to Directus" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[SUMMARY]" -ForegroundColor Cyan
Write-Host "  - If you see 404: Extension is NOT installed" -ForegroundColor Gray
Write-Host "  - If you see 400: Extension IS installed (missing required fields is expected)" -ForegroundColor Gray
Write-Host "  - If you see 500: Extension is installed but has an error (check logs)" -ForegroundColor Gray
Write-Host ""
