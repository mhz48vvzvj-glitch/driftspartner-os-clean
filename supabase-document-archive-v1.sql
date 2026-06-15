$ErrorActionPreference = "Stop"

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$Public = Join-Path $Root "public"
$Outputs = Join-Path $Root "outputs"
$Functions = Join-Path $Root "netlify\functions"
$Version = Get-Date -Format "yyyyMMddHHmmss"
$ZipPath = Join-Path $Outputs "driftspartner-netlify-production-$Version.zip"

if (!(Test-Path -LiteralPath $Public)) { throw "Mangler public-mappen." }
if (!(Test-Path -LiteralPath $Outputs)) { New-Item -ItemType Directory -Path $Outputs | Out-Null }
if (!(Test-Path -LiteralPath $Functions)) { throw "Mangler netlify/functions-mappen." }

$Utf8NoBom = [System.Text.UTF8Encoding]::new($false)

function Read-Utf8($Path) {
  [System.IO.File]::ReadAllText((Resolve-Path $Path).Path, [System.Text.Encoding]::UTF8)
}

function Write-Utf8($Path, $Text) {
  [System.IO.File]::WriteAllText((Resolve-Path $Path).Path, $Text, $Utf8NoBom)
}

function Set-VersionInHtml($Path) {
  $Text = Read-Utf8 $Path
  $Text = [regex]::Replace($Text, "v=\d{14}", "v=$Version")
  Write-Utf8 $Path $Text
}

function Set-VersionInHeaders($Path) {
  $Text = Read-Utf8 $Path
  $Text = [regex]::Replace($Text, "X-Driftspartner-Version: .*", "X-Driftspartner-Version: $Version-production")
  Write-Utf8 $Path $Text
}

function Add-ZipFile($Archive, $Source, $Entry) {
  if (!(Test-Path -LiteralPath $Source)) { throw "Mangler fil: $Source" }
  if ($Entry -match "\\") { throw "Ugyldig zip-entry med backslash: $Entry" }
  $Item = $Archive.CreateEntry($Entry, [System.IO.Compression.CompressionLevel]::Optimal)
  $In = [System.IO.File]::OpenRead((Resolve-Path $Source).Path)
  $Out = $Item.Open()
  try { $In.CopyTo($Out) }
  finally { $Out.Dispose(); $In.Dispose() }
}

function Add-ZipText($Archive, $Entry, $Text) {
  if ($Entry -match "\\") { throw "Ugyldig zip-entry med backslash: $Entry" }
  $Item = $Archive.CreateEntry($Entry, [System.IO.Compression.CompressionLevel]::Optimal)
  $Writer = [System.IO.StreamWriter]::new($Item.Open(), $Utf8NoBom)
  try { $Writer.Write($Text) }
  finally { $Writer.Dispose() }
}

$RequiredFiles = @(
  "driftspartner-property-os.html",
  "index.html",
  "kommersielt.html",
  "assets\driftspartner-property-os.css",
  "assets\logo-os.jpg",
  "_redirects",
  "_headers"
)

foreach ($Relative in $RequiredFiles) {
  $Source = Join-Path $Public $Relative
  if (!(Test-Path -LiteralPath $Source)) { throw "Mangler påkrevd public-fil: $Relative" }
  $Target = Join-Path $Outputs $Relative
  $TargetDir = Split-Path -Parent $Target
  if (!(Test-Path -LiteralPath $TargetDir)) { New-Item -ItemType Directory -Path $TargetDir | Out-Null }
  Copy-Item -LiteralPath $Source -Destination $Target -Force
}

$ProdOut = Join-Path $Outputs "assets\prod"
if (!(Test-Path -LiteralPath $ProdOut)) { New-Item -ItemType Directory -Path $ProdOut | Out-Null }
Get-ChildItem -LiteralPath (Join-Path $Public "assets\prod") -File | ForEach-Object {
  Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $ProdOut $_.Name) -Force
}

$FunctionOut = Join-Path $Outputs "netlify\functions"
if (!(Test-Path -LiteralPath $FunctionOut)) { New-Item -ItemType Directory -Path $FunctionOut | Out-Null }
Get-ChildItem -LiteralPath $Functions -File | ForEach-Object {
  Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $FunctionOut $_.Name) -Force
}

