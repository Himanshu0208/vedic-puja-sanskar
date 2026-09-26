ALTER TABLE orders RENAME COLUMN total_price TO total_amount;
ALTER TABLE orders RENAME COLUMN discount_price TO discount_amount;
UPDATE orders SET discount_amount = COALESCE(discount_amount, 0);
ALTER TABLE orders ADD COLUMN subtotal_amount DECIMAL(10, 2) NOT NULL DEFAULT 0;
UPDATE orders SET subtotal_amount = total_amount + discount_amount;
ALTER TABLE orders ADD COLUMN currency CHAR(3) NOT NULL DEFAULT 'INR';
ALTER TABLE orders ADD COLUMN return_status TEXT;
ALTER TABLE orders ADD COLUMN shipping_full_name TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN shipping_phone TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN shipping_line1 TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN shipping_line2 TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN shipping_city TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN shipping_state TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN shipping_postal_code TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN shipping_country CHAR(2) NOT NULL DEFAULT 'IN';

ALTER TABLE orders ALTER COLUMN status DROP DEFAULT;
ALTER TABLE orders ALTER COLUMN status TYPE TEXT USING CASE LOWER(status::text)
  WHEN 'placed' THEN 'PLACED'
  WHEN 'processing' THEN 'PROCESSING'
  WHEN 'shipped' THEN 'SHIPPED'
  WHEN 'delivered' THEN 'DELIVERED'
  WHEN 'cancelled' THEN 'CANCELLED'
  WHEN 'returned' THEN 'DELIVERED'
  ELSE UPPER(status::text)
END;
DROP TYPE order_status;
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'PENDING_PAYMENT';
ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN (
  'PENDING_PAYMENT', 'PLACED', 'PROCESSING', 'PACKED', 'SHIPPED',
  'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RTO'
));
ALTER TABLE orders ADD CONSTRAINT orders_return_status_check CHECK (return_status IS NULL OR return_status IN (
  'RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURN_PICKED', 'RETURN_COMPLETED', 'RETURN_REJECTED'
));

ALTER TABLE order_items RENAME COLUMN amount TO unit_price;
ALTER TABLE order_items ADD COLUMN product_name TEXT NOT NULL DEFAULT '';
ALTER TABLE order_items ADD COLUMN discounted_unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0;
UPDATE order_items oi
SET product_name = p.name,
    discounted_unit_price = CASE
      WHEN p.offer_price > 0 AND p.offer_price < p.selling_price THEN p.offer_price
      ELSE p.selling_price
    END
FROM products p
WHERE p.id = oi.product_id;

ALTER TABLE payments ALTER COLUMN method TYPE TEXT USING CASE UPPER(method::text)
  WHEN 'COD' THEN 'COD'
  ELSE 'RAZORPAY'
END;
ALTER TABLE payments ALTER COLUMN status DROP DEFAULT;
ALTER TABLE payments ALTER COLUMN status TYPE TEXT USING LOWER(status::text);
DROP TYPE payment_method;
DROP TYPE payment_status;
ALTER TABLE payments ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE payments ADD CONSTRAINT payments_method_check CHECK (method IN ('RAZORPAY', 'COD'));
ALTER TABLE payments ADD CONSTRAINT payments_status_check CHECK (status IN ('pending', 'success', 'failed', 'refunded'));
CREATE UNIQUE INDEX payments_razorpay_order_id_unique
  ON payments(razorpay_order_id) WHERE razorpay_order_id IS NOT NULL;
CREATE UNIQUE INDEX payments_razorpay_payment_id_unique
  ON payments(razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL;
