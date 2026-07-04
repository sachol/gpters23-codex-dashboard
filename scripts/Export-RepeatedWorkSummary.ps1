[CmdletBinding()]
param(
    [string]$InputPath = "data/repeated-work-items.csv",
    [string]$OutputPath = "output/week1-submission/repeated-work-summary.md",
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$csvPath = Join-Path $root $InputPath
$outPath = Join-Path $root $OutputPath

if (-not (Test-Path -LiteralPath $csvPath)) {
    throw "CSV file not found: $csvPath"
}

$rows = @(Import-Csv -LiteralPath $csvPath)
$filled = @($rows | Where-Object { $_.work_item -and $_.work_item.Trim().Length -gt 0 })

$numericMinutes = @()
foreach ($row in $filled) {
    $raw = [string]$row.minutes_per_run
    $value = 0.0
    if ([double]::TryParse($raw, [ref]$value)) {
        $numericMinutes += $value
    }
}

$totalMinutes = 0
foreach ($value in $numericMinutes) {
    $totalMinutes += $value
}

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# Week 1 Repeated Work Summary")
$lines.Add("")
$lines.Add("Generated from: ``$InputPath``")
$lines.Add("")
$lines.Add(("Filled work items: {0}/5" -f $filled.Count))
$lines.Add(("Filled numeric time estimates: {0}/5" -f $numericMinutes.Count))
if ($numericMinutes.Count -gt 0) {
    $lines.Add(("Total estimated minutes per cycle: {0}" -f $totalMinutes))
}
$lines.Add("")

if ($filled.Count -eq 0) {
    $lines.Add("## Status")
    $lines.Add("")
    $lines.Add("PENDING: Add 5 repeated work items before final Week 1 submission.")
    $lines.Add("")
    $lines.Add("Use ``output/week1-submission/quick-reply-template.md`` or edit ``data/repeated-work-items.csv``.")
} else {
    $lines.Add("## Work Items")
    $lines.Add("")
    $lines.Add("| ID | Work item | Minutes | Input materials | Output artifact | Public case |")
    $lines.Add("|---:|---|---:|---|---|---|")
    foreach ($row in $filled) {
        $lines.Add(("| {0} | {1} | {2} | {3} | {4} | {5} |" -f $row.id, $row.work_item, $row.minutes_per_run, $row.input_materials, $row.output_artifact, $row.public_case_ok))
    }
    $lines.Add("")
    $lines.Add("## Automation Notes")
    $lines.Add("")
    foreach ($row in $filled) {
        $lines.Add(("- **{0}**: {1}" -f $row.work_item, $row.why_automate))
    }
}

$content = $lines -join "`n"

if ($DryRun) {
    Write-Output "DRY RUN: $outPath"
    Write-Output $content
    exit 0
}

$outDir = Split-Path -Parent $outPath
if (-not (Test-Path -LiteralPath $outDir)) {
    New-Item -ItemType Directory -Path $outDir | Out-Null
}

Set-Content -LiteralPath $outPath -Value $content -Encoding UTF8
Write-Output "Exported repeated work summary: $outPath"
