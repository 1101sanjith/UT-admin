-- ============================================
-- FIX: Row Level Security Policy for Services
-- ============================================
-- Copy and run this ENTIRE script in Supabase SQL Editor
-- This will fix the "row-level security policy" error

-- Step 1: Drop all existing policies
DROP POLICY IF EXISTS "Enable all access for services" ON services;
DROP POLICY IF EXISTS "Public can view active services" ON services;
DROP POLICY IF EXISTS "Authenticated users can manage services" ON services;
DROP POLICY IF EXISTS "Allow all operations on services" ON services;

-- Step 2: DISABLE Row Level Security (simplest fix for development)
-- This allows all operations without authentication
ALTER TABLE services DISABLE ROW LEVEL SECURITY;

-- ============================================
-- ALTERNATIVE: If you prefer to KEEP RLS enabled
-- ============================================
-- Uncomment the lines below if you want RLS enabled:
-- (Comment out the DISABLE line above first)

-- ALTER TABLE services ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "allow_all_services" ON services
--   FOR ALL
--   TO public, anon, authenticated
--   USING (true)
--   WITH CHECK (true);

-- ============================================
-- Verification Queries
-- ============================================

-- Check if RLS is disabled (should return 'f' for false)
SELECT relrowsecurity 
FROM pg_class 
WHERE relname = 'services';

-- View current policies (should be empty after disabling RLS)
SELECT * 
FROM pg_policies 
WHERE tablename = 'services';

-- Test insert (should work now)
-- INSERT INTO services (name, icon, color, price, what_we_do, what_we_dont, how_its_done, is_active, display_order)
-- VALUES ('Test Service', '🧪', '#FF0000', 99, '["Test"]'::jsonb, '["Not"]'::jsonb, '["Step 1"]'::jsonb, true, 999);
