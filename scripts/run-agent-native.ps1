# Run the collector agent natively on Windows (outside Docker).
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Jar = Get-ChildItem "$Root\agent\agent-app\target\agent-app-*.jar" -ErrorAction SilentlyContinue | Select-Object -First 1

if (-not $Jar) {
  Write-Error "Agent JAR not found. Run scripts/build.sh first (or mvn -pl agent/agent-app -am package)."
}

if (-not $env:SPRING_PROFILES_ACTIVE) { $env:SPRING_PROFILES_ACTIVE = "tier-core" }
if (-not $env:AGENT_MANAGER_URL) {
  $port = if ($env:MANAGER_PORT) { $env:MANAGER_PORT } else { "28471" }
  $env:AGENT_MANAGER_URL = "http://localhost:$port"
}
if (-not $env:AGENT_API_KEY) { $env:AGENT_API_KEY = "dev-agent-key" }

$ConfigDir = Join-Path $env:USERPROFILE ".agent-retry"
$ConfigFile = Join-Path $ConfigDir "config.yaml"
$SourceConfig = Join-Path $Root "config\agent\config.yaml"
if (-not (Test-Path $ConfigFile) -and (Test-Path $SourceConfig)) {
  New-Item -ItemType Directory -Force -Path $ConfigDir | Out-Null
  Copy-Item $SourceConfig $ConfigFile
  Write-Host "Copied tier-core config to $ConfigFile"
}

Write-Host "Starting agent (profile=$($env:SPRING_PROFILES_ACTIVE), manager=$($env:AGENT_MANAGER_URL))"
& java -jar $Jar.FullName
