# 🚀 Hosting Guide: Deploying Your Site

Recommended Platform: **Vercel** (Best for React/Vite + Supabase)
Alternative: **Netlify**

---

## option 1: Deploy to Vercel (Recommended)

### 1. Push Code to GitHub
You have already done this! Your code is on `main`.

### 2. Sign Up / Log In to Vercel
1.  Go to [vercel.com](https://vercel.com).
2.  Login with your **GitHub** account.

### 3. Create New Project
1.  Click **"Add New..."** > **"Project"**.
2.  Find `oflex-creative-studio` in the Import Git Repository list.
3.  Click **"Import"**.

### 4.  **Configure Project**:
    *   **Framework Preset:** Vercel should auto-detect "Vite". If not, select it.
    *   **Root Directory:** `./` (Default)
    *   **Build Command:** `npm run build` (Default)
    *   **Output Directory:** `dist` (Default)
    *   _Note: I have included a `vercel.json` file to ensure page refreshes work correctly (fixes 404 errors)._

### 5. Setup Environment Variables (CRITICAL)
Expand the **"Environment Variables"** section and add these EXACTLY as they appear in your local `.env` file:

| Key | Value (Copy from your local .env) |
| :--- | :--- |
| `VITE_SUPABASE_URL` | `https://your-project-id.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `your_anon_key` |
| `VITE_SUPABASE_PROJECT_ID` | `your_project_id` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `sb_publishable_...` |

*(Note: Never paste the secrets/service_role keys here, only the ones starting with `VITE_`)*

### 6. Click "Deploy"
Wait for the build to finish. Once done, you will get a URL like `https://oflex-creative-studio.vercel.app`.

---

## ⚡ POST-DEPLOYMENT: Final Step (Important!)

Once your site is live, authentication (Login/Signup) will **FAIL** until you update Supabase.

1.  Copy your new **Production URL** (e.g., `https://oflex-creative-studio.vercel.app`).
2.  Go to your [Supabase Dashboard](https://supabase.com/dashboard).
3.  Select your project > **Authentication** > **URL Configuration**.
4.  **Add to Redirect URLs**:
    *   `https://oflex-creative-studio.vercel.app/**` (The `/**` allows all subpages)
5.  **Update Site URL**: Change it to your production URL (`https://oflex-creative-studio.vercel.app`) if you want this to be the primary site.

**Now your live site login will work!** 

---

## Option 2: Deploy to Netlify

1.  Go to [netlify.com](https://www.netlify.com/).
2.  "Add new site" > "Import an existing project" > GitHub.
3.  Select `oflex-creative-studio`.
4.  **Build settings**:
    *   **Build command**: `npm run build`
    *   **Publish directory**: `dist`
5.  **Environment variables**: Click "Add" and enter the 4 variables listed above.
6.  Deploy.
7.  **Update Supabase authentication settings** with your new Netlify URL (same as Step 5 above).
