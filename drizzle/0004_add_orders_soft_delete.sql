-- Add soft-delete column to orders table
ALTER TABLE orders ADD COLUMN deleted_at timestamp;
