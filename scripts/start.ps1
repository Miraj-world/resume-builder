param(
  [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"
$root = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$localDirectory = Join-Path $root ".local"
$logDirectory = Join-Path $root "logs"
$pidFile = Join-Path $localDirectory "dev.pid"
$stdoutLog = Join-Path $logDirectory "dev.stdout.log"
$stderrLog = Join-Path $logDirectory "dev.stderr.log"
$webUrl = "http://127.0.0.1:5173"
$apiUrl = "http://127.0.0.1:4010/health"

function Test-Url {
  param([Parameter(Mandatory = $true)][string]$Url)

  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 400
  }
  catch {
    return $false
  }
}

function Test-PortInUse {
  param([Parameter(Mandatory = $true)][int]$Port)

  return $null -ne (Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1)
}

function Stop-TrackedSession {
  if (-not (Test-Path -LiteralPath $pidFile)) {
    return
  }

  $storedPid = (Get-Content -LiteralPath $pidFile -Raw).Trim()
  $parsedPid = 0
  if (-not [int]::TryParse($storedPid, [ref]$parsedPid)) {
    Remove-Item -LiteralPath $pidFile -Force
    return
  }

  if (Get-Process -Id $parsedPid -ErrorAction SilentlyContinue) {
    Write-Host "Restarting the previous Resume Builder session..." -ForegroundColor DarkGray
    $gracefulStop = Start-Process `
      -FilePath "taskkill.exe" `
      -ArgumentList @("/PID", $parsedPid, "/T") `
      -WindowStyle Hidden `
      -Wait `
      -PassThru
    for ($attempt = 0; $attempt -lt 10; $attempt++) {
      if (-not (Get-Process -Id $parsedPid -ErrorAction SilentlyContinue)) {
        break
      }
      Start-Sleep -Milliseconds 300
    }
    if (Get-Process -Id $parsedPid -ErrorAction SilentlyContinue) {
      $forcedStop = Start-Process `
        -FilePath "taskkill.exe" `
        -ArgumentList @("/PID", $parsedPid, "/T", "/F") `
        -WindowStyle Hidden `
        -Wait `
        -PassThru
    }
    Start-Sleep -Milliseconds 500
  }

  Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
}

if (-not (Get-Command node.exe -ErrorAction SilentlyContinue)) {
  throw "Node.js was not found. Install Node.js 24, then run start.bat again."
}

if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
  throw "npm was not found. Install npm 11 or newer, then run start.bat again."
}

$nodeMajor = [int]((node.exe --version).TrimStart("v").Split(".")[0])
if ($nodeMajor -ne 24) {
  Write-Warning "This project is validated with Node.js 24. Detected Node.js $nodeMajor."
}

New-Item -ItemType Directory -Path $localDirectory, $logDirectory -Force | Out-Null
Stop-TrackedSession

for ($attempt = 0; $attempt -lt 10; $attempt++) {
  if (-not (Test-PortInUse -Port 4010) -and -not (Test-PortInUse -Port 5173)) {
    break
  }
  Start-Sleep -Milliseconds 500
}

if ((Test-Url -Url $apiUrl) -and (Test-Url -Url $webUrl)) {
  Write-Host "Resume Builder is already running." -ForegroundColor Green
  if (-not $NoBrowser) {
    Start-Process $webUrl
  }
  exit 0
}

if (Test-PortInUse -Port 4010) {
  throw "Port 4010 is already being used by another process. Close it and run start.bat again."
}

if (Test-PortInUse -Port 5173) {
  throw "Port 5173 is already being used by another process. Close it and run start.bat again."
}

Write-Host "Checking dependencies..." -ForegroundColor Cyan
& npm.cmd install --no-audit --no-fund
if ($LASTEXITCODE -ne 0) {
  throw "Dependency installation failed."
}

Remove-Item -LiteralPath $stdoutLog, $stderrLog -Force -ErrorAction SilentlyContinue
Write-Host "Launching services..." -ForegroundColor Cyan
$process = Start-Process `
  -FilePath "cmd.exe" `
  -ArgumentList @("/d", "/s", "/c", "npm run dev") `
  -WorkingDirectory $root `
  -RedirectStandardOutput $stdoutLog `
  -RedirectStandardError $stderrLog `
  -WindowStyle Hidden `
  -PassThru

Set-Content -LiteralPath $pidFile -Value $process.Id -NoNewline

$ready = $false
for ($attempt = 0; $attempt -lt 45; $attempt++) {
  if ($process.HasExited) {
    break
  }

  if ((Test-Url -Url $apiUrl) -and (Test-Url -Url $webUrl)) {
    $ready = $true
    break
  }

  Start-Sleep -Seconds 1
  $process.Refresh()
}

if (-not $ready) {
  if (-not $process.HasExited) {
    & taskkill.exe /PID $process.Id /T /F 2>$null | Out-Null
  }
  Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
  throw "The services did not become ready. Inspect logs\dev.stdout.log and logs\dev.stderr.log."
}

Write-Host "API ready: $apiUrl" -ForegroundColor Green
Write-Host "Web ready: $webUrl" -ForegroundColor Green

if (-not $NoBrowser) {
  Start-Process $webUrl
}
