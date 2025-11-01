-- ============================================
-- COMPLETE DATABASE SCHEMA
-- Home Maid Service Application
-- All Tables, Functions, Triggers & Policies
-- Date: November 1, 2025
-- ============================================

-- ============================================
-- CLEANUP: Drop existing tables in correct order
-- ============================================
DROP TABLE IF EXISTS orders_full_view_table CASCADE;
DROP TABLE IF EXISTS order_history CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS generate_order_number() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS log_order_status_change() CASCADE;

-- Drop existing views
DROP VIEW IF EXISTS orders_full_view CASCADE;

-- ============================================
-- TABLE 1: ADMINS
-- Stores admin account information
-- ============================================
CREATE TABLE admins (
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

-- Admins table indexes
CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_admins_is_active ON admins(is_active);
CREATE INDEX idx_admins_created_at ON admins(created_at);

-- Admins table comments
COMMENT ON TABLE admins IS 'Administrator accounts for the home maid service application';
COMMENT ON COLUMN admins.email IS 'Unique email used for admin login';
COMMENT ON COLUMN admins.totp_secret IS 'TOTP secret for two-factor authentication';
COMMENT ON COLUMN admins.role IS 'Admin role: admin or super_admin';

-- ============================================
-- TABLE 2: USERS
-- Stores user account information
-- ============================================
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users table indexes
CREATE INDEX idx_users_phone_number ON users(phone_number);

-- Users table comments
COMMENT ON TABLE users IS 'User accounts for the home maid service application';
COMMENT ON COLUMN users.phone_number IS 'Unique phone number used for login';
COMMENT ON COLUMN users.password IS 'User password (should be hashed in production)';

-- ============================================
-- TABLE 3: ADDRESSES
-- Stores user addresses for service delivery
-- ============================================
CREATE TABLE addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  house_floor VARCHAR(255) NOT NULL,
  building_block VARCHAR(255),
  landmark VARCHAR(255),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Addresses table indexes
CREATE INDEX idx_addresses_user_id ON addresses(user_id);
CREATE INDEX idx_addresses_default ON addresses(user_id, is_default) WHERE is_default = true;

-- Addresses table comments
COMMENT ON TABLE addresses IS 'Service delivery addresses for users';
COMMENT ON COLUMN addresses.is_default IS 'Flag for user default address';

-- ============================================
-- TABLE 4: SERVICES
-- Stores available services with pricing
-- ============================================
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

-- ============================================
-- TABLE 5: ORDERS
-- Main orders/bookings table
-- ============================================
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address_id UUID NOT NULL REFERENCES addresses(id) ON DELETE RESTRICT,
  
  -- Order details
  order_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Scheduling
  is_instant BOOLEAN DEFAULT false,
  scheduled_date DATE NOT NULL,
  scheduled_time VARCHAR(50) NOT NULL,
  booked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Pricing
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) DEFAULT 0,
  discount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  
  -- Status tracking
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50),
  
  -- Additional info
  special_instructions TEXT,
  cancellation_reason TEXT,
  cancelled_by VARCHAR(50),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  CONSTRAINT positive_amounts CHECK (subtotal >= 0 AND total_amount >= 0)
);

-- Orders table indexes
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_address_id ON orders(address_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_scheduled_date ON orders(scheduled_date);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_is_instant ON orders(is_instant);
CREATE INDEX idx_orders_user_status ON orders(user_id, status);

-- Orders table comments
COMMENT ON TABLE orders IS 'Customer bookings and orders';
COMMENT ON COLUMN orders.is_instant IS 'True for instant bookings (within 2 hours), false for scheduled';
COMMENT ON COLUMN orders.booked_at IS 'Timestamp when the booking was placed/confirmed by user';
COMMENT ON COLUMN orders.status IS 'Order status: pending, confirmed, in_progress, completed, cancelled';
COMMENT ON COLUMN orders.payment_status IS 'Payment status: pending, paid, refunded';

-- ============================================
-- TABLE 6: ORDER_ITEMS
-- Services included in each order
-- ============================================
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Service details
  service_name VARCHAR(255) NOT NULL,
  service_icon VARCHAR(50),
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  service_description TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT positive_quantity CHECK (quantity > 0),
  CONSTRAINT positive_prices CHECK (unit_price >= 0 AND total_price >= 0)
);

-- Order items table indexes
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- Order items table comments
COMMENT ON TABLE order_items IS 'Line items (services) in each order';

