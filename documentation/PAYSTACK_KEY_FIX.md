# 🔧 Paystack API Key Issue - Fix Guide

## Problem
The Paystack API is rejecting your secret key with the error: **"Invalid key"**

This means the `PAYSTACK_SECRET_KEY` stored in Supabase Edge Functions is either:
- ❌ Expired or revoked
- ❌ Incorrect (typo or wrong key copied)
- ❌ Test key being used in production mode (or vice versa)

## Solution: Update Your Paystack Secret Key

### Step 1: Get Your Valid Paystack Secret Key

1. Go to your **Paystack Dashboard**: https://dashboard.paystack.com/
2. Log in with your account
3. Navigate to: **Settings** → **API Keys & Webhooks**
4. Copy your **Secret Key** (starts with `sk_test_` for test mode or `sk_live_` for live mode)

   ⚠️ **Important**: 
   - Use `sk_test_` keys for testing/development
   - Use `sk_live_` keys only for production
   - Never share these keys publicly

### Step 2: Update the Secret in Supabase

Run this command in your terminal (replace `YOUR_NEW_KEY` with the actual key):

```powershell
npx supabase secrets set PAYSTACK_SECRET_KEY=YOUR_NEW_KEY
```

**Example:**
```powershell
npx supabase secrets set PAYSTACK_SECRET_KEY=sk_test_abc123xyz456...
```

### Step 3: Redeploy the Edge Functions

After updating the secret, redeploy the payment functions:

```powershell
npx supabase functions deploy payment-init --no-verify-jwt
npx supabase functions deploy payment-verify --no-verify-jwt
```

### Step 4: Test the Checkout

1. Refresh your browser at `http://localhost:3001/checkout`
2. Try the checkout process again
3. You should now see a different error message that says:
   - **"Payment configuration error: Invalid Paystack API key"** (if key is still invalid)
   - OR be redirected to Paystack payment page (if key is valid) ✅

## Current Status

✅ Edge Functions are deployed and working
✅ Internet connection is fine
✅ Supabase configuration is correct
❌ **Paystack API key needs to be updated**

## Quick Test

You can verify your Paystack key is valid by running this PowerShell command:

```powershell
Invoke-WebRequest -Uri "https://api.paystack.co/transaction/initialize" -Method POST -Headers @{"Authorization"="Bearer YOUR_PAYSTACK_KEY"; "Content-Type"="application/json"} -Body '{"email":"test@example.com","amount":"10000"}'
```

If the key is valid, you'll get a response with `"status": true`.
If invalid, you'll get `"Invalid key"`.

---

**Next Steps:**
1. Get a valid Paystack secret key from your dashboard
2. Update it using the command above
3. Redeploy the functions
4. Test checkout again
