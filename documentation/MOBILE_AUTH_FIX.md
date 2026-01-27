# Fixing "Page Can't Be Reached" on Mobile (Supabase Auth)

If you are testing your application on a mobile device and clicking email verification or password reset links results in a "Page Can't Be Reached" error, it is because **the links are pointing to `localhost`**.

`localhost` refers to *the device itself*. When you click a `localhost` link on your phone, your phone tries to connect to itself, not your computer.

## The Solution

You need to update your Supabase **Site URL** to use your computer's local network IP address **AND** add `localhost` to the Redirect URLs so it works on your computer too.

### Step 1: Find Your Local IP Address

1.  Open your terminal/command prompt.
2.  Run `ipconfig` (Windows) or `ifconfig` (Mac/Linux).
3.  Look for your IPv4 Address (e.g., `192.168.1.15`).

### Step 2: Update Supabase Configuration

1.  Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2.  Select your project.
3.  Go to **Authentication** > **URL Configuration**.
4.  Change **Site URL** from `http://localhost:3000` to `http://YOUR_LOCAL_IP:3000`.
    *   Example: `http://192.168.1.15:3000`
5.  **CRITICAL:** Under **Redirect URLs**, make sure you have BOTH:
    *   `http://localhost:3000/**` (Allows working from your computer)
    *   `http://YOUR_LOCAL_IP:3000/**` (Allows working from mobile)

**If you don't add `localhost`, login will stop working on your computer!**

### Step 3: Configuring for Production

If you are deploying your site (e.g., to Vercel, Netlify), you must set the **Site URL** to your actual domain:

1.  Change **Site URL** to `https://your-project.com`.
2.  Add `https://your-project.com/**` to **Redirect URLs**.

## Summary of Code Changes

I have also updated your application code to handle password resets properly:

1.  **Added "Forgot Password" Link**: You can now request a password reset directly from the login page.
2.  **Handled Reset Redirects**: When you click the link in your email, the app now detects the `update_password` signal and shows a "Set New Password" form.

**Try requesting a new password reset email AFTER updating your Supabase Site URL.**
