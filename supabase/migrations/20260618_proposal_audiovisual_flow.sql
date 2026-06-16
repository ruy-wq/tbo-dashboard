ALTER TABLE proposals ADD COLUMN IF NOT EXISTS show_audiovisual_flow boolean DEFAULT false;
COMMENT ON COLUMN proposals.show_audiovisual_flow IS 'When true, renders the Audiovisual Fluxo de Projeto section.';
