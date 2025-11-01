-- ============================================
-- FIX DATABASE ISSUES
-- Date: November 1, 2025
-- ============================================

-- STEP 1: Fix addresses foreign key constraint
-- Remove NOT NULL constraint from user_id to allow flexible address creation
ALTER TABLE addresses ALTER COLUMN user_id DROP NOT NULL;

RAISE NOTICE '✓ Addresses foreign key constraint fixed';

-- STEP 2: Populate orders_full_view_table with existing data if missing
DO $$
DECLARE
  orders_count INTEGER;
  view_table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orders_count FROM orders;
  SELECT COUNT(*) INTO view_table_count FROM orders_full_view_table;
  
  RAISE NOTICE 'Orders table has % records', orders_count;
  RAISE NOTICE 'orders_full_view_table has % records', view_table_count;
  
  -- If orders exist but view table is empty or has fewer records, sync it
  IF orders_count > 0 AND view_table_count < orders_count THEN
    RAISE NOTICE 'Syncing orders_full_view_table...';
    
    -- Clear and repopulate
    DELETE FROM orders_full_view_table;
    
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
    JOIN addresses a ON o.address_id = a.id;
    
    RAISE NOTICE '✓ orders_full_view_table synced successfully';
  ELSE
    RAISE NOTICE '✓ orders_full_view_table already in sync';
  END IF;
END $$;

-- STEP 3: Verify all critical data exists
DO $$
DECLARE
  users_count INTEGER;
  addresses_count INTEGER;
  orders_count INTEGER;
  items_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO users_count FROM users;
  SELECT COUNT(*) INTO addresses_count FROM addresses;
  SELECT COUNT(*) INTO orders_count FROM orders;
  SELECT COUNT(*) INTO items_count FROM order_items;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== DATABASE SUMMARY ===';
  RAISE NOTICE 'Users: %', users_count;
  RAISE NOTICE 'Addresses: %', addresses_count;
  RAISE NOTICE 'Orders: %', orders_count;
  RAISE NOTICE 'Order Items: %', items_count;
  RAISE NOTICE '';
  
  IF orders_count > 0 AND items_count = 0 THEN
    RAISE WARNING '⚠️  Orders exist but no order items found!';
    RAISE WARNING '    Check if order_items are being created when orders are placed';
  END IF;
  
  IF orders_count > 0 THEN
    RAISE NOTICE '✓ Database has order data';
  ELSE
    RAISE WARNING '⚠️  No orders found in database';
  END IF;
END $$;

-- STEP 4: Display sample data for verification
RAISE NOTICE '';
RAISE NOTICE '=== SAMPLE ORDER DATA ===';

SELECT 
  order_number,
  user_name,
  is_instant,
  scheduled_date,
  status,
  item_count,
  total_amount
FROM orders_full_view_table
ORDER BY created_at DESC
LIMIT 3;

-- STEP 5: Display sample order items
RAISE NOTICE '';
RAISE NOTICE '=== SAMPLE ORDER ITEMS ===';

SELECT 
  oi.service_name,
  oi.service_icon,
  oi.quantity,
  oi.unit_price,
  oi.total_price,
  o.order_number
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
ORDER BY oi.created_at DESC
LIMIT 5;

-- ============================================
-- DIAGNOSTICS COMPLETE
-- ============================================

RAISE NOTICE '';
RAISE NOTICE '=== FIX COMPLETE ===';
RAISE NOTICE 'If you see warnings above, please review them';
RAISE NOTICE 'The admin panel should now display service tasks correctly';

