param(
  [string]$SiteRoot = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = 'Stop'
$htmlFiles = Get-ChildItem -LiteralPath $SiteRoot -Filter '*.html' -File
$results = [System.Collections.Generic.List[object]]::new()

function Test-SiteReference {
  param(
    [string]$SourceDirectory,
    [string]$Reference
  )

  if ($Reference -match '^(https?:|mailto:|tel:|data:)') {
    return @{ Exists = 'N/A'; Target = 'external' }
  }

  $pathOnly = ($Reference -split '[?#]', 2)[0]
  if ([string]::IsNullOrWhiteSpace($pathOnly)) {
    return @{ Exists = $false; Target = 'empty or hash-only reference' }
  }

  if ($pathOnly -eq '/') {
    $resolved = Join-Path $SiteRoot 'index.html'
  } elseif ($pathOnly.StartsWith('/')) {
    $resolved = Join-Path $SiteRoot $pathOnly.TrimStart('/')
  } else {
    $resolved = Join-Path $SourceDirectory $pathOnly
  }

  return @{ Exists = Test-Path -LiteralPath $resolved; Target = $resolved }
}

foreach ($htmlFile in $htmlFiles) {
  $html = [System.IO.File]::ReadAllText($htmlFile.FullName)

  foreach ($match in [regex]::Matches($html, '<a\b[^>]*href="([^"]*)"[^>]*>(.*?)</a>', 'Singleline,IgnoreCase')) {
    $href = $match.Groups[1].Value
    $plainText = [regex]::Replace($match.Groups[2].Value, '<[^>]+>', ' ')
    $plainText = [System.Net.WebUtility]::HtmlDecode($plainText).Trim()
    $check = Test-SiteReference -SourceDirectory $htmlFile.DirectoryName -Reference $href
    $results.Add([pscustomobject]@{
      Source = $htmlFile.Name
      Type = 'link'
      Text = $plainText
      Reference = $href
      TargetExists = $check.Exists
      ResolvedTarget = $check.Target
    })
  }

  foreach ($match in [regex]::Matches($html, '<(?:img|script|link)\b[^>]*(?:src|href)="([^"]+)"[^>]*>', 'Singleline,IgnoreCase')) {
    $reference = $match.Groups[1].Value
    $check = Test-SiteReference -SourceDirectory $htmlFile.DirectoryName -Reference $reference
    $results.Add([pscustomobject]@{
      Source = $htmlFile.Name
      Type = 'asset'
      Text = '[asset]'
      Reference = $reference
      TargetExists = $check.Exists
      ResolvedTarget = $check.Target
    })
  }
}

$results | Sort-Object Source, Type, Text | Format-Table Source, Type, Text, Reference, TargetExists -AutoSize

$broken = @($results | Where-Object { $_.TargetExists -eq $false })
Write-Host ""
Write-Host ("Audit summary: {0} references checked; {1} broken internal references." -f $results.Count, $broken.Count)

if ($broken.Count -gt 0) {
  exit 1
}
