# Oflex Creative Studio

## 📂 Project Organization

This project is organized into two main parts: **Frontend** (the website) and **Backend** (the database & server).

### 🖥️ **Frontend** -> `/src`
The **`src`** folder contains all the code for the visual part of the website.
- **Go here to edit:** Pages, Components, Designs, Colors, React Hooks.
- **Main Files:** `src/App.tsx`, `src/pages/`, `src/components/`.

### 🗄️ **Backend** -> `/supabase`
The **`supabase`** folder contains the server-side logic and database configuration.
- **Go here to edit:** Edge Functions (Payments), Database Schema, Auth settings.
- **Main Files:** `supabase/functions/payment-verify/`, `supabase/migrations/`.

---

### 📚 **Other Folders**
I have organized the rest of the project files for you:

- **`/documentation`**: Contains all setup guides, fix logs, and help files.
- **`/database_scripts`**: Contains manual SQL backups and setup scripts (e.g., `FULL_SETUP.sql`).
- **`/scripts`**: Helper scripts for deployment and verification.
- **`/public`**: Static assets like images and the logo.

### 🚀 **Quick Commands**
- **Start Website**: `npm run dev`
- **Deploy Backend**: `supabase functions deploy [function-name]`
