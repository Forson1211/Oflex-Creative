# Admin Features Update: Category & Order Management

## 1. Category Management

**Problem:** Admins needed a way to remove categories (especially typo/test categories like "CHURCH fLYER") from the dropdown list.

**Solution:**
- Added a **"Manage Categories"** button (gear icon) next to the "Add" button in the Product creation form.
- Clicking this opens a dialog listing all active categories.
- Admins can click the **Trash icon** to remove a category.

**How it works:**
- When a category is removed, the system finds all products using that category and sets them to **"Uncategorized"**.
- This safely cleans up the category list without deleting products.
- **Note:** Default categories (hardcoded in the system like "Business Flyers") will always appear in the list, even if "deleted" (cleaning up products), ensuring core categories are always available. Custom/Typo categories will disappear completely once removed.

## 2. Order Deletion

**Problem:** Admins needed functionality to delete orders.

**Solution:**
- Verified that the "Delete Order" button exists in the Orders page (under the "..." menu).
- Created a database migration (`20260129162000_admin_manage_orders.sql`) to explicitly grant **DELETE** and **UPDATE** permissions to admins for the `orders` table.

**Migration Details:**
- `Admins and moderators can update orders`: Allows changing status (Pending -> Completed).
- `Admins can delete orders`: Allows permanently deleting orders.

## How to Test

### Remove a Category
1. Go to **Admin > Products**.
2. Click "Add Product" (or edit one).
3. Next to the category "Add" button, click the small **Settings/Gear icon**.
4. Find the unwanted category (e.g., "CHURCH fLYER") in the list.
5. Click the **Trash icon**.
6. Confirm the warning.
7. The category should disappear from the dropdown.

### Delete an Order
1. Go to **Admin > Orders**.
2. Find an order you want to delete.
3. Click the **three dots (...)** menu on the right.
4. Select **Delete Order**.
5. Confirm deletion.
