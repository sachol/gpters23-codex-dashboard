[CmdletBinding()]
param(
    [datetime]$Date = (Get-Date),
    [string]$Focus = "GPTERS 23 Codex App study",
    [switch]$Force,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$dateText = $Date.ToString("yyyy-MM-dd")
$outDir = Join-Path $root "logs"
$outFile = Join-Path $outDir "$dateText-daily-log.md"

$content = @"
# $dateText Daily Study Log

## Basic Info

- Date: $dateText
- Codex features used:
- Time spent:
- Output artifacts:

## Today's Goal

- $Focus

## Work Done

1.
2.
3.

## Before vs Codex

| Item | Before | Codex-assisted |
|---|---|---|
| Input materials |  |  |
| Process steps |  |  |
| Time spent |  |  |
| Output |  |  |

## Lessons Learned

-

## Blockers

-

## Tomorrow

-

## Case Study Material

> Biggest lesson today:

-
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
    throw "Daily log already exists: $outFile. Use -Force to overwrite."
}

Set-Content -LiteralPath $outFile -Value $content -Encoding UTF8
Write-Output "Created daily log: $outFile"
