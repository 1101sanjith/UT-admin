# Troubleshooting Services Data Connection

## Setup Checklist

### 1. Environment Variables

Create a `.env.local` file in the root directory with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**How to get these values:**

1. Go to your Supabase project
2. Click on Settings → API
3. Copy the "Project URL" as `NEXT_PUBLIC_SUPABASE_URL`
4. Copy the "anon public" key as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Create Services Table

Run this SQL in your Supabase SQL Editor:

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

-- Enable RLS (Row Level Security)
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust as needed for production)
CREATE POLICY "Enable all access for services" ON services
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

### 3. Test Database Connection

Create a test page to verify connection:

```typescript
// app/test-db/page.tsx
"use client";

import { useEffect, useState } from "react";

export default function TestDB() {
  const [status, setStatus] = useState("Testing...");

  useEffect(() => {
    async function test() {
      try {
        const response = await fetch("/api/services");
        const result = await response.json();

        if (response.ok) {
          setStatus(`✅ Connected! Found ${result.data?.length || 0} services`);
        } else {
          setStatus(`❌ Error: ${result.error}\n${result.details || ""}`);
        }
      } catch (error: any) {
        setStatus(`❌ Connection failed: ${error.message}`);
      }
    }
    test();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Database Connection Test</h1>
      <pre className="bg-gray-100 p-4 rounded">{status}</pre>
    </div>
  );
}
```

### 4. Common Error Messages

#### "Failed to create service"

**Possible causes:**

- Table doesn't exist → Run the SQL above
- Missing environment variables → Check `.env.local`
- RLS (Row Level Security) blocking access → Check policies
- Invalid data format → Check browser console for details

#### "relation 'services' does not exist"

**Solution:** The table hasn't been created. Run the SQL in step 2.

#### "permission denied for table services"

**Solution:** RLS is blocking access. Run the policy SQL in step 2.

#### "Invalid API key"

**Solution:** Check your environment variables are correct.

### 5. Verify Data Structure

When creating a service, the API expects this format:

```json
{
  "name": "Home Cleaning",
  "icon": "🧹",
  "color": "#4CAF50",
  "price": 49,
  "what_we_do": ["Dusting", "Mopping", "Vacuuming"],
  "what_we_dont": ["Outdoor cleaning", "Laundry"],
  "how_its_done": ["Book service", "Team arrives", "Cleaning", "Inspection"],
  "is_active": true
}
```

### 6. Check Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Try to create a service
4. Look for error messages
5. Check the Network tab to see the actual API request/response

### 7. Check Server Logs

If running locally with `npm run dev`, check the terminal output for:

- "Inserting service data:" - Shows what data is being sent
- "Supabase error:" - Shows database errors
- "Server error:" - Shows application errors

### 8. Manual Database Insert Test

Test if you can insert data directly in Supabase:

1. Go to Supabase → Table Editor → services
2. Click "Insert row"
3. Fill in:
   - name: "Test Service"
   - icon: "🧪"
   - color: "#FF0000"
   - price: 99
   - what_we_do: ["Test 1", "Test 2"]
   - what_we_dont: ["Not 1"]
   - how_its_done: ["Step 1", "Step 2"]
   - is_active: true
   - display_order: 1
4. Click "Save"

If this works, the table is set up correctly.

### 9. API Endpoint Testing

Test the API directly using curl or a tool like Postman:

```bash
# Test GET (fetch services)
curl http://localhost:3000/api/services

# Test POST (create service)
curl -X POST http://localhost:3000/api/services \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Service",
    "icon": "🧪",
    "color": "#FF0000",
    "price": 99,
    "what_we_do": ["Test 1"],
    "what_we_dont": ["Not 1"],
    "how_its_done": ["Step 1"],
    "is_active": true
  }'
```

### 10. Restart Development Server

After adding environment variables or making changes:

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

## Quick Fix Steps

1. ✅ Verify `.env.local` exists with correct values
2. ✅ Run the SQL to create the table
3. ✅ Restart the dev server
4. ✅ Check browser console for specific error
5. ✅ Test with the test page above
6. ✅ Try manual insert in Supabase UI

If all else fails, share the error message from:

- Browser console (F12 → Console)
- Network tab (F12 → Network)
- Server terminal output
