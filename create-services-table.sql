-- ============================================
-- CORRECTED: Services Table Creation
-- ============================================
-- Run this in Supabase SQL Editor

-- Drop existing table if you want to recreate (CAREFUL: This deletes all data!)
-- DROP TABLE IF EXISTS services CASCADE;

-- Create services table (without service_image)
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_services_display_order ON services(display_order);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_services_active_order ON services(is_active, display_order);

-- ============================================
-- Row Level Security (RLS) Setup
-- ============================================

-- Enable RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (in case they exist)
DROP POLICY IF EXISTS "Allow public read services" ON services;
DROP POLICY IF EXISTS "Enable all access for services" ON services;
DROP POLICY IF EXISTS "allow_all_services" ON services;

-- Create policy: Allow ALL operations for everyone (Development Mode)
-- This allows INSERT, UPDATE, DELETE, SELECT without authentication
CREATE POLICY "allow_all_operations" ON services
  FOR ALL
  TO public, anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Optional: Insert Sample Data
-- ============================================

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
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Verification Queries
-- ============================================

-- Check if RLS is enabled (should return 't' for true)
SELECT relrowsecurity 
FROM pg_class 
WHERE relname = 'services';

-- View current policies (should show "allow_all_operations")
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'services';

-- View table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'services'
ORDER BY ordinal_position;

-- Test: Count services
SELECT COUNT(*) as total_services FROM services;
