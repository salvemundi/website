<#
.SYNOPSIS
    Exports the current project to a 'clean' folder outside the repository, 
    excluding version control, build artifacts, and large files.
    Ensures the export stays under ~100MB by filtering heavy assets.

.DESCRIPTION
    This script mirrors the repository to ..\website-import-clean.
    It excludes: node_modules, .git, .next, .agent, dist, .vs, bin, obj, .idea.
    It excludes files > 50MB.
    It excludes archives and videos (*.zip, *.mp4, etc.).

.EXAMPLE
    .\scripts\export-to-clean.ps1
#>

# Get the repository root (assumed to be one level up from /scripts)
$RepoRoot = Resolve-Path "$PSScriptRoot\.."
$RepoRootPath = $RepoRoot.Path

# Define the target directory (sibling to the repo)
$ParentDir = Split-Path -Parent $RepoRootPath
$TargetDirName = "website-import-clean"
$TargetDir = Join-Path $ParentDir $TargetDirName

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "      Clean Project Exporter (Lite)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Source:      $RepoRootPath"
Write-Host "Destination: $TargetDir"
Write-Host ""

# 1. Versioning: Rename existing target folder if it exists
if (Test-Path $TargetDir) {
    try {
        $Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
        $BackupName = "${TargetDirName}-${Timestamp}"
        Write-Host "Archiving previous export to: $BackupName" -ForegroundColor Yellow
        Rename-Item -Path $TargetDir -NewName $BackupName -ErrorAction Stop
    }
    catch {
        Write-Error "Failed to rename existing directory. Ensure no files are open in $TargetDir."
        exit 1
    }
}

# 2. Configuration
# Exclude Directories
$ExcludeDirs = @(
    "node_modules", 
    ".git", 
    ".next", 
    ".agent", 
    "dist", 
    ".vs", 
    "bin", 
    "obj", 
    ".idea",
    ".vscode",
    "coverage",
    "build",
    "tmp",
    "temp"
)

# Exclude Files (Large Media & Archives)
$ExcludeFiles = @(
    "*.zip",
    "*.tar",
    "*.gz",
    "*.rar",
    "*.7z",
    "*.iso",
    "*.mp4",
    "*.mov",
    "*.avi",
    "*.mkv",
    "*.webm",
    "*.bak",
    "*.old",
    "*.log",
    "*.tmp",
    "desktop.ini",
    "Thumbs.db"
)

# Robocopy Arguments
# /MAX:50000000  -> Skip files larger than 50MB
# /MIR           -> Mirror (Purge + Copy subdirs)
# /MT:8          -> Multithreaded
# /XD ...        -> Exclude Dirs
# /XF ...        -> Exclude Files

$RoboArgs = @(
    $RepoRootPath,
    $TargetDir,
    "/MIR",
    "/MT:8",
    "/R:2",
    "/W:1",
    "/MAX:50000000"
)

# Add Directory Exclusions
$RoboArgs += "/XD"
$RoboArgs += $ExcludeDirs

# Add File Exclusions
$RoboArgs += "/XF"
$RoboArgs += $ExcludeFiles

Write-Host "Starting optimized export..." -ForegroundColor Green

# Use Start-Process to run robocopy
$Process = Start-Process -FilePath "robocopy" -ArgumentList $RoboArgs -NoNewWindow -PassThru -Wait

if ($Process.ExitCode -ge 8) {
    Write-Host ""
    Write-Host "❌ Export failed (Robocopy Exit Code: $($Process.ExitCode))" -ForegroundColor Red
    exit $Process.ExitCode
}

Write-Host ""
Write-Host "✅ Export completed successfully!" -ForegroundColor Green

# 3. Size Check
Write-Host "Calculating export size..." -ForegroundColor Cyan

$SizeInBytes = (Get-ChildItem -Path $TargetDir -Recurse -Force | Measure-Object -Property Length -Sum).Sum
$SizeInMB = [math]::Round($SizeInBytes / 1MB, 2)

Write-Host "Total Size: $SizeInMB MB"

if ($SizeInMB -gt 100) {
    Write-Host "⚠️ WARNING: Still exceeds 100MB ($SizeInMB MB)." -ForegroundColor Red
    Write-Host "Check for large assets in 'public' or static folders."
} else {
    Write-Host "✅ SUCCESS: Export is under 100MB!" -ForegroundColor Green
}

Write-Host ""
if ($Host.Name -eq "ConsoleHost") {
    Read-Host "Press Enter to exit"
}
