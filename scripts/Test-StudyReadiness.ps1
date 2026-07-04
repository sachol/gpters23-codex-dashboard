[CmdletBinding()]
param(
    [switch]$Strict
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")

$requiredFiles = @(
    "README.md",
    "AGENTS.md",
    "docs/course-brief.md",
    "docs/4week-execution-plan.md",
    "docs/week1-readiness-checklist.md",
    "docs/week1-assignment-draft.md",
    "docs/repeated-work-data-guide.md",
    "docs/automation-priority-matrix.md",
    "docs/before-after-measurement-protocol.md",
    "docs/evidence-ledger.md",
    "agents/property-briefing-agent.md",
    "samples/property-briefing-sample-input.md",
    "data/repeated-work-items.csv",
    "output/week1-submission/week1-assignment.md",
    "output/week1-submission/quick-reply-template.md",
    "output/week1-submission/repeated-work-summary.md",
    "output/study-dashboard/index.html",
    "output/final-presentation/index.html",
    "output/gpters-case-study/post.md",
    "scripts/New-DailyLog.ps1",
    "scripts/New-MeasurementSheet.ps1",
    "scripts/Test-RepeatedWorkInput.ps1",
    "scripts/Export-RepeatedWorkSummary.ps1"
)

$manualInputs = @(
    "Recent repeated work items: 5 entries",
    "Estimated or measured time for each repeated work item",
    "One before-measurement run for the selected task",
    "One after-measurement run using Codex",
    "Final Week 1 topic confirmation by ShinHwa"
)

$missing = @()
foreach ($rel in $requiredFiles) {
    $path = Join-Path $root $rel
    if (-not (Test-Path -LiteralPath $path)) {
        $missing += $rel
    }
}

Write-Output "GPTERS 23 Codex study readiness check"
Write-Output "Root: $root"
Write-Output ""

if ($missing.Count -eq 0) {
    Write-Output "PASS: All required project files exist."
} else {
    Write-Output "FAIL: Missing required files:"
    foreach ($item in $missing) {
        Write-Output " - $item"
    }
}

Write-Output ""
Write-Output "Manual inputs still needed:"
foreach ($item in $manualInputs) {
    Write-Output " - $item"
}

Write-Output ""
if ($Strict -and $missing.Count -gt 0) {
    throw "Readiness check failed: missing required files."
}

if ($missing.Count -eq 0) {
    exit 0
}

exit 1