Set-VersionInHtml (Join-Path $Public "driftspartner-property-os.html")
Set-VersionInHtml (Join-Path $Public "index.html")
Set-VersionInHtml (Join-Path $Outputs "driftspartner-property-os.html")
Set-VersionInHtml (Join-Path $Outputs "index.html")
Set-VersionInHeaders (Join-Path $Public "_headers")
Set-VersionInHeaders (Join-Path $Outputs "_headers")

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$Archive = [System.IO.Compression.ZipFile]::Open($ZipPath, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  Add-ZipFile $Archive (Join-Path $Outputs "driftspartner-property-os.html") "driftspartner-property-os.html"
  Add-ZipFile $Archive (Join-Path $Outputs "index.html") "index.html"
  Add-ZipFile $Archive (Join-Path $Outputs "kommersielt.html") "kommersielt.html"
  Add-ZipFile $Archive (Join-Path $Outputs "assets\driftspartner-property-os.css") "assets/driftspartner-property-os.css"
  Add-ZipFile $Archive (Join-Path $Outputs "assets\logo-os.jpg") "assets/logo-os.jpg"
  Get-ChildItem -LiteralPath (Join-Path $Outputs "assets\prod") -File | Sort-Object Name | ForEach-Object {
    Add-ZipFile $Archive $_.FullName ("assets/prod/" + $_.Name)
  }
  Get-ChildItem -LiteralPath $FunctionOut -File | Sort-Object Name | ForEach-Object {
    Add-ZipFile $Archive $_.FullName ("netlify/functions/" + $_.Name)
  }
  Add-ZipFile $Archive (Join-Path $Outputs "_redirects") "_redirects"
  Add-ZipFile $Archive (Join-Path $Outputs "_headers") "_headers"
  Add-ZipFile $Archive (Join-Path $Root "netlify.toml") "netlify.toml"
  Add-ZipText $Archive "DEPLOY-ID-$Version.txt" "Driftspartner OS production package $Version. Built by scripts/build-netlify-drop.ps1."
  Add-ZipText $Archive "live-check.html" "<!doctype html><meta charset='utf-8'><title>Driftspartner OS live check</title><h1>Driftspartner OS live $Version</h1><p>Riktig produksjonspakke er publisert.</p>"
}
finally {
  $Archive.Dispose()
}

$Check = [System.IO.Compression.ZipFile]::OpenRead($ZipPath)
try {
  $BadEntries = $Check.Entries | Where-Object { $_.FullName -match "\\" }
  if ($BadEntries) { throw "Zip inneholder backslash paths. Ikke last opp denne pakken." }
  $RequiredEntries = @(
    "driftspartner-property-os.html",
    "index.html",
    "kommersielt.html",
    "assets/driftspartner-property-os.css",
    "assets/logo-os.jpg",
    "assets/prod/00-core.js",
    "assets/prod/01-auth-data.js",
    "assets/prod/02-dashboard-property.js",
    "assets/prod/03-people-cases-docs.js",
    "assets/prod/04-finance-market-admin.js",
    "netlify/functions/ai-director.js",
    "netlify/functions/ai-ping.js",
    "netlify/functions/auth-profile.js",
    "netlify/functions/create-user.js",
    "netlify/functions/send-email.js",
    "netlify.toml",
    "live-check.html",
    "_redirects",
    "_headers",
    "DEPLOY-ID-$Version.txt"
  )
  $Names = $Check.Entries | ForEach-Object { $_.FullName }
  foreach ($Entry in $RequiredEntries) {
    if ($Names -notcontains $Entry) { throw "Zip mangler entry: $Entry" }
  }
}
finally {
  $Check.Dispose()
}

Write-Output "OK"
Write-Output "Versjon: $Version"
Write-Output "Zip: $ZipPath"
Write-Output "Sjekk live etter opplasting: https://fdv.driftspartnernord.no/driftspartner-property-os.html?v=$Version"
Write-Output "Deploy-id skal finnes pa: https://fdv.driftspartnernord.no/DEPLOY-ID-$Version.txt"
