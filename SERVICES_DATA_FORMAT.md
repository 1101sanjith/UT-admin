# Services Data Format

## Database Schema

The `services` table should have the following columns:

- `id` - UUID or INTEGER (Primary Key, Auto-generated)
- `name` - TEXT (Service name)
- `icon` - TEXT (Emoji icon)
- `color` - TEXT (Hex color code, e.g., #4CAF50)
- `price` - DECIMAL or NUMERIC (Service price)
- `what_we_do` - JSONB or JSON (Array of strings)
- `what_we_dont` - JSONB or JSON (Array of strings)
- `how_its_done` - JSONB or JSON (Array of strings)
- `is_active` - BOOLEAN (Service active status)
- `display_order` - INTEGER (Order for displaying services)
- `created_at` - TIMESTAMP (Auto-generated)
- `updated_at` - TIMESTAMP (Auto-generated)

## Sample Data Format

### CSV Format (for reference)

```csv
name,icon,color,price,what_we_do,what_we_dont,how_its_done,is_active,display_order
"Home Cleaning","🧹","#4CAF50",49,"[""Dusting"",""Mopping"",""Vacuuming""]","[""Outdoor cleaning"",""Laundry""]","[""Book service"",""Team arrives"",""Cleaning process"",""Inspection""]",true,1
"Car Wash","🚗","#2196F3",25,"[""Exterior wash"",""Interior vacuum"",""Tire polish""]","[""Engine wash"",""Painting""]","[""Arrival at site"",""Water rinse"",""Foam wash"",""Drying""]",true,2
```

### JSON Format (for Supabase insert)

```json
[
  {
    "name": "Home Cleaning",
    "icon": "🧹",
    "color": "#4CAF50",
    "price": 49,
    "what_we_do": ["Dusting", "Mopping", "Vacuuming"],
    "what_we_dont": ["Outdoor cleaning", "Laundry"],
    "how_its_done": [
      "Book service",
      "Team arrives",
      "Cleaning process",
      "Inspection"
    ],
    "is_active": true,
    "display_order": 1
  },
  {
    "name": "Car Wash",
    "icon": "🚗",
    "color": "#2196F3",
    "price": 25,
    "what_we_do": ["Exterior wash", "Interior vacuum", "Tire polish"],
    "what_we_dont": ["Engine wash", "Painting"],
    "how_its_done": ["Arrival at site", "Water rinse", "Foam wash", "Drying"],
    "is_active": true,
    "display_order": 2
  }
]
```

## Supabase SQL Table Creation

Run this SQL in your Supabase SQL editor:

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

-- Create index for display_order
CREATE INDEX IF NOT EXISTS idx_services_display_order ON services(display_order);

-- Create index for is_active
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);

-- Enable Row Level Security
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies (cleanup)
DROP POLICY IF EXISTS "Enable all access for services" ON services;
DROP POLICY IF EXISTS "Allow public read services" ON services;
DROP POLICY IF EXISTS "allow_all_services" ON services;

-- Create policy: Allow ALL operations for development
-- This allows INSERT, UPDATE, DELETE, SELECT for everyone
CREATE POLICY "allow_all_operations" ON services
  FOR ALL
  TO public, anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Insert sample data
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

## API Response Format

When fetching from the database, the data is transformed to:

```javascript
{
  id: "uuid-string",
  name: "Home Cleaning",
  icon: "🧹",
  color: "#4CAF50",
  price: 49,
  weDo: ["Dusting", "Mopping", "Vacuuming"],
  weDont: ["Outdoor cleaning", "Laundry"],
  howItsDone: ["Book service", "Team arrives", "Cleaning process", "Inspection"],
  isActive: true,
  status: "Active",
  displayOrder: 1
}
```
