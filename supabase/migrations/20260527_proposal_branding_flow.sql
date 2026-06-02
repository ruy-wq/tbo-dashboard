ALTER TABLE proposals ADD COLUMN IF NOT EXISTS show_branding_flow boolean DEFAULT false;
COMMENT ON COLUMN proposals.show_branding_flow IS 'When true, renders the Branding Fluxo de Projeto section.';
