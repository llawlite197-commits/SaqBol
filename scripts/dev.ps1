$ErrorActionPreference = "Continue"

$Root = Split-Path -Parent $PSScriptRoot
$LogsDir = Join-Path $Root ".runtime-logs"

New-Item -ItemType Directory -Force -Path $LogsDir | Out-Null
Set-Location $Root

function Write-Info {
  param([string]$Message)
  Write-Host "[SaqBol] $Message" -ForegroundColor Cyan
}

function Test-Port {
  param([int]$Port)
  $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue |
    Where-Object { $_.State -eq "Listen" } |
    Select-Object -First 1

  return $null -ne $connection
}

function Start-DockerDesktop {
  try {
    docker ps *> $null
    if ($LASTEXITCODE -eq 0) {
      Write-Info "Docker is already running."
      return
    }
  } catch {
    # Docker CLI can throw while Docker Desktop is still starting.
  }

  $dockerPaths = @(
    "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe",
    "$env:LOCALAPPDATA\Docker\Docker Desktop.exe"
  )

  $dockerDesktop = $dockerPaths | Where-Object { Test-Path $_ } | Select-Object -First 1

  if (-not $dockerDesktop) {
    Write-Info "Docker Desktop not found. PostgreSQL must be started manually."
    return
  }

  Write-Info "Starting Docker Desktop..."
  Start-Process -FilePath $dockerDesktop -WindowStyle Hidden
}

function Wait-Docker {
  $deadline = (Get-Date).AddMinutes(2)

  do {
    try {
      docker ps *> $null
      if ($LASTEXITCODE -eq 0) {
        Write-Info "Docker is ready."
        return $true
      }
    } catch {
      # Keep waiting until timeout.
    }

    Start-Sleep -Seconds 5
  } while ((Get-Date) -lt $deadline)

  Write-Info "Docker is not ready yet. Continue without Docker services."
  return $false
}

function Start-BackgroundServer {
  param(
    [string]$Name,
    [int]$Port,
    [string]$ScriptFile
  )

  if (Test-Port $Port) {
    Write-Info "$Name already running on port $Port."
    return
  }

  Write-Info "Starting $Name on port $Port..."

  Start-Process powershell `
    -WindowStyle Hidden `
    -WorkingDirectory $Root `
    -ArgumentList "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", (Join-Path $PSScriptRoot $ScriptFile)
}

Start-DockerDesktop

if (Wait-Docker) {
  Write-Info "Starting PostgreSQL and Redis..."
  docker compose up -d postgres redis
}

Start-BackgroundServer `
  -Name "API" `
  -Port 4000 `
  -ScriptFile "dev-api.ps1"

Start-BackgroundServer `
  -Name "Public Web" `
  -Port 3000 `
  -ScriptFile "dev-public.ps1"

Start-BackgroundServer `
  -Name "Workspace Web" `
  -Port 3001 `
  -ScriptFile "dev-workspace.ps1"

Write-Host ""
Write-Host "SaqBol.kz is starting. Open these links after 10-30 seconds:" -ForegroundColor Green
Write-Host "Public Web:     http://localhost:3000"
Write-Host "Workspace Web:  http://localhost:3001/login"
Write-Host "API Swagger:    http://localhost:4000/api/docs"
Write-Host "API Health:     http://localhost:4000/api/v1/health"
Write-Host ""
Write-Host "Logs:"
Write-Host "API:            .runtime-logs\api-runtime.log"
Write-Host "Public Web:     .runtime-logs\public-web.log"
Write-Host "Workspace Web:  .runtime-logs\workspace-web.log"
