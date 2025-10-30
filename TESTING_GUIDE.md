# Testing Guide - Add Service Feature

## Prerequisites

1. **Supabase Setup**

   - Create the `services` table using the SQL in `SERVICES_DATA_FORMAT.md`
   - Verify the table exists in your Supabase dashboard

2. **Environment Variables**
   - Ensure `.env.local` has your Supabase credentials:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
     ```

## Test Cases

### Test 1: Add New Service

1. Navigate to `/dashboard/services`
2. Click the "Add Service" button
3. Fill in the form:
   - **Service name**: Home Cleaning
   - **Service icon**: 🧹
   - **Background color**: #4CAF50 (use color picker or type)
   - **Price**: 49
4. Add "What We do" items:
   - Click on the input, type "Dusting"
   - Click "Add" to add another field
   - Type "Mopping"
   - Click "Add" again
   - Type "Vacuuming"
5. Add "What We don't do" items:
   - Type "Outdoor cleaning"
   - Click "Add"
   - Type "Laundry"
6. Add "How it's Work" steps:
   - Type "Book service"
   - Click "Add"
   - Type "Team arrives"
   - Click "Add"
   - Type "Cleaning process"
   - Click "Add"
   - Type "Inspection"
7. Click "Create"

**Expected Result**:

- Success message appears
- Modal closes
- New service appears in the table
- Service has display_order = (highest existing + 1)

### Test 2: Remove Array Items

1. Click "Add Service"
2. Add 3 items to "What We do"
3. Click "Remove" on the 2nd item

**Expected Result**:

- Item is removed
- Other items remain
- No empty gaps

### Test 3: Empty Field Validation

1. Click "Add Service"
2. Leave "Service name" empty
3. Fill in other fields
4. Click "Create"

**Expected Result**:

- Alert: "Please enter a service name"
- Form doesn't submit

### Test 4: Price Validation

1. Click "Add Service"
2. Fill in all fields
3. Set price to 0 or negative
4. Click "Create"

**Expected Result**:

- Alert: "Please enter a valid price"
- Form doesn't submit

### Test 5: Edit Existing Service

1. Click "Manage" on any service
2. Click "Edit Service"
3. Change the service name
4. Click "Save Changes"

**Expected Result**:

- Success message
- Modal stays open (in view mode)
- Changes are visible in the table

### Test 6: Color Picker

1. Click "Add Service"
2. Click on the color picker
3. Select a color visually

**Expected Result**:

- Color value appears in both picker and text input
- Hex code updates in text field

### Test 7: Empty Array Items Filtered

1. Click "Add Service"
2. Fill in required fields
3. Leave some array inputs empty
4. Click "Create"

**Expected Result**:

- Service is created
- Empty items are not saved
- Only filled items appear in database

### Test 8: View Service Details

1. Click "Manage" on any service

**Expected Result**:

- Modal opens in view mode
- Service icon shows with background color
- All arrays display properly
- Edit, Activate/Deactivate, Delete buttons visible

## Database Verification

After adding a service, check Supabase:

1. Go to Table Editor
2. Open `services` table
3. Find your new service
4. Verify columns:
   - `name` = "Home Cleaning"
   - `icon` = "🧹"
   - `color` = "#4CAF50"
   - `price` = 49
   - `what_we_do` = JSON array
   - `what_we_dont` = JSON array
   - `how_its_done` = JSON array
   - `is_active` = true
   - `display_order` = number

## Common Issues & Solutions

### Issue: Modal doesn't open

**Solution**: Check if Modal component is working, verify imports

### Issue: Service not saving

**Solution**:

- Check browser console for errors
- Verify Supabase connection
- Check environment variables
- Ensure table exists with correct schema

### Issue: Arrays showing as "[object Object]"

**Solution**:

- Verify column type is JSONB in Supabase
- Check data transformation in fetchServices()

### Issue: Color picker not working

**Solution**:

- Verify browser supports <input type="color">
- Use text input as fallback

## Manual Data Insert (for testing)

If you want to manually add test data via Supabase SQL Editor:

```sql
INSERT INTO services (name, icon, color, price, what_we_do, what_we_dont, how_its_done, is_active, display_order)
VALUES (
  'Test Service',
  '🧪',
  '#FF5722',
  99,
  '["Test 1", "Test 2", "Test 3"]'::jsonb,
  '["Not Test 1", "Not Test 2"]'::jsonb,
  '["Step 1", "Step 2", "Step 3", "Step 4"]'::jsonb,
  true,
  99
);
```

## Performance Check

- Adding service should complete in < 2 seconds
- Modal should open instantly
- Table should refresh smoothly after adding
