param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('Initialize', 'InitializeEnergy', 'RunSoul', 'RunBody', 'RunEnergySoul', 'RunEnergyBody', 'Status', 'EnergyStatus', 'AuditRepo')]
  [string]$Action
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Security

$storeRoot = Join-Path $env:LOCALAPPDATA 'KAIOS\StarforgeSpiritLife'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$broker = Join-Path $repoRoot 'core\security\starforge-signer-broker.mjs'
$runtime = Join-Path $repoRoot 'scripts\starforge-genesis\starforge-local-genesis.mjs'
$node = (Get-Command node -ErrorAction Stop).Source
$entropy = [Text.Encoding]::UTF8.GetBytes('KAIOS_STARFORGE_SPIRIT_LIFE_GENESIS_V1')
$refs = [ordered]@{
  soul = 'DPAPI_USER:KAIOS_STARFORGE_SOUL_V1'
  body = 'DPAPI_USER:KAIOS_STARFORGE_BODY_V1'
  energy = 'DPAPI_USER:KAIOS_STARFORGE_ENERGY_V1'
}
$files = [ordered]@{
  soul = Join-Path $storeRoot 'soul-key.dpapi'
  body = Join-Path $storeRoot 'body-key.dpapi'
  energy = Join-Path $storeRoot 'energy-key.dpapi'
}

function Clear-Bytes([byte[]]$bytes) {
  if ($null -ne $bytes) { [Array]::Clear($bytes, 0, $bytes.Length) }
}

function New-ProtectedSigner([string]$path) {
  [byte[]]$plain = New-Object byte[] 32
  $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
  try { $rng.GetBytes($plain) }
  finally { $rng.Dispose() }
  $nonZero = $false
  foreach ($value in $plain) { if ($value -ne 0) { $nonZero = $true; break } }
  if (-not $nonZero) { Clear-Bytes $plain; throw 'CSPRNG_ZERO_SCALAR_REJECTED' }
  [byte[]]$cipher = [Security.Cryptography.ProtectedData]::Protect($plain, $entropy, [Security.Cryptography.DataProtectionScope]::CurrentUser)
  [IO.File]::WriteAllBytes($path, $cipher)
  Clear-Bytes $plain
  Clear-Bytes $cipher
}

function Read-ProtectedSigner([string]$path) {
  if (-not (Test-Path -LiteralPath $path)) { throw 'DPAPI_SIGNER_NOT_FOUND' }
  [byte[]]$cipher = [IO.File]::ReadAllBytes($path)
  [byte[]]$plain = [Security.Cryptography.ProtectedData]::Unprotect($cipher, $entropy, [Security.Cryptography.DataProtectionScope]::CurrentUser)
  Clear-Bytes $cipher
  return $plain
}

function Invoke-SignerBroker([byte[]]$secretBytes, [string[]]$brokerArgs) {
  $hex = '0x' + (($secretBytes | ForEach-Object { $_.ToString('x2') }) -join '')
  $psi = [Diagnostics.ProcessStartInfo]::new()
  $psi.FileName = $node
  $psi.UseShellExecute = $false
  $psi.RedirectStandardInput = $true
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.CreateNoWindow = $true
  if ($null -ne $psi.ArgumentList) {
    $psi.ArgumentList.Add($broker)
    foreach ($argument in $brokerArgs) { $psi.ArgumentList.Add($argument) }
  } else {
    $publicArguments = @($broker) + $brokerArgs
    $psi.Arguments = (($publicArguments | ForEach-Object { '"' + $_.Replace('"', '\"') + '"' }) -join ' ')
  }
  $process = [Diagnostics.Process]::new()
  $process.StartInfo = $psi
  if (-not $process.Start()) { $hex = $null; throw 'SIGNER_BROKER_START_FAILED' }
  $process.StandardInput.WriteLine($hex)
  $process.StandardInput.Close()
  $hex = $null
  $stdout = $process.StandardOutput.ReadToEnd()
  $stderr = $process.StandardError.ReadToEnd()
  $process.WaitForExit()
  if ($process.ExitCode -ne 0) { throw ('SIGNER_BROKER_STOP:' + $stderr.Trim()) }
  return $stdout.Trim()
}

function Resolve-PublicAddress([string]$organ) {
  [byte[]]$secret = Read-ProtectedSigner $files[$organ]
  try { return (Invoke-SignerBroker $secret @('address') | ConvertFrom-Json).address }
  finally { Clear-Bytes $secret }
}

