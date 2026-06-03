ALTER TABLE proposals ADD COLUMN IF NOT EXISTS show_marketing_flow boolean DEFAULT false;
COMMENT ON COLUMN proposals.show_marketing_flow IS 'When true, renders the Marketing Fluxo de Projeto section.';
