#!/usr/bin/env pwsh
# run-local.ps1
# Helper: start the compiled backend with the service account set for the current PowerShell session.

Param(
    [string]$ServiceAccountPath = "$PSScriptRoot\serviceAccountKey.json",
    [int]$Port = 5000
)

Write-Host "Starting backend (local)" -ForegroundColor Cyan
if (-not (Test-Path $ServiceAccountPath)) {
    Write-Error "Service account file not found: $ServiceAccountPath"
    Write-Host "Place your service account JSON at the above path or pass -ServiceAccountPath <path>" -ForegroundColor Yellow
    exit 2
}

$env:GOOGLE_APPLICATION_CREDENTIALS = (Resolve-Path $ServiceAccountPath).Path
Write-Host "GOOGLE_APPLICATION_CREDENTIALS set to: $env:GOOGLE_APPLICATION_CREDENTIALS" -ForegroundColor Green

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "node not found in PATH. Install Node.js or adjust your PATH."
    exit 3
}

Push-Location $PSScriptRoot
try {
    Write-Host "Running: node dist/index.js (working dir: $PSScriptRoot)" -ForegroundColor Cyan
    & node dist/index.js
} finally {
    Pop-Location
}