function Sign-PublicRequest([string]$organ, [string]$action, [string]$requestFile, [string]$outputFile) {
  [byte[]]$secret = Read-ProtectedSigner $files[$organ]
  try {
    $publicResult = Invoke-SignerBroker $secret @($action, $requestFile)
    Set-Content -LiteralPath $outputFile -Value $publicResult -Encoding utf8
  } finally { Clear-Bytes $secret }
}

if ($Action -eq 'Initialize') {
  New-Item -ItemType Directory -Path $storeRoot -Force | Out-Null
  $created = $false
  foreach ($organ in @('soul', 'body')) {
    if (-not (Test-Path -LiteralPath $files[$organ])) { New-ProtectedSigner $files[$organ]; $created = $true }
  }
  [Environment]::SetEnvironmentVariable('STARFORGE_SOUL_KEY_REF', $refs.soul, 'User')
  [Environment]::SetEnvironmentVariable('STARFORGE_BODY_KEY_REF', $refs.body, 'User')
  $addresses = [ordered]@{ soul_address = Resolve-PublicAddress 'soul'; body_address = Resolve-PublicAddress 'body'; private_key_exposed = $false }
  $addresses | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $storeRoot 'public-addresses.json') -Encoding utf8
  [pscustomobject]@{
    signer_store_status = 'READY'
    initialization = $(if ($created) { 'CREATED' } else { 'EXISTING_REUSED' })
    custody = 'MOTHER_MACHINE_USER_SCOPED_ENCRYPTED_STORE'
    soul_key_ref = $refs.soul
    body_key_ref = $refs.body
    soul_address = $addresses.soul_address
    body_address = $addresses.body_address
    private_key_exposed = $false
  } | ConvertTo-Json
  exit 0
}


if ($Action -eq 'InitializeEnergy') {
  New-Item -ItemType Directory -Path $storeRoot -Force | Out-Null
  $created = $false
  if (-not (Test-Path -LiteralPath $files.energy)) { New-ProtectedSigner $files.energy; $created = $true }
  [Environment]::SetEnvironmentVariable('STARFORGE_ENERGY_KEY_REF', $refs.energy, 'User')
  $addressesFile = Join-Path $storeRoot 'public-addresses.json'
  if (-not (Test-Path -LiteralPath $addressesFile)) { throw 'EXISTING_STARFORGE_ADDRESSES_REQUIRED' }
  $addresses = Get-Content -Raw $addressesFile | ConvertFrom-Json
  $record = [ordered]@{ soul_address=$addresses.soul_address; body_address=$addresses.body_address; energy_wallet_address=Resolve-PublicAddress 'energy'; private_key_exposed=$false }
  $record | ConvertTo-Json | Set-Content -LiteralPath $addressesFile -Encoding utf8
  [pscustomobject]@{ signer_store_status='READY'; initialization=$(if($created){'CREATED'}else{'EXISTING_REUSED'}); custody='MOTHER_MACHINE_USER_SCOPED_ENCRYPTED_STORE'; energy_key_ref=$refs.energy; energy_wallet_address=$record.energy_wallet_address; private_key_exposed=$false } | ConvertTo-Json
  exit 0
}

$expectedSoulRef = [Environment]::GetEnvironmentVariable('STARFORGE_SOUL_KEY_REF', 'User')
$expectedBodyRef = [Environment]::GetEnvironmentVariable('STARFORGE_BODY_KEY_REF', 'User')
$expectedEnergyRef = [Environment]::GetEnvironmentVariable('STARFORGE_ENERGY_KEY_REF', 'User')
if ($expectedSoulRef -ne $refs.soul -or $expectedBodyRef -ne $refs.body) { throw 'SECURE_STORE_REFERENCE_MISMATCH' }

if ($Action -eq 'RunSoul') {
  & $node $runtime 'prepare-soul' $storeRoot | Out-Null
  Sign-PublicRequest 'soul' 'sign-soul' (Join-Path $storeRoot 'soul-sign-request.json') (Join-Path $storeRoot 'soul-signature.json')
  & $node $runtime 'finalize-soul' $storeRoot
  exit $LASTEXITCODE
}

if ($Action -eq 'RunBody') {
  & $node $runtime 'prepare-body' $storeRoot | Out-Null
  Sign-PublicRequest 'body' 'sign-body' (Join-Path $storeRoot 'body-sign-request.json') (Join-Path $storeRoot 'body-signature.json')
  & $node $runtime 'finalize-body' $storeRoot
  exit $LASTEXITCODE
}


