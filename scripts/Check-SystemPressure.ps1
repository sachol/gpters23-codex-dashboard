[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

$patterns = "powershell|pwsh|node|node_repl|vercel|git|gh"
$processes = Get-Process | Where-Object { $_.ProcessName -match $patterns }

Write-Output "System pressure check"
Write-Output "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Output ""

Write-Output "Process counts:"
$processes |
    Group-Object ProcessName |
    Sort-Object Count -Descending |
    Select-Object Count, Name |
    Format-Table -AutoSize

Write-Output ""
Write-Output "Top memory users:"
$processes |
    Sort-Object WorkingSet -Descending |
    Select-Object -First 12 Id, ProcessName, @{Name = "WorkingSetMB"; Expression = { [math]::Round($_.WorkingSet / 1MB, 1) } }, StartTime |
    Format-Table -AutoSize

Write-Output ""

$pwshCount = ($processes | Where-Object { $_.ProcessName -match "powershell|pwsh" }).Count
$nodeCount = ($processes | Where-Object { $_.ProcessName -match "node|node_repl" }).Count

if ($pwshCount -ge 10 -or $nodeCount -ge 50) {
    Write-Output "WARN: High process count detected."
    Write-Output "Recommendation: finish current work, save changes, then consider restarting Codex or Windows if R6016 popups repeat."
    exit 1
}

Write-Output "OK: No immediate process-count warning."
exit 0
