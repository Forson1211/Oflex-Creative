# Project Structure Guide

This project is organized into clear sections for frontend, backend, and documentation.

## 📂 Project Structure

### **🎨 Frontend (User Interface)**
- **`src/`**: This contains all the React code, pages, and components.
  - `src/pages/`: The different pages of your website (Home, Store, Profile, etc.).
  - `src/components/`: Reusable UI elements (Buttons, Navbar, Forms).
  - `src/hooks/`: Logic for data fetching (e.g., `usePurchases`, `useAuth`).
- **`public/`**: Static assets like images, icons, and the site logo.
- **`index.html`**: The main entry point for the website.

---

### **⚙️ Backend (Server & Database)**
- **`supabase/`**: The backend logic and database configuration.
  - `supabase/functions/`: Serverless Edge Functions (e.g., `payment-verify` for handling payments).
  - `supabase/migrations/`: SQL files that define your database structure.
- **`database_scripts/`**: A collection of manual SQL scripts and backups (e.g., `FULL_SETUP.sql`).

---

### **📚 Documentation & Guides**
- **`documentation/`**: All setup guides, fix summaries, and deployment instructions are stored here.
  - `DEPLOYMENT_GUIDE.md`: How to deploy the site.
  - `ADMIN_SETUP_GUIDE.md`: How to manage the admin dashboard.

---

### **🛠 Scripts**
- **`scripts/`**: Helper scripts for deployment and verification.

## Quick Start
- **Run Frontend**: `npm run dev`
- **Deploy Backend Function**: `supabase functions deploy [function-name]`
