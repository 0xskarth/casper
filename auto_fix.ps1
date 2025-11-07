# SCRIPT AUTOMATICO WINDOWS - Applica FIX al tuo index.js
# 
# USO: Fai doppio click su questo file
#      oppure: powershell -ExecutionPolicy Bypass -File auto_fix.ps1

Write-Host "🔧 CASPER SCANNER - AUTO FIX SCRIPT" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$indexPath = ".\index.js"
$backupPath = ".\index.js.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
$outputPath = ".\index.js.fixed"

# Check file exists
if (-not (Test-Path $indexPath)) {
    Write-Host "❌ ERROR: index.js not found!" -ForegroundColor Red
    Write-Host "   Please run this script from your scanner folder" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "📁 Found: $indexPath" -ForegroundColor Green
Write-Host "💾 Creating backup: $backupPath" -ForegroundColor Yellow

# Backup
Copy-Item $indexPath $backupPath
Write-Host "✅ Backup created`n" -ForegroundColor Green

# Read file
$code = Get-Content $indexPath -Raw
$changes = 0

Write-Host "🔧 Applying fixes...`n" -ForegroundColor Cyan

# FIX 1: Add ChannelType
if ($code -notmatch 'ChannelType') {
    Write-Host "✅ FIX 1: Adding ChannelType import" -ForegroundColor Green
    $code = $code -replace 'TextInputStyle\s*}', 'TextInputStyle, ChannelType }'
    $changes++
}

# FIX 2: Add DirectMessages
if ($code -notmatch 'DirectMessages') {
    Write-Host "✅ FIX 2: Adding DirectMessages intent" -ForegroundColor Green
    $code = $code -replace 'GatewayIntentBits\.GuildMembers', 'GatewayIntentBits.GuildMembers,`n        GatewayIntentBits.DirectMessages'
    $changes++
}

# FIX 2: Add partials
if ($code -notmatch 'partials:') {
    Write-Host "✅ FIX 2: Adding partials for DM support" -ForegroundColor Green
    $code = $code -replace '(const client = new Client\(\{)\s*intents:', '$1`n    partials: [''CHANNEL''],`n    intents:'
    $changes++
}

Write-Host "`n📊 Applied $changes automatic fixes" -ForegroundColor Cyan

# Write output
$code | Out-File -FilePath $outputPath -Encoding UTF8

Write-Host "`n✅ Fixed file saved as: $outputPath" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  MANUAL STEPS STILL REQUIRED:" -ForegroundColor Yellow
Write-Host "   See MODIFICHE_DA_APPLICARE.md for remaining 6 fixes" -ForegroundColor Yellow
Write-Host ""
Write-Host "🎯 NEXT STEPS:" -ForegroundColor Cyan
Write-Host "   1. Review: $outputPath"
Write-Host "   2. Complete manual fixes from MODIFICHE_DA_APPLICARE.md"
Write-Host "   3. Test: node -c $outputPath"
Write-Host "   4. Replace: copy $outputPath $indexPath"
Write-Host "   5. Restart bot"
Write-Host ""

Read-Host "Press Enter to exit"
