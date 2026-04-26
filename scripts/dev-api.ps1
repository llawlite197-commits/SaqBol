$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent $PSScriptRoot
$Log = Join-Path $Root ".runtime-logs\api-runtime.log"

Set-Location $Root
$env:PORT = "4000"

corepack pnpm --filter api build *> $Log
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

Set-Location (Join-Path $Root "apps\api")
node dist\main.js *>> $Log
