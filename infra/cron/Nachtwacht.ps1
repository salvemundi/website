# --- CONFIGURATIE VIA ENV ---
$TenantId     = $env:ENTRA_TENANT_ID
$ClientId     = $env:ENTRA_CLIENT_ID
$ClientSecret = $env:ENTRA_CLIENT_SECRET
$GroupId_Actief   = $env:GROUP_ID_ACTIEF
$GroupId_Verlopen = $env:GROUP_ID_VERLOPEN
$AttributeSetName = "SalveMundiLidmaatschap"
$VerloopAttr      = "VerloopdatumStr"

if (-not $ClientSecret) { Write-Error "FATAL: Geen secrets gevonden."; exit 1 }

# ------------------------------------------------
# 1. AUTHENTICATIE (REST ONLY)
Write-Host "Start authenticatie..."
try {
    $Body = @{ 
        client_id     = $ClientId
        client_secret = $ClientSecret
        scope         = "https://graph.microsoft.com/.default"
        grant_type    = "client_credentials" 
    }
    # We halen het token op als gewone string
    $TokenResponse = Invoke-RestMethod -Uri "https://login.microsoftonline.com/$TenantId/oauth2/v2.0/token" -Method Post -Body $Body
    $AccessToken = $TokenResponse.access_token
    
    if ([string]::IsNullOrWhiteSpace($AccessToken)) { throw "Geen token ontvangen." }
    
    Write-Host "✅ Token ontvangen. Verbonden met API."
} catch {
    Write-Error "FATAL: Authenticatie mislukt. $($_.Exception.Message)"
    exit 1
}

# Standaard header voor alle verzoeken
$Headers = @{
    "Authorization" = "Bearer $AccessToken"
    "Content-Type"  = "application/json"
}

# 2. GEBRUIKERS OPHALEN (REST PAGINATION)
Write-Host "Leden ophalen..."
$UsersList = @()
$Url = "https://graph.microsoft.com/beta/users?`$select=id,userPrincipalName,customSecurityAttributes&`$top=999"
do {
    try {
        $Response = Invoke-RestMethod -Method GET -Uri $Url -Headers $Headers
        $UsersList += $Response.value
        $Url = $Response.'@odata.nextLink'
    } catch {
        Write-Error "Fout bij ophalen leden: $($_.Exception.Message)"
        exit 1
    }
} while ($Url)

Write-Host "Totaal $($UsersList.Count) gebruikers gevonden. Start analyse..."

# 3. VERWERKING
$VandaagStr = (Get-Date).ToString("yyyyMMdd")
$Ops = 0

foreach ($user in $UsersList) {
    # Check attributen (Case sensitive in PS objecten kan variëren, we checken veilig)
    if ($user.customSecurityAttributes -and $user.customSecurityAttributes.$AttributeSetName) {
        
        $LidData = $user.customSecurityAttributes.$AttributeSetName
        
        if ($LidData.$VerloopAttr) {
            $Datum = $LidData.$VerloopAttr
            $UserId = $user.id
            $UPN = $user.userPrincipalName
            
            if ($Datum -gt $VandaagStr) {
                # --- ACTIEF ---
                # Toevoegen aan Actief
                try {
                    $BodyMember = @{ "@odata.id" = "https://graph.microsoft.com/v1.0/directoryObjects/$UserId" } | ConvertTo-Json
                    Invoke-RestMethod -Method POST -Uri "https://graph.microsoft.com/v1.0/groups/$GroupId_Actief/members/`$ref" -Headers $Headers -Body $BodyMember -ErrorAction Stop
                    Write-Host "ACTIEF TOEGEVOEGD: $UPN"
                    $Ops++
                } catch {
                    # 400/409 betekent vaak: zit er al in
                }
                
                # Verwijderen uit Verlopen
                try {
                    Invoke-RestMethod -Method DELETE -Uri "https://graph.microsoft.com/v1.0/groups/$GroupId_Verlopen/members/$UserId/`$ref" -Headers $Headers -ErrorAction Stop
                } catch {}

            } else {
                # --- VERLOPEN ---
                # Toevoegen aan Verlopen
                try {
                    $BodyMember = @{ "@odata.id" = "https://graph.microsoft.com/v1.0/directoryObjects/$UserId" } | ConvertTo-Json
                    Invoke-RestMethod -Method POST -Uri "https://graph.microsoft.com/v1.0/groups/$GroupId_Verlopen/members/`$ref" -Headers $Headers -Body $BodyMember -ErrorAction Stop
                    Write-Host "VERLOPEN VERPLAATST: $UPN"
                    $Ops++
                } catch { }

                # Verwijderen uit Actief
                try {
                    Invoke-RestMethod -Method DELETE -Uri "https://graph.microsoft.com/v1.0/groups/$GroupId_Actief/members/$UserId/`$ref" -Headers $Headers -ErrorAction Stop
                } catch {}
            }
        }
    }
}

Write-Host "--- RUN VOLTOOID ---"
Write-Host "Datum check: $VandaagStr"
Write-Host "Wijzigingen: $Ops"
