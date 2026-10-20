ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;
UPDATE orders SET delivered_at = updated_at WHERE status = 'DELIVERED' AND delivered_at IS NULL;
ALTER TABLE return_requests ADD COLUMN IF NOT EXISTS reason TEXT NOT NULL DEFAULT 'Other';
