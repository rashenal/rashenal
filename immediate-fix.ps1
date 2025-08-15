# PowerShell version - should work better with file redirection
# Immediate fix for enhanced_taskboard_analytics missing updated_at

Write-Host "🚨 IMMEDIATE FIX - enhanced_taskboard_analytics missing updated_at" -ForegroundColor Yellow
Write-Host "Using PowerShell for better file handling..." -ForegroundColor Cyan
Write-Host ""

# Navigate to script directory
Set-Location $PSScriptRoot

# Check if supabase CLI is available
if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Supabase CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

Write-Host "🔧 Applying direct SQL fix for enhanced_taskboard_analytics..." -ForegroundColor Green

# Read the SQL file content
$sqlContent = Get-Content -Path "quick_manual_fix.sql" -Raw

# Execute SQL using different approach
Write-Host "Executing SQL..." -ForegroundColor Cyan
$sqlContent | supabase db remote sql

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ IMMEDIATE FIX APPLIED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "✅ enhanced_taskboard_analytics view created with updated_at column" -ForegroundColor Green
    Write-Host "✅ Your frontend should now work without the missing column error" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 DONE! Your app should work now." -ForegroundColor Magenta
} else {
    Write-Host ""
    Write-Host "❌ Fix failed. Let's try the manual approach:" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please run: supabase db remote sql" -ForegroundColor Yellow
    Write-Host "Then copy and paste this SQL:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host $sqlContent -ForegroundColor Cyan
}