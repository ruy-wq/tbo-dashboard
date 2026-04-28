-- Add optional add-ons / extended purchase section per proposal
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS addons jsonb DEFAULT NULL;
COMMENT ON COLUMN proposals.addons IS 'Optional add-ons / extended purchase section. JSON: { section_title, section_description, options: [{id, label, from_price, to_price, description, recommended}] }';