if ($Action -eq 'RunEnergySoul') {
  if ($expectedEnergyRef -ne $refs.energy) { throw 'ENERGY_SECURE_STORE_REFERENCE_MISMATCH' }
  & $node $runtime 'prepare-energy-soul' $storeRoot | Out-Null
  Sign-PublicRequest 'soul' 'sign-energy-soul' (Join-Path $storeRoot 'energy-soul-sign-request.json') (Join-Path $storeRoot 'energy-soul-signature.json')
  & $node $runtime 'finalize-energy-soul' $storeRoot
  exit $LASTEXITCODE
}
if ($Action -eq 'RunEnergyBody') {
  if ($expectedEnergyRef -ne $refs.energy) { throw 'ENERGY_SECURE_STORE_REFERENCE_MISMATCH' }
  & $node $runtime 'prepare-energy-body' $storeRoot | Out-Null
  Sign-PublicRequest 'body' 'sign-energy-body' (Join-Path $storeRoot 'energy-body-sign-request.json') (Join-Path $storeRoot 'energy-body-signature.json')
  & $node $runtime 'finalize-energy-body' $storeRoot
  exit $LASTEXITCODE
}
if ($Action -eq 'EnergyStatus') {
  $stateFile=Join-Path $storeRoot 'runtime-state.json'; $addressesFile=Join-Path $storeRoot 'public-addresses.json'
  [pscustomobject]@{ signer_store_status=$(if(Test-Path $files.energy){'READY'}else{'MISSING'}); energy_key_ref_status=$(if($expectedEnergyRef -eq $refs.energy){'MATCH'}else{'MISMATCH'}); energy_wallet_address=$(if(Test-Path $addressesFile){(Get-Content -Raw $addressesFile|ConvertFrom-Json).energy_wallet_address}else{$null}); runtime_state=$(if(Test-Path $stateFile){(Get-Content -Raw $stateFile|ConvertFrom-Json).phase}else{'GENESIS_NOT_STARTED'}); private_key_exposed=$false } | ConvertTo-Json
  exit 0
}

if ($Action -eq 'Status') {
  $stateFile = Join-Path $storeRoot 'runtime-state.json'
  [pscustomobject]@{
    signer_store_status = $(if ((Test-Path $files.soul) -and (Test-Path $files.body)) { 'READY' } else { 'MISSING' })
    soul_key_ref_status = $(if ($expectedSoulRef -eq $refs.soul) { 'MATCH' } else { 'MISMATCH' })
    body_key_ref_status = $(if ($expectedBodyRef -eq $refs.body) { 'MATCH' } else { 'MISMATCH' })
    runtime_state = $(if (Test-Path $stateFile) { (Get-Content -Raw $stateFile | ConvertFrom-Json).phase } else { 'GENESIS_NOT_STARTED' })
    private_key_exposed = $false
  } | ConvertTo-Json
}

if ($Action -eq 'AuditRepo') {
  $paths = @(& git -C $repoRoot ls-files) + @(& git -C $repoRoot ls-files --others --exclude-standard)
  $paths = $paths | Sort-Object -Unique
  $literalMatches = 0
  foreach ($organ in @('soul', 'body', 'energy')) {
    if (-not (Test-Path -LiteralPath $files[$organ])) { continue }
    [byte[]]$secret = Read-ProtectedSigner $files[$organ]
    try {
      $hex = (($secret | ForEach-Object { $_.ToString('x2') }) -join '')
      foreach ($relative in $paths) {
        $candidate = Join-Path $repoRoot $relative
        if (-not (Test-Path -LiteralPath $candidate -PathType Leaf)) { continue }
        try {
          $text = [IO.File]::ReadAllText($candidate)
          if ($text.IndexOf($hex, [StringComparison]::OrdinalIgnoreCase) -ge 0) { $literalMatches++ }
        } catch { }
      }
      $hex = $null
    } finally { Clear-Bytes $secret }
  }
  [pscustomobject]@{
    secret_scan = $(if ($literalMatches -eq 0) { 'PASS' } else { 'FAIL' })
    private_key_literal_count = $literalMatches
    private_key_exposed = $false
  } | ConvertTo-Json
  if ($literalMatches -ne 0) { exit 2 }
}
