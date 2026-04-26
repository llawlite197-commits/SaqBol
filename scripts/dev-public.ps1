$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent $PSScriptRoot
$Log = Join-Path $Root ".runtime-logs\public-web.log"

Set-Location $Root
$env:NEXT_PUBLIC_API_URL = "http://localhost:4000/api/v1"

corepack pnpm --filter public-web dev *> $Log
