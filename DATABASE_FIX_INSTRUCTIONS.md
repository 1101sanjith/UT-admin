# Database Fix Instructions

## Issues Fixed

### 1. **Addresses Foreign Key Constraint Error**

**Problem:** `insert or update on table "addresses" violates foreign key constraint "address_user_id_fkey"`

**Solution:** Removed `NOT NULL` constraint from `user_id` column in addresses table.

### 2. **Service Tasks Not Displaying**

**Problem:** Order details modal wasn't showing individual service tasks.

**Solution:**

- Added `orderItems` state to store fetched order items
- Added `fetchOrderItems()` function to fetch items from `/api/orders/[id]` endpoint
- Updated API endpoint to use `orders_full_view_table` instead of deleted `orders_full_view` view
- Added horizontal scrollable cards to display each service task with:
  - Service icon and name
  - Quantity
  - Unit price and total price
  - Assign Provider button

### 3. **Database Connectivity**

**Problem:** Using `orders_full_view_table` instead of deleted `orders_full_view`.

**Solution:**

- Updated `/app/api/orders/[id]/route.ts` to query from `orders_full_view_table`
- All frontend pages already updated to use `orders_full_view_table`

---

## Steps to Apply Fixes

### Step 1: Run the Fix SQL Script

In your Supabase SQL Editor, run the `fix-database-issues.sql` file:

```bash
# Open Supabase Dashboard > SQL Editor
# Copy and paste contents of fix-database-issues.sql
# Click "Run"
```

This will:

- Fix the addresses constraint
- Sync `orders_full_view_table` with existing orders
- Verify data integrity
- Show diagnostic information

### Step 2: Verify the Changes

After running the SQL script, check the output for:

✅ `Addresses foreign key constraint fixed`  
✅ `orders_full_view_table synced successfully`  
✅ Database has order data  
✅ Sample data displays correctly

### Step 3: Test the Application

1. **Start the development server:**

   ```powershell
   npm run dev
   ```

2. **Navigate to Orders page:**
   - Go to `/dashboard/orders`
   - Click "View" on any order
3. **Verify service tasks are displayed:**

   - You should see horizontal scrollable cards
   - Each card shows a service task with icon, name, quantity, and prices
   - "Assign Provider" button should be visible on each task

4. **Check browser console:**
   - Should see: `📦 Order items fetched: [array of items]`
   - No errors about missing tables or columns

---

## Database Schema Changes

### `addresses` Table

**Before:**

```sql
user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
```

**After:**

```sql
user_id UUID REFERENCES users(id) ON DELETE CASCADE
```

### API Endpoint Changes

**File:** `/app/api/orders/[id]/route.ts`

**Before:**

```typescript
.from("orders_full_view")
```

**After:**

```typescript
.from("orders_full_view_table")
```

---

## File Changes Summary

### Modified Files:

1. **`complete_database_scema.sql`**

   - Removed `NOT NULL` from `addresses.user_id`

2. **`app/api/orders/[id]/route.ts`**

   - Changed query from `orders_full_view` to `orders_full_view_table`

3. **`app/dashboard/orders/page.tsx`**

   - Added `orderItems` and `loadingItems` state
   - Added `fetchOrderItems()` function
   - Updated `handleViewDetails()` to fetch order items
   - Added "Service Tasks" section with horizontal scrollable cards

4. **`fix-database-issues.sql`** (NEW)
   - Comprehensive fix script with diagnostics

---

## Expected Behavior

### Order Details Modal Should Show:

1. **Order Summary** (Grid with 4 items)

   - Order Number
   - Status badge
   - Date & Time
   - Amount

2. **Customer Information**

   - Name, Phone, Email, Address

3. **Service Details**

   - Service count
   - Payment method

4. **Service Tasks** ← NEW SECTION

   - Horizontal scrollable cards (320px each)
   - Each task shows:
     - Icon (emoji) + Service name
     - Quantity
     - Unit price
     - Total price
     - "Assign Provider" button

5. **Order Timeline**
   - Placed, Confirmed, In Progress, Completed

---

## Troubleshooting

### If service tasks don't appear:

1. **Check browser console for errors:**

   ```javascript
   // Should see:
   📦 Order items fetched: [{service_name: "...", ...}]
   ```

2. **Verify order_items table has data:**

   ```sql
   SELECT * FROM order_items LIMIT 5;
   ```

3. **Check API response:**
   - Open Network tab in browser
   - Click "View" on an order
   - Check `/api/orders/[id]` response
   - Should contain `items` array

### If you see "No service tasks found":

This means `order_items` table is empty for that order. You need to:

- Create orders through the app (not manually in database)
- Or manually insert order_items for existing orders

---

## Next Steps

After applying these fixes:

1. ✅ Addresses can be created without foreign key errors
2. ✅ Service tasks display correctly in order details
3. ✅ Database connectivity uses correct table (`orders_full_view_table`)
4. ✅ All order data fetches properly

You can now:

- View complete order details with all service tasks
- Assign providers to individual tasks (button ready, needs backend implementation)
- Track order timeline and status
