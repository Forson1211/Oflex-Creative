# PowerShell Script to Deploy Supabase Edge Functions for Payments

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   OFLEX CREATIVE STUDIO - DEPLOYMENT     " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Check for Supabase CLI
if (Get-Command "supabase" -ErrorAction SilentlyContinue) {
    Write-Host "[+] Supabase CLI found." -ForegroundColor Green
} else {
    Write-Host "[!] Supabase CLI not found. Using 'npx supabase' instead." -ForegroundColor Yellow
}

$supabaseCmd = if (Get-Command "supabase" -ErrorAction SilentlyContinue) { "supabase" } else { "npx supabase" }

# 2. Login Prompt
Write-Host "`n[Step 1] Authenticating with Supabase..." -ForegroundColor Cyan
Write-Host "If you are not logged in, a browser window will open."
Write-Host "Please confirm the login in the browser."
Invoke-Expression "$supabaseCmd login"

# 3. Paystack Secret Key Configuration
Write-Host "`n[Step 2] Configuring Secrets..." -ForegroundColor Cyan
$paystackKey = Read-Host "Enter your Paystack Secret Key (starts with sk_live_... or sk_test_...)"

if ([string]::IsNullOrWhiteSpace($paystackKey)) {
    Write-Host "[!] No key entered. Skipping secret configuration (functions might fail if key is not already set)." -ForegroundColor Red
} else {
    Write-Host "Setting PAYSTACK_SECRET_KEY..."
    Invoke-Expression "$supabaseCmd secrets set PAYSTACK_SECRET_KEY=$paystackKey"
}

# 4. Deploy Functions
Write-Host "`n[Step 3] Deploying Edge Functions..." -ForegroundColor Cyan

$functions = @("paystack-initialize", "paystack-verify", "paystack-webhook")

foreach ($func in $functions) {
    Write-Host "Deploying $func..."
    Invoke-Expression "$supabaseCmd functions deploy $func --no-verify-jwt"
}

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "   DEPLOYMENT COMPLETE!                   " -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "You can now accept real payments."
