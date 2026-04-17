-- ============================================================================
-- Email Cadences — sistema de cadência de e-mail por etapa do funil
--
-- Estrutura (4 tabelas):
--   cadences              — templates de cadência (Notion ou custom do tenant)
--   cadence_steps         — e-mails individuais de cada cadência
--   cadence_enrollments   — matrículas de deals em cadências
--   cadence_sends         — envios individuais (cada step de um enrollment)
--
-- Regra: disparo MANUAL. O usuário avança cada step clicando na UI.
-- Não há cron automático. Geração de draft via IA + envio via Mailchimp.
-- ============================================================================

-- ── cadences ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cadences (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id             uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  -- tenant_id NULL = template sistema (Notion), compartilhado entre tenants
  slug                  text NOT NULL,
  name                  text NOT NULL,
  description           text,
  stage_trigger         text NOT NULL,
  -- mapeia pro stage do crm_deals (lead, qualificacao, proposta, negociacao, fechado_ganho, fechado_perdido)
  bu                    text,
  -- null ou uma das BUs (Digital 3D, Branding, Marketing, Audiovisual, Experiências Imersivas, Lançamento Completo)
  default_interval_days integer NOT NULL DEFAULT 7,
  is_active             boolean NOT NULL DEFAULT true,
  is_system             boolean NOT NULL DEFAULT false,
  -- system = template do Notion, não pode ser deletado
  source                text NOT NULL DEFAULT 'custom',
  -- 'notion' | 'custom'
  source_url            text,
  created_by            uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now(),
  CONSTRAINT cadences_slug_unique UNIQUE (slug)
);

CREATE INDEX IF NOT EXISTS idx_cadences_tenant
  ON public.cadences(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cadences_stage
  ON public.cadences(stage_trigger, is_active);

-- ── cadence_steps ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cadence_steps (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cadence_id            uuid NOT NULL REFERENCES public.cadences(id) ON DELETE CASCADE,
  step_order            integer NOT NULL,
  name                  text NOT NULL,
  subject_template      text NOT NULL,
  body_template         text NOT NULL,
  objective             text,
  role                  text,
  -- descompressao | ponto_cego | quebra | impacto | autoridade | portfolio | abertura | aprofundar | reposicionar | integracao | case | imersivo | diagnostico | reativacao
  days_from_previous    integer NOT NULL DEFAULT 0,
  -- offset em dias do step anterior (primeiro step = 0)
  angles                jsonb DEFAULT '{}'::jsonb,
  -- metadados: psicologia, objeção, insight central, etc
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now(),
  CONSTRAINT cadence_steps_order_unique UNIQUE (cadence_id, step_order)
);

CREATE INDEX IF NOT EXISTS idx_cadence_steps_cadence
  ON public.cadence_steps(cadence_id, step_order);

-- ── cadence_enrollments ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cadence_enrollments (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id             uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  deal_id               uuid NOT NULL REFERENCES public.crm_deals(id) ON DELETE CASCADE,
  cadence_id            uuid NOT NULL REFERENCES public.cadences(id) ON DELETE RESTRICT,
  current_step_order    integer NOT NULL DEFAULT 1,
  status                text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  enrolled_by           uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  enrolled_at           timestamptz DEFAULT now(),
  paused_at             timestamptz,
  completed_at          timestamptz,
  cancelled_at          timestamptz,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

-- Só uma matrícula ativa/pausada por deal+cadência
CREATE UNIQUE INDEX IF NOT EXISTS idx_cadence_enrollments_active_unique
  ON public.cadence_enrollments(deal_id, cadence_id)
  WHERE status IN ('active', 'paused');

CREATE INDEX IF NOT EXISTS idx_cadence_enrollments_deal
  ON public.cadence_enrollments(deal_id, status);
CREATE INDEX IF NOT EXISTS idx_cadence_enrollments_tenant_status
  ON public.cadence_enrollments(tenant_id, status);

-- ── cadence_sends ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cadence_sends (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id             uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  enrollment_id         uuid NOT NULL REFERENCES public.cadence_enrollments(id) ON DELETE CASCADE,
  step_id               uuid NOT NULL REFERENCES public.cadence_steps(id) ON DELETE RESTRICT,
  step_order            integer NOT NULL,
  status                text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'failed', 'skipped')),
  final_subject         text,
  final_body            text,
  mailchimp_campaign_id text,
  generated_draft_id    uuid REFERENCES public.ai_email_drafts(id) ON DELETE SET NULL,
  sent_at               timestamptz,
  opened_at             timestamptz,
  clicked_at            timestamptz,
  replied_at            timestamptz,
  error_message         text,
  sent_by               uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cadence_sends_enrollment
  ON public.cadence_sends(enrollment_id, step_order);
CREATE INDEX IF NOT EXISTS idx_cadence_sends_status
  ON public.cadence_sends(status, tenant_id);

-- ── Trigger updated_at ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cadences_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER cadences_updated_at BEFORE UPDATE ON public.cadences
  FOR EACH ROW EXECUTE FUNCTION public.cadences_set_updated_at();
CREATE TRIGGER cadence_steps_updated_at BEFORE UPDATE ON public.cadence_steps
  FOR EACH ROW EXECUTE FUNCTION public.cadences_set_updated_at();
CREATE TRIGGER cadence_enrollments_updated_at BEFORE UPDATE ON public.cadence_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.cadences_set_updated_at();
CREATE TRIGGER cadence_sends_updated_at BEFORE UPDATE ON public.cadence_sends
  FOR EACH ROW EXECUTE FUNCTION public.cadences_set_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────
ALTER TABLE public.cadences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cadence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cadence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cadence_sends ENABLE ROW LEVEL SECURITY;

-- cadences: SELECT — system (tenant_id null) OU próprio tenant
CREATE POLICY "cadences_select" ON public.cadences FOR SELECT
  USING (
    tenant_id IS NULL
    OR tenant_id IN (SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid())
  );

-- cadences: INSERT/UPDATE/DELETE — só em próprio tenant, nunca system
CREATE POLICY "cadences_insert" ON public.cadences FOR INSERT
  WITH CHECK (
    tenant_id IS NOT NULL
    AND tenant_id IN (SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid())
  );

CREATE POLICY "cadences_update" ON public.cadences FOR UPDATE
  USING (
    tenant_id IS NOT NULL
    AND tenant_id IN (SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid())
    AND is_system = false
  );

CREATE POLICY "cadences_delete" ON public.cadences FOR DELETE
  USING (
    tenant_id IS NOT NULL
    AND tenant_id IN (SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid())
    AND is_system = false
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('founder', 'diretoria'))
  );

