$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent $PSScriptRoot
$Log = Join-Path $Root ".runtime-logs\workspace-web.log"

Set-Location $Root
$env:NEXT_PUBLIC_API_URL = "http://localhost:4000/api/v1"
$env:NEXT_PUBLIC_WORKSPACE_BASE_PATH = ""

corepack pnpm --filter workspace-web dev *> $Log
