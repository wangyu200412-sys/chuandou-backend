<#
.SYNOPSIS
    Push this repo to a remote and open the Supabase / Render pages.
.DESCRIPTION
    Usage:
      1. Create an EMPTY repository on GitHub (no README).
      2. Run:  powershell -ExecutionPolicy Bypass -File .\push_and_deploy.ps1 -RepoUrl https://github.com/<user>/<repo>.git
         (or run without -RepoUrl and paste the URL when prompted)
      3. If GitHub asks you to sign in, a browser window opens - just approve it.
#>
param(
    [string]$RepoUrl
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not $RepoUrl) {
    $RepoUrl = Read-Host "Paste the empty GitHub repo URL (e.g. https://github.com/<user>/<repo>.git)"
}
$RepoUrl = $RepoUrl.Trim()
if ($RepoUrl -notmatch "^https://.*\.git$" -and $RepoUrl -notmatch "^git@") {
    Write-Host "[WARN] URL looks unusual, continuing anyway: $RepoUrl"
}

Write-Host "[1/3] Configuring remote..."
git remote remove origin 2>$null | Out-Null
git remote add origin $RepoUrl
git branch -M main

Write-Host "[2/3] Pushing (a browser window may open for GitHub sign-in)..."
git push -u origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "[FAIL] Push failed. Copy the error message and ask me to fix it."
    exit 1
}
Write-Host "[OK] Code pushed to $RepoUrl"

Write-Host "[3/3] Opening Supabase and Render in your browser..."
Start-Process "https://supabase.com/dashboard/new"
Start-Process "https://dashboard.render.com/select-repo?type=blueprint"

Write-Host ""
Write-Host "Next steps (see 部署到Render-免费方案.md):"
Write-Host "  1. Supabase: create project -> Connect -> Session pooler (port 5432) -> copy the URI"
Write-Host "  2. Render: pick this repo -> use render.yaml -> paste DATABASE_URL"
Write-Host "  3. Optional: python migrate_sqlite_to_pg.py  (imports the 10 local rows)"
