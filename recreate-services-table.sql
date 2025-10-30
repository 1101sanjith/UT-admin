-- ============================================
-- RECREATE SERVICES TABLE (Single Query)
-- ============================================
-- This will:
-- 1. Drop existing table and all data
-- 2. Create new table without service_image
-- 3. Add proper indexes
-- 4. Enable RLS with correct policy
-- 5. Insert 2 sample services
-- ============================================

-- Drop existing table (removes all old data)
DROP TABLE IF EXISTS services CASCADE;

-- Create new services table
CREATE TABLE services (
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

-- Create indexes for performance
CREATE INDEX idx_services_display_order ON services(display_order);
CREATE INDEX idx_services_is_active ON services(is_active);

-- Enable RLS and create policy that allows all operations
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_operations" ON services
  FOR ALL
  TO public, anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Insert sample data
INSERT INTO services (name, icon, color, price, what_we_do, what_we_dont, how_its_done, display_order)
VALUES
  ('Home Cleaning', '🧹', '#4CAF50', 49, 
   '["Dusting", "Mopping", "Vacuuming"]'::jsonb,
   '["Outdoor cleaning", "Laundry"]'::jsonb,
   '["Book service", "Team arrives", "Cleaning", "Inspection"]'::jsonb, 1),
  ('Car Wash', '🚗', '#2196F3', 25,
   '["Exterior wash", "Interior vacuum", "Tire polish"]'::jsonb,
   '["Engine wash", "Painting"]'::jsonb,
   '["Arrive", "Rinse", "Wash", "Dry"]'::jsonb, 2);
