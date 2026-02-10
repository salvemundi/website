# Script to cancel stuck GitHub Actions workflows
# Usage: .\cancel-workflow.ps1 -RunId <run-id>

param(
    [Parameter(Mandatory=$true)]
    [string]$RunId,
    
    [string]$Token = $env:GITHUB_TOKEN
)

if (-not $Token) {
    Write-Error "GITHUB_TOKEN environment variable niet gevonden. Maak een Personal Access Token aan op https://github.com/settings/tokens"
    exit 1
}

$owner = "salvemundi"
$repo = "website"
$url = "https://api.github.com/repos/$owner/$repo/actions/runs/$RunId/cancel"

Write-Host "Cancelling workflow run $RunId..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Headers @{
        Authorization = "token $Token"
        Accept = "application/vnd.github.v3+json"
    }
    Write-Host "Workflow succesvol geannuleerd!" -ForegroundColor Green
} catch {
    Write-Error "Fout bij annuleren: $_"
    Write-Host $_.Exception.Response -ForegroundColor Red
}
