# How to Deploy Payment Functions (Manual Guide)

If the automated script `DEPLOY_PAYMENTS.ps1` doesn't work for you, follow these manual steps.

## Prerequisites
- You must have the Supabase CLI installed or use `npx supabase`.
- You need your **Paystack Secret Key** (starts with `sk_live_` or `sk_test_`).

## Step 1: Login to Supabase
Open your terminal (VS Code or PowerShell) and run:
```powershell
npx supabase login
```
Press Enter to open your browser and authorize the login.

## Step 2: Set the Payment Secret
Run this command, replacing `YOUR_SECRET_KEY` with your actual Paystack key:
```powershell
npx supabase secrets set PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxx
```

## Step 3: Deploy the Functions
Run these commands one by one to deploy the necessary payment functions:

```powershell
npx supabase functions deploy payment-init --no-verify-jwt
npx supabase functions deploy payment-verify --no-verify-jwt
npx supabase functions deploy paystack-webhook --no-verify-jwt
```

## Step 4: Configure Webhook (Optional but Recommended)
1. Go to your **Paystack Dashboard** > Settings > API & Webhooks.
2. Set the **Webhook URL** to your Supabase function URL.
   - It usually looks like: `https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/paystack-webhook`
   - You can find your Project Ref in your Supabase Dashboard URL.

## Verification
Once deployed, the `Checkout.tsx` page will automatically start using the live functions instead of the local dev simulation.
