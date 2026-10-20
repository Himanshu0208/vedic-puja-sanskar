ALTER TABLE return_requests
  ADD COLUMN IF NOT EXISTS manual_refund_reference TEXT,
  ADD COLUMN IF NOT EXISTS refund_processed_at TIMESTAMP;
