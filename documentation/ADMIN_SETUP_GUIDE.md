# Admin User Setup & Troubleshooting Guide

## Quick Fix: Make Your User an Admin

### Step 1: Access Supabase SQL Editor
1. Go to: https://your-project-id.supabase.co/project/your-project-id/sql
2. Log in to your Supabase dashboard

### Step 2: Run the Admin Setup Script
Copy and paste ONE of the following options into the SQL Editor:

#### Option A: Make a Specific User Admin (Recommended)
```sql
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Replace 'your-email@example.com' with your actual email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'your-email@example.com';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User with that email not found';
  END IF;
  
  DELETE FROM public.user_roles WHERE user_id = v_user_id;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin');
  
  RAISE NOTICE 'User % is now an admin', v_user_id;
END $$;
```

#### Option B: Make the First User Admin
```sql
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  ORDER BY created_at ASC
  LIMIT 1;
  
  DELETE FROM public.user_roles WHERE user_id = v_user_id;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin');
  
  RAISE NOTICE 'First user % is now an admin', v_user_id;
END $$;
```

### Step 3: Verify Your Admin Status
Run this query to see all users and their roles:
```sql
SELECT 
  u.id,
  u.email,
  u.created_at,
  COALESCE(ur.role, 'user') as role
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
ORDER BY u.created_at ASC;
```

### Step 4: Refresh Your Application
1. Log out of your application
2. Clear your browser cache (or open an incognito window)
3. Log back in
4. You should now have admin access!

---

## Fixes Applied

### 1. Profile Page Loading Fix ✅
**Issue:** Profile page crashed when trying to access user properties before checking if user exists.

**Solution:** Reordered the code to check for user existence BEFORE accessing user properties.

### 2. Logout Navigation Fix ✅
**Issue:** Logout button wasn't redirecting properly because the component unmounted before navigation could complete.

**Solution:** Removed premature early return in AdminLayout that was causing the component to unmount during logout.

---

## Testing Checklist

After setting up your admin user, test the following:

- [ ] Can log in successfully
- [ ] Profile page loads without errors
- [ ] Can access `/admin` route
- [ ] Can see admin dashboard
- [ ] Logout button works and redirects to auth page
- [ ] After logout, cannot access admin pages
- [ ] Can log back in and regain admin access

---

## Common Issues & Solutions

### Issue: "Access Denied" when trying to access admin pages
**Solution:** 
1. Check that your user has 'admin' role in the database (use Step 3 query above)
2. Clear browser cache and cookies
3. Log out and log back in

### Issue: Logout doesn't redirect
**Solution:** 
1. Make sure you've applied the latest code changes
2. Clear browser cache
3. Try in incognito mode

### Issue: Role not persisting after refresh
**Solution:**
1. Check browser console for errors
2. Verify the `user_roles` table has the correct entry
3. Check that RLS policies are correctly set up

---

## Database Schema Reference

### user_roles table
```sql
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role text NOT NULL CHECK (role IN ('admin', 'moderator', 'user')),
  created_at timestamptz DEFAULT now()
);
```

### Valid Roles
- `admin` - Full access to all admin features
- `moderator` - Access to content management (no user management or settings)
- `user` - Regular user (default)

---

## Need More Help?

If you're still experiencing issues:
1. Check the browser console for errors (F12)
2. Check the Network tab for failed API requests
3. Verify your Supabase project is running
4. Check that all migrations have been applied
