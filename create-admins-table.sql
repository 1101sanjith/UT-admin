-- ============================================
-- Admin Users Table Creation
-- ============================================
-- Run this in Supabase SQL Editor

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  totp_secret TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_is_active ON admins(is_active);
CREATE INDEX IF NOT EXISTS idx_admins_created_at ON admins(created_at);

-- ============================================
-- Row Level Security (RLS) Setup
-- ============================================

-- Enable RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations on admins" ON admins;

-- Create policy: Allow ALL operations for everyone (Development Mode)
CREATE POLICY "allow_all_operations" ON admins
  FOR ALL
  TO public, anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Insert Default Super Admin
-- ============================================

INSERT INTO admins (email, name, totp_secret, role, is_active, created_by)
VALUES (
  'sanjithrozario@gmail.com',
  'Sanjith Rozario',
  'JBSWY3DPEHPK3PXP',
  'super_admin',
  true,
  'system'
)
ON CONFLICT (email) DO UPDATE SET
  totp_secret = EXCLUDED.totp_secret,
  role = EXCLUDED.role;

-- ============================================
-- Verification Queries
-- ============================================

-- Check if RLS is enabled
SELECT relrowsecurity 
FROM pg_class 
WHERE relname = 'admins';

-- View current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'admins';

-- View table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'admins'
ORDER BY ordinal_position;

-- Test: Count admins
SELECT COUNT(*) as total_admins FROM admins;

-- Test: View all admins
SELECT id, email, name, role, is_active, created_at FROM admins;
