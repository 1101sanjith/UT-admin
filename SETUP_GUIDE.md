# 🚀 Quick Setup Guide - Services Feature

## Step 1: Set Up Environment Variables

1. Create a file named `.env.local` in your project root (if it doesn't exist)
2. Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Where to find these:**

- Go to https://supabase.com
- Open your project
- Click Settings (⚙️) → API
- Copy "Project URL" and "anon public" key

## Step 2: Create the Services Table

1. Open your Supabase project
2. Go to SQL Editor
3. Click "New Query"
4. Paste this SQL and click "Run":

```sql
-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#4CAF50',
  price NUMERIC(10, 2) NOT NULL,
  what_we_do JSONB DEFAULT '[]'::jsonb,
  what_we_dont JSONB DEFAULT '[]'::jsonb,
  how_its_done JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_services_display_order ON services(display_order);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);

-- Enable Row Level Security
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
CREATE POLICY "Enable all access for services" ON services
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insert sample data (optional)
INSERT INTO services (name, icon, color, price, what_we_do, what_we_dont, how_its_done, is_active, display_order)
VALUES
  (
    'Home Cleaning',
    '🧹',
    '#4CAF50',
    49,
    '["Dusting", "Mopping", "Vacuuming"]'::jsonb,
    '["Outdoor cleaning", "Laundry"]'::jsonb,
    '["Book service", "Team arrives", "Cleaning process", "Inspection"]'::jsonb,
    true,
    1
  ),
  (
    'Car Wash',
    '🚗',
    '#2196F3',
    25,
    '["Exterior wash", "Interior vacuum", "Tire polish"]'::jsonb,
    '["Engine wash", "Painting"]'::jsonb,
    '["Arrival at site", "Water rinse", "Foam wash", "Drying"]'::jsonb,
    true,
    2
  );
```

## Step 3: Restart Your Development Server

If your dev server is running, stop it (Ctrl+C) and restart:

```bash
npm run dev
```

## Step 4: Test the Connection

Open your browser and go to:

```
http://localhost:3000/api/test-connection
```

You should see a JSON response like:

```json
{
  "timestamp": "2025-10-30T...",
  "environment": {
    "hasSupabaseUrl": true,
    "hasSupabaseKey": true,
    ...
  },
  "connection": {
    "status": "connected"
  },
  "table": {
    "exists": true
  },
  "data": {
    "count": 2,
    "sample": [...]
  }
}
```

✅ If `connection.status` is "connected" and `table.exists` is true, you're good to go!

❌ If you see errors, check the response for hints and see TROUBLESHOOTING.md

## Step 5: Test Adding a Service

1. Go to: `http://localhost:3000/dashboard/services`
2. Click "Add Service" button
3. Fill in the form:
   - **Service name**: Plumbing
   - **Service icon**: 🔧
   - **Background color**: #FF9800 (or use the color picker)
   - **Price**: 79
4. Add items:
   - **What We do**:
     - "Pipe repair"
     - Click Add, enter "Leak fixing"
     - Click Add, enter "Installation"
   - **What We don't do**:
     - "Electrical work"
     - Click Add, enter "Roofing"
   - **How it's Work**:
     - "Call us"
     - Click Add, enter "Technician visits"
     - Click Add, enter "Problem diagnosed"
     - Click Add, enter "Work completed"
5. Click "Create"

✅ You should see "Service created successfully!" and the service appears in the table.

## Step 6: Verify in Database

1. Go to Supabase → Table Editor → services
2. You should see your newly created service

## Data Structure Reference

The service data is stored in this format:

```typescript
{
  name: string,           // Service name
  icon: string,           // Emoji/icon
  color: string,          // Hex color code (e.g., "#4CAF50")
  price: number,          // Starting price
  what_we_do: string[],   // Array of inclusions
  what_we_dont: string[], // Array of exclusions
  how_its_done: string[], // Array of process steps
  is_active: boolean,     // Active status
  display_order: number   // Auto-calculated sort order
}
```

## API Endpoints

The app now uses these API routes:

- `GET /api/services` - Fetch all services
- `POST /api/services` - Create new service
- `PUT /api/services` - Update service
- `DELETE /api/services?id={id}` - Delete service
- `GET /api/test-connection` - Test database connection

## Common Issues

### "Failed to create service"

→ Check `/api/test-connection` to diagnose the issue

### "Table doesn't exist"

→ Run the SQL from Step 2

### "Permission denied"

→ Make sure you ran the RLS policy SQL

### Changes not showing up

→ Restart your dev server after adding .env.local

## What Changed

### Files Modified:

- ✅ `app/dashboard/services/page.tsx` - Uses API routes now
- ✅ `app/api/services/route.ts` - Created API with proper validation
- ✅ `app/api/test-connection/route.ts` - Created diagnostic endpoint

### Features Added:

- ✅ Proper error handling with detailed messages
- ✅ Data validation (required fields, data types)
- ✅ Auto-generation of display_order
- ✅ API-based architecture (no direct DB calls from frontend)
- ✅ Diagnostic endpoint for troubleshooting

### Removed:

- ❌ Direct Supabase calls from frontend
- ❌ Service image field (as requested)

## Next Steps

1. Test creating, editing, and deleting services
2. Customize the RLS policies for production (currently allows all access)
3. Add authentication checks to API routes if needed
4. Add more services to your database

---

Need help? Check `TROUBLESHOOTING.md` for detailed debugging steps.