-- ============================================
-- TABLE 7: ORDER_HISTORY
-- Tracks all changes to orders
-- ============================================
CREATE TABLE order_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- History details
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  old_scheduled_date DATE,
  new_scheduled_date DATE,
  old_scheduled_time VARCHAR(50),
  new_scheduled_time VARCHAR(50),
  
  -- Change reason and notes
  change_reason TEXT,
  notes TEXT,
  changed_by VARCHAR(50),
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Order history table indexes
CREATE INDEX idx_order_history_order_id ON order_history(order_id);
CREATE INDEX idx_order_history_created_at ON order_history(created_at DESC);

-- Order history table comments
COMMENT ON TABLE order_history IS 'Audit log of all changes to orders';
COMMENT ON COLUMN order_history.changed_by IS 'Who made the change: user, admin, or system';

-- ============================================
-- TABLE 8: ORDERS_FULL_VIEW_TABLE
-- Materialized view as a table for complete order information
-- ============================================
CREATE TABLE orders_full_view_table (
  id UUID PRIMARY KEY,
  order_number VARCHAR(50),
  user_id UUID,
  user_name VARCHAR(255),
  user_phone VARCHAR(20),
  address_id UUID,
  house_floor VARCHAR(255),
  building_block VARCHAR(255),
  landmark VARCHAR(255),
  is_instant BOOLEAN,
  scheduled_date DATE,
  scheduled_time VARCHAR(50),
  booked_at TIMESTAMP WITH TIME ZONE,
  subtotal DECIMAL(10, 2),
  tax DECIMAL(10, 2),
  discount DECIMAL(10, 2),
  total_amount DECIMAL(10, 2),
  status VARCHAR(50),
  payment_status VARCHAR(50),
  payment_method VARCHAR(50),
  special_instructions TEXT,
  cancellation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  item_count BIGINT,
  total_items BIGINT
);

-- Orders full view table indexes
CREATE INDEX idx_orders_full_view_user_id ON orders_full_view_table(user_id);
CREATE INDEX idx_orders_full_view_status ON orders_full_view_table(status);
CREATE INDEX idx_orders_full_view_created_at ON orders_full_view_table(created_at DESC);
CREATE INDEX idx_orders_full_view_order_number ON orders_full_view_table(order_number);

-- Orders full view table comments
COMMENT ON TABLE orders_full_view_table IS 'Complete order information with user and address details (table format)';

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- Enable and configure security policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders_full_view_table ENABLE ROW LEVEL SECURITY;

-- Admins table policies
CREATE POLICY "Allow all operations on admins" ON admins
  FOR ALL TO public, anon, authenticated
  USING (true) WITH CHECK (true);

-- Users table policies
CREATE POLICY "Allow public signup" ON users
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public read users" ON users
  FOR SELECT TO public USING (true);

CREATE POLICY "Allow public update users" ON users
  FOR UPDATE TO public USING (true) WITH CHECK (true);

-- Addresses table policies
CREATE POLICY "Allow public insert addresses" ON addresses
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public read addresses" ON addresses
  FOR SELECT TO public USING (true);

CREATE POLICY "Allow public update addresses" ON addresses
  FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete addresses" ON addresses
  FOR DELETE TO public USING (true);

-- Services table policies (read-only for public)
CREATE POLICY "Allow public read services" ON services
  FOR SELECT TO public USING (is_active = true);

-- Orders table policies
CREATE POLICY "Allow public insert orders" ON orders
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public read orders" ON orders
  FOR SELECT TO public USING (true);

CREATE POLICY "Allow public update orders" ON orders
  FOR UPDATE TO public USING (true) WITH CHECK (true);

-- Order items policies
CREATE POLICY "Allow public insert order_items" ON order_items
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public read order_items" ON order_items
  FOR SELECT TO public USING (true);

-- Order history policies
CREATE POLICY "Allow public insert order_history" ON order_history
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public read order_history" ON order_history
  FOR SELECT TO public USING (true);

-- Orders full view table policies
CREATE POLICY "Allow public read orders_full_view_table" ON orders_full_view_table
  FOR SELECT TO public USING (true);

CREATE POLICY "Allow public insert orders_full_view_table" ON orders_full_view_table
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public update orders_full_view_table" ON orders_full_view_table
  FOR UPDATE TO public USING (true) WITH CHECK (true);

-- ============================================
-- FUNCTIONS
-- Database functions for automation
-- ============================================