-- cadence_steps: herda acesso do parent cadences
CREATE POLICY "cadence_steps_select" ON public.cadence_steps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cadences c
      WHERE c.id = cadence_id
        AND (c.tenant_id IS NULL OR c.tenant_id IN (SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid()))
    )
  );

CREATE POLICY "cadence_steps_modify" ON public.cadence_steps FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.cadences c
      WHERE c.id = cadence_id
        AND c.tenant_id IS NOT NULL
        AND c.tenant_id IN (SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid())
        AND c.is_system = false
    )
  );

-- cadence_enrollments: próprio tenant
CREATE POLICY "cadence_enrollments_select" ON public.cadence_enrollments FOR SELECT
  USING (tenant_id IN (SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid()));

CREATE POLICY "cadence_enrollments_insert" ON public.cadence_enrollments FOR INSERT
  WITH CHECK (tenant_id IN (SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid()));

CREATE POLICY "cadence_enrollments_update" ON public.cadence_enrollments FOR UPDATE
  USING (tenant_id IN (SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid()));

CREATE POLICY "cadence_enrollments_delete" ON public.cadence_enrollments FOR DELETE
  USING (
    tenant_id IN (SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('founder', 'diretoria', 'lider'))
  );

-- cadence_sends: próprio tenant
CREATE POLICY "cadence_sends_select" ON public.cadence_sends FOR SELECT
  USING (tenant_id IN (SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid()));

CREATE POLICY "cadence_sends_insert" ON public.cadence_sends FOR INSERT
  WITH CHECK (tenant_id IN (SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid()));

CREATE POLICY "cadence_sends_update" ON public.cadence_sends FOR UPDATE
  USING (tenant_id IN (SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid()));
