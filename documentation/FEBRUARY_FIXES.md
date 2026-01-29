# February Fixes & Improvements

This document outlines the fixes implemented on January 29th, 2026, and the manual steps required in the Supabase Dashboard.

## 1. Autoconfirm Signups
To fix the "Error sending confirmation email" issue and allow users to sign up without waiting for an email:
1. Go to your **Supabase Dashboard**.
2. Navigate to **Authentication** -> **Settings**.
3. Scroll down to **Email Auth**.
4. Disable (toggle off) **Confirm email**.
5. Click **Save**.

## 2. Profile Picture Upload
The profile picture upload functionality has been implemented in both the User Profile and Admin Profile pages.

### Required Supabase Setup (SQL)
You **MUST** run the following SQL in your Supabase SQL Editor to create the storage bucket and set the correct permissions:

```sql
-- 1. Create avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public access to view avatars
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- 3. Allow authenticated users to upload their own avatar
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Allow users to update their own avatar
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Allow users to delete their own avatar
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

## 3. Homepage Layout Update
The **Digital Store (Featured Products)** section has been moved higher up on the homepage, appearing immediately after the hero slider for better visibility, as requested.
