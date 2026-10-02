# Development deployment: build the server, register Add-ins, and start/restart a background bridge.
[CmdletBinding()]
param(
    [ValidateRange(1025, 65535)]
    [int]$Port = $(if ($env:WPS_MCP_PORT) { [int]$env:WPS_MCP_PORT } else { 18766 }),
    [string]$DataDirectory = $(if ($env:WPS_MCP_DATA_DIR) { $env:WPS_MCP_DATA_DIR } else { Join-Path $env:APPDATA 'wps-mcp' }),
    [string]$AddinsDirectory = $(if ($env:WPS_MCP_ADDINS_DIR) { $env:WPS_MCP_ADDINS_DIR } else { Join-Path $env:APPDATA 'kingsoft\wps\jsaddons' })
)
$ErrorActionPreference = 'Stop'
$projectDirectory = Split-Path $PSScriptRoot -Parent
$serverPath = Join-Path $projectDirectory 'dist\src\server.js'
$DataDirectory = [IO.Path]::GetFullPath($DataDirectory)
$AddinsDirectory = [IO.Path]::GetFullPath($AddinsDirectory)
$node = (Get-Command node.exe -ErrorAction Stop).Source
$npm = (Get-Command npm.cmd -ErrorAction Stop).Source
$nodeVersion = (& $node --version).TrimStart('v').Split('.')
if ($LASTEXITCODE -ne 0 -or [int]$nodeVersion[0] -lt 22 -or ([int]$nodeVersion[0] -eq 22 -and [int]$nodeVersion[1] -lt 19)) { throw 'Node.js 22.19.0 or newer is required.' }
$wpsProcesses = @(Get-Process -Name wps, et, wpp, wpscenter, promecefpluginhost -ErrorAction SilentlyContinue)
if ($wpsProcesses.Count) { throw 'Fully quit WPS Office, including its tray process, before deployment.' }
$baseUrl = "http://127.0.0.1:$Port"
$metadataPath = Join-Path $projectDirectory '.dev\windows-deployment.json'
$bridgeProcess = $null
$listeners = @(Get-NetTCPConnection -State Listen -ErrorAction Stop | Where-Object { $_.LocalPort -eq $Port })
if ($listeners.Count) {
    if ($listeners.Count -ne 1 -or $listeners[0].LocalAddress -ne '127.0.0.1' -or -not (Test-Path -LiteralPath $metadataPath)) { throw "Port $Port is occupied by an unmanaged service." }
    $metadata = Get-Content -LiteralPath $metadataPath -Raw | ConvertFrom-Json
    $bridgeProcess = Get-CimInstance Win32_Process -Filter ("ProcessId=" + $listeners[0].OwningProcess)
    if ($bridgeProcess.Name -ne 'node.exe' -or -not $bridgeProcess.CommandLine.Contains('"' + $serverPath + '"') -or $metadata.pid -ne $bridgeProcess.ProcessId -or $metadata.dataDirectory -ne $DataDirectory) { throw 'Existing service belongs to another checkout or data directory.' }
    if ((Invoke-RestMethod "$baseUrl/api/chat" -TimeoutSec 5).busy -ne $false) { throw 'Wait for the active conversation to finish.' }
}
Push-Location $projectDirectory
try {
    & $npm ci
    if ($LASTEXITCODE -ne 0) { throw 'npm ci failed.' }
    & $npm run build
    if ($LASTEXITCODE -ne 0) { throw 'Build failed.' }
    $registryScript = @'
const { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync, constants } = require('node:fs');
const { join } = require('node:path');
const { randomBytes } = require('node:crypto');
const [directory, port, enable, platform] = process.argv.slice(2);
if (!/^\d+$/.test(port) || Number(port) < 1025 || Number(port) > 65535 || !/^[\w-]+$/.test(enable)) throw new Error('Invalid port or Add-in enable setting');
const hosts = [['et', 'WpsMcpET'], ['wpp', 'WpsMcpWPP'], ['wps', 'WpsMcpWPS']];
const publishPath = join(directory, 'publish.xml');
const original = existsSync(publishPath) ? readFileSync(publishPath, 'utf8') : null;
let publish = original ?? '<?xml version="1.0" encoding="UTF-8"?>\n<jsplugins>\n</jsplugins>\n';
if ((publish.match(/<\/jsplugins>/gi) ?? []).length !== 1) throw new Error('Invalid publish.xml; left unchanged');
const eol = publish.includes('\r\n') ? '\r\n' : '\n';
const entry = ([host, name]) => `<jspluginonline name="${name}" url="http://127.0.0.1:${port}/addins/${host}/" type="${host}" enable="${enable}" debug="" install="null"/>`;
const seen = new Set();
publish = publish.replace(/<jsplugin(?:online)?\b[^>]*\bname\s*=\s*["'](WpsMcpET|WpsMcpWPP|WpsMcpWPS)["'][^>]*\/?>/gi, (tag, name) => {
  if (seen.has(name)) return '';
  seen.add(name);
  return entry(hosts.find(host => host[1] === name));
});
const missing = hosts.filter(host => !seen.has(host[1]));
if (missing.length) publish = publish.replace(/<\/jsplugins>/i, missing.map(host => '  ' + entry(host)).join(eol) + eol + '</jsplugins>');
const changes = [[publishPath, original, publish, '.backup-before-wps-mcp']];
if (platform === 'darwin') {
  const authPath = join(directory, 'authaddin.json');
  const oldAuth = existsSync(authPath) ? readFileSync(authPath, 'utf8') : null;
  const auth = oldAuth === null ? {} : JSON.parse(oldAuth);
  const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  if (!isObject(auth) || (auth.wps !== undefined && !isObject(auth.wps))) throw new Error('Invalid authaddin.json; registries left unchanged');
  const writer = auth.wps ??= {};
  const id = Object.keys(writer).find(key => key !== 'namelist' && writer[key]?.name === 'WpsMcpWPS') ?? randomBytes(16).toString('hex');
  writer[id] = { ...writer[id], enable: true, isload: true, md5: '', mode: 2, name: 'WpsMcpWPS', path: `http://127.0.0.1:${port}/addins/wps` };
  writer.namelist = [...new Set([...String(writer.namelist ?? '').split(';').filter(Boolean), id])].join(';');
  changes.push([authPath, oldAuth, JSON.stringify(auth, null, 2) + '\n', '.backup-before-wps-mcp-writer']);
}
// Validate both files before writing either; keep the first backups and all unrelated Add-ins.
mkdirSync(directory, { recursive: true });
for (const [path, before, after, suffix] of changes) {
  if (before === after) continue;
  if (before !== null && !existsSync(path + suffix)) copyFileSync(path, path + suffix, constants.COPYFILE_EXCL);
  writeFileSync(path, after, 'utf8');
}
console.log('Registered ET/WPP/Writer Add-ins:', directory);
'@
    $enable = if ($env:WPS_MCP_ADDIN_ENABLE) { $env:WPS_MCP_ADDIN_ENABLE } else { 'enable_dev' }
    $registryScript | & $node - $AddinsDirectory $Port $enable win32
    if ($LASTEXITCODE -ne 0) { throw 'Add-in registration failed.' }
    if ($bridgeProcess) {
        $previous = Get-Process -Id $bridgeProcess.ProcessId
        Stop-Process -Id $bridgeProcess.ProcessId
        if (-not $previous.WaitForExit(10000)) { throw 'Previous bridge did not exit.' }
    }
    $logsDirectory = Join-Path $DataDirectory 'logs'
    New-Item -ItemType Directory -Path $logsDirectory -Force | Out-Null
    New-Item -ItemType Directory -Path (Split-Path $metadataPath -Parent) -Force | Out-Null
    $runId = Get-Date -Format 'yyyyMMdd-HHmmss-fff'
    $outLog = Join-Path $logsDirectory "server-$runId.stdout.log"
    $errLog = Join-Path $logsDirectory "server-$runId.stderr.log"
    $oldTransport = $env:WPS_MCP_TRANSPORT
    $oldPort = $env:WPS_MCP_PORT
    $oldData = $env:WPS_MCP_DATA_DIR
    try {
        $env:WPS_MCP_TRANSPORT = 'http'
        $env:WPS_MCP_PORT = [string]$Port
        $env:WPS_MCP_DATA_DIR = $DataDirectory
        $bridge = Start-Process -FilePath $node -ArgumentList ('"' + $serverPath + '"') -WorkingDirectory $projectDirectory -WindowStyle Hidden -RedirectStandardOutput $outLog -RedirectStandardError $errLog -PassThru
    } finally {
        $env:WPS_MCP_TRANSPORT = $oldTransport
        $env:WPS_MCP_PORT = $oldPort
        $env:WPS_MCP_DATA_DIR = $oldData
    }
    @{ pid = $bridge.Id; dataDirectory = $DataDirectory; port = $Port } | ConvertTo-Json | Set-Content -LiteralPath $metadataPath -Encoding UTF8
    $ready = $false
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        if ($bridge.HasExited) { throw "Server exited; see $errLog" }
        try { $ready = (Invoke-RestMethod "$baseUrl/health" -TimeoutSec 2).ok -eq $true } catch { $ready = $false }
        if ($ready) { break }
        Start-Sleep -Seconds 1
    }
    if (-not $ready) { throw "Server did not become ready; see $errLog" }
    foreach ($asset in @('addins/et/', 'addins/wpp/', 'addins/wps/', 'addon/taskpane.html', 'addon/taskpane.js')) {
        if ((Invoke-WebRequest "$baseUrl/$asset" -UseBasicParsing -TimeoutSec 5).StatusCode -ne 200) { throw "Asset is unavailable: $asset" }
    }
    Write-Host "Deployed. Open WPS to verify the assistant. Server: $baseUrl; data: $DataDirectory"
} finally { Pop-Location }
