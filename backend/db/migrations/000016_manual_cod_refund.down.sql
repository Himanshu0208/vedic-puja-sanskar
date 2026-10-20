ALTER TABLE return_requests
  DROP COLUMN IF EXISTS manual_refund_reference,
  DROP COLUMN IF EXISTS refund_processed_at;
