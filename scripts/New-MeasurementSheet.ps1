[CmdletBinding()]
param(
    [datetime]$Date = (Get-Date),
    [string]$TaskName = "Property briefing draft",
    [ValidateSet("before", "after", "both")]
    [string]$Mode = "both",
    [switch]$Force,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$dateText = $Date.ToString("yyyy-MM-dd")
$safeTaskName = $TaskName -replace '[\\/:*?"<>|]', '-'
$outDir = Join-Path $root "measurements"
$outFile = Join-Path $outDir "$dateText-$safeTaskName.md"

function New-BeforeSection {
@"
## Before Measurement

| Step | Start | End | Minutes | Notes |
|---|---|---|---:|---|
| Address and deal terms check |  |  |  |  |
| Building register check |  |  |  |  |
| Registry document check |  |  |  |  |
| Land-use plan check |  |  |  |  |
| Comparable price check |  |  |  |  |
| Field memo review |  |  |  |  |
| Client briefing draft |  |  |  |  |
| Internal review checklist |  |  |  |  |
| Total |  |  |  |  |
"@
}

function New-AfterSection {
@"
## After Measurement

| Step | Start | End | Minutes | Notes |
|---|---|---|---:|---|
| Prepare input materials |  |  |  |  |
| Write Codex prompt |  |  |  |  |
| Generate Codex draft |  |  |  |  |
| Verify numbers and legal-risk items |  |  |  |  |
| Revise client-facing copy |  |  |  |  |
| Refine internal checklist |  |  |  |  |
| Write GPTERS log |  |  |  |  |
| Total |  |  |  |  |
"@
}

$sections = @()
if ($Mode -eq "before" -or $Mode -eq "both") {
    $sections += New-BeforeSection
}
if ($Mode -eq "after" -or $Mode -eq "both") {
    $sections += New-AfterSection
}

$sectionText = $sections -join "`n`n"

$content = @"
# $dateText Work Time Measurement

## Basic Info

- Task: $TaskName
- Mode: $Mode
- Owner: ShinHwa
- De-identification checked before public case study:

## Measurement Rules

- Compare the same type of work.
- Record time by step.
- Separate final human review from draft generation.
- Remove address, owner, phone number, and other identifiers before public posting.

$sectionText

## Comparison Summary

| Item | Before | Codex-assisted | Change |
|---|---:|---:|---|
| Material review |  |  |  |
| Draft writing |  |  |  |
| Verification |  |  |  |
| Case-study logging |  |  |  |
| Total time |  |  |  |

## Case Study Sentence Draft

The previous workflow took [minutes] minutes for one $TaskName task.
With Codex, input preparation took [minutes], draft generation took [minutes], and human review took [minutes].
The biggest reduction came from [step], while [verification item] still required human review.
"@

if ($DryRun) {
    Write-Output "DRY RUN: $outFile"
    Write-Output $content
    exit 0
}

if (-not (Test-Path -LiteralPath $outDir)) {
    New-Item -ItemType Directory -Path $outDir | Out-Null
}

if ((Test-Path -LiteralPath $outFile) -and -not $Force) {
    throw "Measurement sheet already exists: $outFile. Use -Force to overwrite."
}

Set-Content -LiteralPath $outFile -Value $content -Encoding UTF8
Write-Output "Created measurement sheet: $outFile"