-- Function: Generate unique order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_order_number TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Generate order number: UT + YYYYMMDD + Random 4 digits
    new_order_number := 'UT' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    -- Check if it exists
    SELECT EXISTS(SELECT 1 FROM orders WHERE order_number = new_order_number) INTO exists_check;
    
    -- If doesn't exist, return it
    IF NOT exists_check THEN
      RETURN new_order_number;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_order_number() IS 'Generates unique order numbers in format: UT + YYYYMMDD + 4 random digits';

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates updated_at column on row update';

-- Function: Auto-log order status changes to history
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status OR 
     OLD.scheduled_date IS DISTINCT FROM NEW.scheduled_date OR 
     OLD.scheduled_time IS DISTINCT FROM NEW.scheduled_time THEN
    
    INSERT INTO order_history (
      order_id,
      old_status,
      new_status,
      old_scheduled_date,
      new_scheduled_date,
      old_scheduled_time,
      new_scheduled_time,
      changed_by,
      notes
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      OLD.scheduled_date,
      NEW.scheduled_date,
      OLD.scheduled_time,
      NEW.scheduled_time,
      'system',
      CASE 
        WHEN OLD.status IS DISTINCT FROM NEW.status THEN 
          'Status changed from ' || OLD.status || ' to ' || NEW.status
        WHEN OLD.scheduled_date IS DISTINCT FROM NEW.scheduled_date THEN 
          'Rescheduled from ' || OLD.scheduled_date || ' to ' || NEW.scheduled_date
        WHEN OLD.scheduled_time IS DISTINCT FROM NEW.scheduled_time THEN 
          'Time changed from ' || OLD.scheduled_time || ' to ' || NEW.scheduled_time
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION log_order_status_change() IS 'Automatically logs order changes to order_history table';

-- Function: Sync orders_full_view_table with orders data
CREATE OR REPLACE FUNCTION sync_orders_full_view()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO orders_full_view_table
    SELECT 
      o.id,
      o.order_number,
      o.user_id,
      u.name as user_name,
      u.phone_number as user_phone,
      o.address_id,
      a.house_floor,
      a.building_block,
      a.landmark,
      o.is_instant,
      o.scheduled_date,
      o.scheduled_time,
      o.booked_at,
      o.subtotal,
      o.tax,
      o.discount,
      o.total_amount,
      o.status,
      o.payment_status,
      o.payment_method,
      o.special_instructions,
      o.cancellation_reason,
      o.created_at,
      o.updated_at,
      o.confirmed_at,
      o.completed_at,
      o.cancelled_at,
      (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count,
      (SELECT SUM(quantity) FROM order_items WHERE order_id = o.id) as total_items
    FROM orders o
    JOIN users u ON o.user_id = u.id
    JOIN addresses a ON o.address_id = a.id
    WHERE o.id = NEW.id;
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    UPDATE orders_full_view_table
    SET 
      order_number = NEW.order_number,
      is_instant = NEW.is_instant,
      scheduled_date = NEW.scheduled_date,
      scheduled_time = NEW.scheduled_time,
      booked_at = NEW.booked_at,
      subtotal = NEW.subtotal,
      tax = NEW.tax,
      discount = NEW.discount,
      total_amount = NEW.total_amount,
      status = NEW.status,
      payment_status = NEW.payment_status,
      payment_method = NEW.payment_method,
      special_instructions = NEW.special_instructions,
      cancellation_reason = NEW.cancellation_reason,
      updated_at = NEW.updated_at,
      confirmed_at = NEW.confirmed_at,
      completed_at = NEW.completed_at,
      cancelled_at = NEW.cancelled_at
    WHERE id = NEW.id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    DELETE FROM orders_full_view_table WHERE id = OLD.id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sync_orders_full_view() IS 'Automatically syncs orders_full_view_table with orders table changes';

-- ============================================
-- TRIGGERS
-- Database triggers for automation
-- ============================================

-- Trigger: Update updated_at on orders table
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Log order changes
CREATE TRIGGER log_order_changes
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_order_status_change();

-- Trigger: Sync orders_full_view_table on orders changes
CREATE TRIGGER sync_orders_full_view_insert
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION sync_orders_full_view();

CREATE TRIGGER sync_orders_full_view_update
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION sync_orders_full_view();

CREATE TRIGGER sync_orders_full_view_delete
  AFTER DELETE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION sync_orders_full_view();

-- ============================================
-- VIEWS
-- Useful views for querying
-- ============================================

-- View: Orders with full details
CREATE OR REPLACE VIEW orders_full_view AS
SELECT 
  o.id,
  o.order_number,
  o.user_id,
  u.name as user_name,
  u.phone_number as user_phone,
  o.address_id,
  a.house_floor,
  a.building_block,
  a.landmark,
  o.is_instant,
  o.scheduled_date,
  o.scheduled_time,
  o.booked_at,
  o.subtotal,
  o.tax,
  o.discount,
  o.total_amount,
  o.status,
  o.payment_status,
  o.payment_method,
  o.special_instructions,
  o.cancellation_reason,
  o.created_at,
  o.updated_at,
  o.confirmed_at,
  o.completed_at,
  o.cancelled_at,
  (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count,
  (SELECT SUM(quantity) FROM order_items WHERE order_id = o.id) as total_items
FROM orders o
JOIN users u ON o.user_id = u.id
JOIN addresses a ON o.address_id = a.id;

COMMENT ON VIEW orders_full_view IS 'Complete order information with user and address details';

-- ============================================
-- INITIAL DATA
-- Sample/seed data for services
-- ============================================

-- Insert all services
INSERT INTO services (name, icon, color, price, what_we_do, what_we_dont, how_its_done, display_order, is_active) VALUES
(
  'Sweeping',
  '🧹',
  '#4CAF50',
  150.00,
  '["Sweep all floors", "Remove dust and debris", "Clean corners"]'::jsonb,
  '["Move furniture", "Wash floors", "Clean carpets"]'::jsonb,
  'Professional sweeping of all accessible floor areas using quality brooms.',
  1,
  true
),
(
  'Sweeping & Mopping',
  '🧹',
  '#8BC34A',
  250.00,
  '["Sweep floors", "Mop with disinfectant", "Dry floor", "Clean under furniture"]'::jsonb,
  '["Polish floors", "Move heavy items", "Clean walls"]'::jsonb,
  'Complete floor cleaning with sweeping followed by mopping with disinfectant.',
  2,
  true
),
(
  'Dusting',
  '✨',
  '#4CAF50',
  180.00,
  '["Dust all surfaces", "Clean shelves", "Wipe furniture", "Clean decorative items"]'::jsonb,
  '["Move heavy items", "Clean fans", "Wash curtains"]'::jsonb,
  'Thorough dusting of all surfaces and furniture using microfiber cloths.',
  3,
  true
),
(
  'Bathroom',
  '🚿',
  '#E8F5E9',
  300.00,
  '["Clean toilet & sink", "Scrub tiles", "Remove stains", "Disinfect"]'::jsonb,
  '["Repair plumbing", "Clean ceiling", "Replace fixtures"]'::jsonb,
  'Deep cleaning and disinfection of all bathroom surfaces and fixtures.',
  4,
  true
),
(
  'Window',
  '🪟',
  '#03A9F4',
  250.00,
  '["Clean glass", "Remove streaks", "Wipe frames", "Clean sills"]'::jsonb,
  '["Clean exterior high windows", "Repair glass", "Clean curtains"]'::jsonb,
  'Streak-free window cleaning using professional solutions and squeegees.',
  5,
  true
),
(
  'Staircase',
  '🪜',
  '#8BC34A',
  200.00,
  '["Sweep stairs", "Mop steps", "Clean railings", "Remove dust"]'::jsonb,
  '["Repair stairs", "Paint railings", "Move heavy items"]'::jsonb,
  'Complete staircase cleaning including steps, landings, and railings.',
  6,
  true
),
(
  'Utensils',
  '🍽️',
  '#E8F5E9',
  200.00,
  '["Wash utensils", "Clean with soap", "Rinse thoroughly", "Organize"]'::jsonb,
  '["Clean oven items", "Scrub burnt pans", "Clean appliances"]'::jsonb,
  'All dishes and utensils washed, rinsed, and organized in drying rack.',
  7,
  true
),
(
  'Kitchen',
  '🍳',
  '#FFB74D',
  350.00,
  '["Clean countertops", "Wipe cabinets", "Clean stove", "Organize"]'::jsonb,
  '["Clean inside oven", "Defrost fridge", "Clean chimney"]'::jsonb,
  'Complete kitchen surface cleaning with food-safe cleaners and degreasing.',
  8,
  true
),
(
  'Kitchen cleaning',
  '🧽',
  '#FFF59D',
  400.00,
  '["Deep clean kitchen", "Clean appliances", "Sanitize surfaces", "Organize items"]'::jsonb,
  '["Repair appliances", "Clean inside oven", "Paint cabinets"]'::jsonb,
  'Comprehensive kitchen deep cleaning including all surfaces and appliances.',
  9,
  true
);

-- Insert default super admin
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
-- USEFUL QUERIES (Reference)
-- Copy and modify these as needed
-- ============================================

/*
-- Get all active services ordered by display order
SELECT * FROM services 
WHERE is_active = true 
ORDER BY display_order;

-- Get upcoming orders for a user
SELECT * FROM orders 
WHERE user_id = 'USER_ID' 
  AND status IN ('pending', 'confirmed') 
  AND scheduled_date >= CURRENT_DATE 
ORDER BY scheduled_date, scheduled_time;

-- Get completed orders for a user
SELECT * FROM orders 
WHERE user_id = 'USER_ID' 
  AND status = 'completed' 
ORDER BY completed_at DESC;

-- Get cancelled orders for a user
SELECT * FROM orders 
WHERE user_id = 'USER_ID' 
  AND status = 'cancelled' 
ORDER BY cancelled_at DESC;

-- Get order with all items
SELECT 
  o.*,
  json_agg(
    json_build_object(
      'id', oi.id,
      'service_name', oi.service_name,
      'service_icon', oi.service_icon,
      'quantity', oi.quantity,
      'unit_price', oi.unit_price,
      'total_price', oi.total_price
    )
  ) as items
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.id = 'ORDER_ID'
GROUP BY o.id;

-- Get order history/timeline
SELECT * FROM order_history 
WHERE order_id = 'ORDER_ID' 
ORDER BY created_at ASC;

-- Get instant vs scheduled bookings stats
SELECT 
  is_instant,
  COUNT(*) as count,
  SUM(total_amount) as total_revenue,
  AVG(total_amount) as avg_order_value
FROM orders
GROUP BY is_instant;

-- Get today's instant bookings
SELECT * FROM orders
WHERE is_instant = true
  AND DATE(booked_at) = CURRENT_DATE
ORDER BY booked_at DESC;

-- Get user's default address
SELECT * FROM addresses
WHERE user_id = 'USER_ID' 
  AND is_default = true
LIMIT 1;

-- Get all addresses for a user
SELECT * FROM addresses
WHERE user_id = 'USER_ID'
ORDER BY is_default DESC, created_at DESC;

-- Daily order statistics
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_orders,
  COUNT(*) FILTER (WHERE is_instant = true) as instant_orders,
  COUNT(*) FILTER (WHERE is_instant = false) as scheduled_orders,
  SUM(total_amount) as total_revenue,
  AVG(total_amount) as avg_order_value
FROM orders
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Service popularity
SELECT 
  oi.service_name,
  COUNT(*) as times_ordered,
  SUM(oi.quantity) as total_quantity,
  SUM(oi.total_price) as total_revenue
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE o.status != 'cancelled'
GROUP BY oi.service_name
ORDER BY times_ordered DESC;

-- User order history with address
SELECT * FROM orders_full_view
WHERE user_id = 'USER_ID'
ORDER BY created_at DESC;
*/

-- ============================================
-- VERIFICATION QUERIES
-- Run these to verify schema setup
-- ============================================

-- Verify all tables created
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('admins', 'users', 'addresses', 'services', 'orders', 'order_items', 'order_history', 'orders_full_view_table')
ORDER BY tablename;

-- Verify all indexes
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('admins', 'users', 'addresses', 'services', 'orders', 'order_items', 'order_history', 'orders_full_view_table')
ORDER BY tablename, indexname;

-- Verify all functions
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('generate_order_number', 'update_updated_at_column', 'log_order_status_change', 'sync_orders_full_view')
ORDER BY routine_name;

-- Verify all triggers
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Verify all policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Verify services inserted
SELECT 
  COUNT(*) as total_services,
  COUNT(*) FILTER (WHERE is_active = true) as active_services
FROM services;

-- Verify admins inserted
SELECT 
  COUNT(*) as total_admins,
  COUNT(*) FILTER (WHERE is_active = true) as active_admins
FROM admins;

-- Verify admin details
SELECT id, email, name, role, is_active, created_at FROM admins;

-- ============================================
-- DATABASE SETUP COMPLETE
-- ============================================

-- Summary of created objects:
-- Tables: 8 (admins, users, addresses, services, orders, order_items, order_history, orders_full_view_table)
-- Indexes: 25+
-- Functions: 4
-- Triggers: 5
-- Views: 1
-- RLS Policies: 16
-- Initial Services: 9
-- Initial Admins: 1

-- Next steps:
-- 1. Verify all objects created (run verification queries above)
-- 2. Test user signup and login
-- 3. Test address management
-- 4. Test service browsing
-- 5. Test order creation
-- 6. Review and customize as needed

-- ============================================
-- END OF COMPLETE DATABASE SCHEMA
-- ============================================
