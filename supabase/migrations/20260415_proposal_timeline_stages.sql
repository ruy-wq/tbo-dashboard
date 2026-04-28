-- Add customizable timeline stages per proposal
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS timeline_stages jsonb DEFAULT NULL;
COMMENT ON COLUMN proposals.timeline_stages IS 'Custom timeline stages JSON array. Each element: {week, label, description, color}. NULL = use default 10-week timeline.';
