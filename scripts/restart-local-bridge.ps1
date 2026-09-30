# Restart this project's local bridge without touching WPS documents or saved configuration.
[CmdletBinding()]
param(
    [int]$Port = 18766,
    [string]$DataDirectory = (Join-Path $env:APPDATA 'wps-mcp'),
    [switch]$CheckOnly
)
$ErrorActionPreference = 'Stop'
$projectDirectory = Split-Path $PSScriptRoot -Parent
$serverPath = Join-Path $projectDirectory 'dist\src\server.js'
if (-not (Test-Path -LiteralPath $serverPath)) { throw '请先在项目目录运行 npm run build。' }
$baseUrl = "http://127.0.0.1:$Port"
$listener = @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
if ($listener.Count -ne 1 -or $listener[0].LocalAddress -ne '127.0.0.1') { throw '无法确认唯一的本机桥接进程，未执行重启。' }
$bridgeProcess = Get-CimInstance Win32_Process -Filter ("ProcessId=" + $listener[0].OwningProcess)
$normalizedCommand = $bridgeProcess.CommandLine.Replace('\', '/')
$absoluteServer = $serverPath.Replace('\', '/')
$relativeServerPattern = '(?i)(?:^|\s|")dist/src/server\.js(?:"|\s|$)'
if ($bridgeProcess.Name -ne 'node.exe' -or (-not $normalizedCommand.Contains($absoluteServer) -and $normalizedCommand -notmatch $relativeServerPattern)) {
    throw '端口所属进程不是预期的 Node 桥接服务，未执行重启。'
}
$health = Invoke-RestMethod "$baseUrl/health" -TimeoutSec 5
$history = Invoke-RestMethod "$baseUrl/api/chat" -TimeoutSec 5
if (-not $health.ok -or $history.busy) { throw '桥接未就绪或会话正在运行，未执行重启。' }
$liveState = Invoke-RestMethod "$baseUrl/api/state" -TimeoutSec 5
$savedStatePath = Join-Path $DataDirectory 'state.json'
if (-not (Test-Path -LiteralPath $savedStatePath)) { throw '找不到原 state.json，请用 -DataDirectory 指定原数据目录。' }
$savedState = Get-Content -LiteralPath $savedStatePath -Raw | ConvertFrom-Json
if ((@($liveState.variables.variableId) -join ',') -ne (@($savedState.variables.variableId) -join ',')) {
    throw '指定的数据目录与运行中的变量不一致，未执行重启。'
}
Write-Host "已确认端口 $Port，进程 $($bridgeProcess.ProcessId)，会话空闲。"
Write-Host "保留数据目录：$DataDirectory"
if ($CheckOnly) { Write-Host '仅检查，未重启。'; return }
$logsDirectory = Join-Path $DataDirectory 'logs'
New-Item -ItemType Directory -Path $logsDirectory -Force | Out-Null
$runId = Get-Date -Format 'yyyyMMdd-HHmmss'
$outLog = Join-Path $logsDirectory "bridge-$runId.stdout.log"
$errLog = Join-Path $logsDirectory "bridge-$runId.stderr.log"
$oldPort = $env:WPS_MCP_PORT
$oldData = $env:WPS_MCP_DATA_DIR
try {
    Stop-Process -Id $bridgeProcess.ProcessId
    Wait-Process -Id $bridgeProcess.ProcessId -Timeout 5 -ErrorAction SilentlyContinue
    $env:WPS_MCP_PORT = [string]$Port
    $env:WPS_MCP_DATA_DIR = $DataDirectory
    $newBridge = Start-Process -FilePath $bridgeProcess.ExecutablePath -ArgumentList ('"' + $serverPath + '"') -WorkingDirectory $projectDirectory -WindowStyle Hidden -RedirectStandardOutput $outLog -RedirectStandardError $errLog -PassThru
} finally {
    $env:WPS_MCP_PORT = $oldPort
    $env:WPS_MCP_DATA_DIR = $oldData
}
$ready = $false
for ($attempt = 0; $attempt -lt 20; $attempt++) {
    try {
        if (-not (Invoke-RestMethod "$baseUrl/health" -TimeoutSec 2).ok) { throw '未就绪' }
        foreach ($asset in @('taskpane-view.js', 'pinyin-pro.js')) {
            if ((Invoke-WebRequest "$baseUrl/addon/$asset" -TimeoutSec 2).StatusCode -ne 200) { throw '页面资源未就绪' }
        }
        $ready = $true
        break
    } catch { Start-Sleep -Milliseconds 500 }
}
if (-not $ready) { throw "重启后服务未就绪，请查看日志：$errLog" }
Write-Host "桥接已更新并验证页面资源，进程 $($newBridge.Id)。请重新打开 WPS。"
