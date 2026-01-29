# Supabase CLI Commands to Disable Email Confirmation

## Check current auth settings
supabase settings get auth

## Update auth settings to disable email confirmation
# Note: This requires Supabase CLI to be linked to your project

# 1. First, link your project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# 2. Update the auth config
# Edit your supabase/config.toml file and set:
# [auth.email]
# enable_signup = true
# enable_confirmations = false  # <-- Set this to false

# 3. Push the config to your project
supabase db push

## Alternative: Use Supabase Management API
# You can also use curl to update the setting:
curl -X PATCH 'https://api.supabase.com/v1/projects/YOUR_PROJECT_REF/config/auth' \
  -H "Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "MAILER_AUTOCONFIRM": true
  }'
