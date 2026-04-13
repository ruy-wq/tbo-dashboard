-- Add per-proposal discount percentage columns
-- package_discount_pct: stores selected package discount (0, 5, or 8)
-- cash_discount_pct: stores cash payment discount (default 5%)
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS package_discount_pct numeric DEFAULT 0;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS cash_discount_pct numeric DEFAULT 5;
