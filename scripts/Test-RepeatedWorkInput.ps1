[CmdletBinding()]
param(
    [string]$Path = "data/repeated-work-items.csv"
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$csvPath = Join-Path $root $Path

if (-not (Test-Path -LiteralPath $csvPath)) {
    throw "Repeated work CSV not found: $csvPath"
}

$rows = Import-Csv -LiteralPath $csvPath
$filledWorkItems = @($rows | Where-Object { $_.work_item -and $_.work_item.Trim().Length -gt 0 })
$filledTimes = @($rows | Where-Object { $_.minutes_per_run -and $_.minutes_per_run.Trim().Length -gt 0 })
$filledPublicCase = @($rows | Where-Object { $_.public_case_ok -and $_.public_case_ok.Trim().Length -gt 0 })

Write-Output "Repeated work input check"
Write-Output "File: $csvPath"
Write-Output ""
Write-Output ("Rows: {0}" -f @($rows).Count)
Write-Output ("Work items filled: {0}/5" -f $filledWorkItems.Count)
Write-Output ("Time estimates filled: {0}/5" -f $filledTimes.Count)
Write-Output ("Public-case flags filled: {0}/5" -f $filledPublicCase.Count)
Write-Output ""

if ($filledWorkItems.Count -ge 5 -and $filledTimes.Count -ge 5) {
    Write-Output "READY: Week 1 repeated-work input is complete enough for prioritization."
    exit 0
}

Write-Output "PENDING: Add 5 work items and time estimates before final Week 1 submission."
exit 0
