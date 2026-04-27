-- ============================================================================
-- Extrai dados embutidos no campo `notes` para colunas reais em crm_deals.
-- Backfill dos 1842 leads importados em 2026-04 (Base_Unificada + TBO Radar v2).
--
-- Notes formato: "St:X|BU:Y|Porte:Z|Pad:W|T:V|Cargo:C|Score:N|F:src1,src2"
--
-- Colunas adicionadas:
--   uf, bu, porte, padrao, temperatura, cargo, status_funil  (text)
--   radar_score (numeric)
--   is_radar    (boolean)
--
-- Índices criados nas colunas filtradas via UI:
--   uf, bu, porte, padrao, temperatura, is_radar, radar_score
-- ============================================================================

-- ── Funções utilitárias ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.parse_note_field(p_notes text, p_field text)
RETURNS text
LANGUAGE sql IMMUTABLE
AS $$
  SELECT NULLIF(
    substring(p_notes FROM ('(?:^|\|)' || p_field || ':([^|]*)')),
    ''
  );
$$;

CREATE OR REPLACE FUNCTION public.ddd_to_uf(p_phone text)
RETURNS text
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE substring(p_phone FROM '\(?(\d{2})\)?')
    WHEN '11' THEN 'SP' WHEN '12' THEN 'SP' WHEN '13' THEN 'SP' WHEN '14' THEN 'SP'
    WHEN '15' THEN 'SP' WHEN '16' THEN 'SP' WHEN '17' THEN 'SP' WHEN '18' THEN 'SP' WHEN '19' THEN 'SP'
    WHEN '21' THEN 'RJ' WHEN '22' THEN 'RJ' WHEN '24' THEN 'RJ'
    WHEN '27' THEN 'ES' WHEN '28' THEN 'ES'
    WHEN '31' THEN 'MG' WHEN '32' THEN 'MG' WHEN '33' THEN 'MG' WHEN '34' THEN 'MG'
    WHEN '35' THEN 'MG' WHEN '37' THEN 'MG' WHEN '38' THEN 'MG'
    WHEN '41' THEN 'PR' WHEN '42' THEN 'PR' WHEN '43' THEN 'PR' WHEN '44' THEN 'PR'
    WHEN '45' THEN 'PR' WHEN '46' THEN 'PR'
    WHEN '47' THEN 'SC' WHEN '48' THEN 'SC' WHEN '49' THEN 'SC'
    WHEN '51' THEN 'RS' WHEN '53' THEN 'RS' WHEN '54' THEN 'RS' WHEN '55' THEN 'RS'
    WHEN '61' THEN 'DF'
    WHEN '62' THEN 'GO' WHEN '64' THEN 'GO'
    WHEN '63' THEN 'TO'
    WHEN '65' THEN 'MT' WHEN '66' THEN 'MT'
    WHEN '67' THEN 'MS'
    WHEN '68' THEN 'AC'
    WHEN '69' THEN 'RO'
    WHEN '71' THEN 'BA' WHEN '73' THEN 'BA' WHEN '74' THEN 'BA'
    WHEN '75' THEN 'BA' WHEN '77' THEN 'BA'
    WHEN '79' THEN 'SE'
    WHEN '81' THEN 'PE' WHEN '87' THEN 'PE'
    WHEN '82' THEN 'AL'
    WHEN '83' THEN 'PB'
    WHEN '84' THEN 'RN'
    WHEN '85' THEN 'CE' WHEN '88' THEN 'CE'
    WHEN '86' THEN 'PI' WHEN '89' THEN 'PI'
    WHEN '91' THEN 'PA' WHEN '93' THEN 'PA' WHEN '94' THEN 'PA'
    WHEN '92' THEN 'AM' WHEN '97' THEN 'AM'
    WHEN '95' THEN 'RR'
    WHEN '96' THEN 'AP'
    WHEN '98' THEN 'MA' WHEN '99' THEN 'MA'
    ELSE NULL
  END;
$$;

-- ── Colunas novas ───────────────────────────────────────────────────────────

ALTER TABLE public.crm_deals
  ADD COLUMN IF NOT EXISTS uf            text,
  ADD COLUMN IF NOT EXISTS bu            text,
  ADD COLUMN IF NOT EXISTS porte         text,
  ADD COLUMN IF NOT EXISTS padrao        text,
  ADD COLUMN IF NOT EXISTS temperatura   text,
  ADD COLUMN IF NOT EXISTS cargo         text,
  ADD COLUMN IF NOT EXISTS status_funil  text,
  ADD COLUMN IF NOT EXISTS radar_score   numeric,
  ADD COLUMN IF NOT EXISTS is_radar      boolean NOT NULL DEFAULT false;

-- ── Backfill ────────────────────────────────────────────────────────────────

UPDATE public.crm_deals
SET
  status_funil = COALESCE(status_funil, public.parse_note_field(notes, 'St')),
  bu           = COALESCE(bu,           public.parse_note_field(notes, 'BU')),
  porte        = COALESCE(porte,        public.parse_note_field(notes, 'Porte')),
  padrao       = COALESCE(padrao,       public.parse_note_field(notes, 'Pad')),
  temperatura  = COALESCE(temperatura,  public.parse_note_field(notes, 'T')),
  cargo        = COALESCE(cargo,        public.parse_note_field(notes, 'Cargo')),
  radar_score  = COALESCE(radar_score, NULLIF(public.parse_note_field(notes, 'Score'), '')::numeric),
  is_radar     = COALESCE(public.parse_note_field(notes, 'F') ILIKE '%radar%', false),
  uf           = COALESCE(uf, public.ddd_to_uf(contact_phone))
WHERE notes IS NOT NULL OR contact_phone IS NOT NULL;

-- ── Trigger: manter is_radar sincronizado ──────────────────────────────────

CREATE OR REPLACE FUNCTION public.trg_crm_deals_sync_is_radar()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Recalcula is_radar a partir de notes ou source quando mudam
  NEW.is_radar := COALESCE(
    (NEW.notes IS NOT NULL AND public.parse_note_field(NEW.notes, 'F') ILIKE '%radar%')
    OR (NEW.source IS NOT NULL AND NEW.source ILIKE '%radar%'),
    false
  );
  -- Se uf não foi setado mas há telefone, infere do DDD
  IF NEW.uf IS NULL AND NEW.contact_phone IS NOT NULL THEN
    NEW.uf := public.ddd_to_uf(NEW.contact_phone);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_crm_deals_lead_data ON public.crm_deals;
CREATE TRIGGER sync_crm_deals_lead_data
  BEFORE INSERT OR UPDATE OF notes, source, contact_phone, uf
  ON public.crm_deals
  FOR EACH ROW EXECUTE FUNCTION public.trg_crm_deals_sync_is_radar();

-- ── Índices ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_crm_deals_uf          ON public.crm_deals(tenant_id, uf)          WHERE uf IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_deals_bu          ON public.crm_deals(tenant_id, bu)          WHERE bu IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_deals_porte       ON public.crm_deals(tenant_id, porte)       WHERE porte IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_deals_padrao      ON public.crm_deals(tenant_id, padrao)      WHERE padrao IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_deals_temperatura ON public.crm_deals(tenant_id, temperatura) WHERE temperatura IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_deals_is_radar    ON public.crm_deals(tenant_id, is_radar)    WHERE is_radar = true;
CREATE INDEX IF NOT EXISTS idx_crm_deals_radar_score ON public.crm_deals(tenant_id, radar_score) WHERE radar_score IS NOT NULL;
