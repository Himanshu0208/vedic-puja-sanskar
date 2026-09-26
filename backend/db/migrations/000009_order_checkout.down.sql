CREATE TYPE payment_method AS ENUM ('CARD', 'UPI', 'NETBANKING', 'WALLET', 'COD');
CREATE TYPE payment_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');
CREATE TYPE order_status AS ENUM ('placed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned');

DROP INDEX IF EXISTS payments_razorpay_payment_id_unique;
DROP INDEX IF EXISTS payments_razorpay_order_id_unique;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_method_check;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;

ALTER TABLE payments ALTER COLUMN method TYPE payment_method USING CASE method
  WHEN 'COD' THEN 'COD'::payment_method
  ELSE 'CARD'::payment_method
END;
ALTER TABLE payments ALTER COLUMN status DROP DEFAULT;
ALTER TABLE payments ALTER COLUMN status TYPE payment_status USING UPPER(status)::payment_status;
ALTER TABLE payments ALTER COLUMN status SET DEFAULT 'PENDING';

ALTER TABLE order_items DROP COLUMN IF EXISTS discounted_unit_price;
ALTER TABLE order_items DROP COLUMN IF EXISTS product_name;
ALTER TABLE order_items RENAME COLUMN unit_price TO amount;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_return_status_check;
ALTER TABLE orders ALTER COLUMN status DROP DEFAULT;
ALTER TABLE orders ALTER COLUMN status TYPE order_status USING CASE status
  WHEN 'CANCELLED' THEN 'cancelled'::order_status
  WHEN 'DELIVERED' THEN 'delivered'::order_status
  WHEN 'SHIPPED' THEN 'shipped'::order_status
  WHEN 'RTO' THEN 'shipped'::order_status
  ELSE 'placed'::order_status
END;
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'placed';
ALTER TABLE orders RENAME COLUMN total_amount TO total_price;
ALTER TABLE orders RENAME COLUMN discount_amount TO discount_price;
ALTER TABLE orders DROP COLUMN IF EXISTS subtotal_amount;
ALTER TABLE orders DROP COLUMN IF EXISTS currency;
ALTER TABLE orders DROP COLUMN IF EXISTS return_status;
ALTER TABLE orders DROP COLUMN IF EXISTS shipping_full_name;
ALTER TABLE orders DROP COLUMN IF EXISTS shipping_phone;
ALTER TABLE orders DROP COLUMN IF EXISTS shipping_line1;
ALTER TABLE orders DROP COLUMN IF EXISTS shipping_line2;
ALTER TABLE orders DROP COLUMN IF EXISTS shipping_city;
ALTER TABLE orders DROP COLUMN IF EXISTS shipping_state;
ALTER TABLE orders DROP COLUMN IF EXISTS shipping_postal_code;
ALTER TABLE orders DROP COLUMN IF EXISTS shipping_country;
