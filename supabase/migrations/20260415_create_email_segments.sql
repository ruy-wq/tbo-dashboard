-- ============================================================
-- TBO OS — email_segments table + RLS
-- Feature #89 — Email marketing: segmentação por etapa de funil
-- ============================================================

CREATE TABLE IF NOT EXISTS public.email_segments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,

  -- Regras de segmentação armazenadas como JSONB
  -- Estrutura: { rules: SegmentRule[], match: "all" | "any" }
  -- SegmentRule: { field, operator, value }
  -- Campos suportados: funnel_stage, deal_source, deal_value, tags, created_after, created_before
  rules        JSONB NOT NULL DEFAULT '{"rules":[],"match":"all"}'::jsonb,

  -- Cache de contagem estimada (atualizado via Edge Function ou on-demand)
  estimated_count INTEGER NOT NULL DEFAULT 0,
  last_counted_at TIMESTAMPTZ,

  -- Segmentos estáticos: lista fixa de deal_ids
  -- Segmentos dinâmicos: baseados em rules (default)
  segment_type TEXT NOT NULL DEFAULT 'dynamic' CHECK (segment_type IN ('static', 'dynamic')),

  -- IDs de deals estáticos (quando segment_type = 'static')
  static_deal_ids UUID[] DEFAULT '{}',

  tags         TEXT[] DEFAULT '{}',
  created_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_email_segments_tenant ON public.email_segments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_segments_type   ON public.email_segments(segment_type);
CREATE INDEX IF NOT EXISTS idx_email_segments_tags   ON public.email_segments USING GIN(tags);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_email_segments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS email_segments_updated_at ON public.email_segments;
CREATE TRIGGER email_segments_updated_at
  BEFORE UPDATE ON public.email_segments
  FOR EACH ROW EXECUTE FUNCTION public.set_email_segments_updated_at();

-- RLS
ALTER TABLE public.email_segments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_segments_select" ON public.email_segments;
CREATE POLICY "email_segments_select" ON public.email_segments
  FOR SELECT USING (tenant_id IN (SELECT get_user_tenant_ids()));

DROP POLICY IF EXISTS "email_segments_insert" ON public.email_segments;
CREATE POLICY "email_segments_insert" ON public.email_segments
  FOR INSERT WITH CHECK (tenant_id IN (SELECT get_user_tenant_ids()));

DROP POLICY IF EXISTS "email_segments_update" ON public.email_segments;
CREATE POLICY "email_segments_update" ON public.email_segments
  FOR UPDATE USING (tenant_id IN (SELECT get_user_tenant_ids()));

DROP POLICY IF EXISTS "email_segments_delete" ON public.email_segments;
CREATE POLICY "email_segments_delete" ON public.email_segments
  FOR DELETE USING (tenant_id IN (SELECT get_user_tenant_ids()));

-- Adicionar segment_id na tabela de campanhas
ALTER TABLE public.email_campaigns
  ADD COLUMN IF NOT EXISTS segment_id UUID REFERENCES public.email_segments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_email_campaigns_segment ON public.email_campaigns(segment_id);
