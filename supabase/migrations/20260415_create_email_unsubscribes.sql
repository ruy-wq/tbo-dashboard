-- ============================================================
-- TBO OS — email_unsubscribes table + tracking columns
-- Feature #90 — LGPD: opt-out de email marketing
-- ============================================================

-- Tabela de descadastros (LGPD compliance)
CREATE TABLE IF NOT EXISTS public.email_unsubscribes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  reason       TEXT,
  campaign_id  UUID REFERENCES public.email_campaigns(id) ON DELETE SET NULL,
  unsubscribed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_unsub_unique
  ON public.email_unsubscribes(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_email_unsub_tenant
  ON public.email_unsubscribes(tenant_id);

-- RLS
ALTER TABLE public.email_unsubscribes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_unsub_select" ON public.email_unsubscribes;
CREATE POLICY "email_unsub_select" ON public.email_unsubscribes
  FOR SELECT USING (tenant_id IN (SELECT get_user_tenant_ids()));

-- Insert via Edge Function (service role) — sem policy de insert para anon
-- mas permitir insert público para o link de unsubscribe funcionar
DROP POLICY IF EXISTS "email_unsub_insert_public" ON public.email_unsubscribes;
CREATE POLICY "email_unsub_insert_public" ON public.email_unsubscribes
  FOR INSERT WITH CHECK (true);

-- ── Tracking: adicionar colunas na email_sends para métricas granulares ──

-- Tabela de eventos de tracking (opens, clicks)
CREATE TABLE IF NOT EXISTS public.email_tracking_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  send_id      UUID NOT NULL REFERENCES public.email_sends(id) ON DELETE CASCADE,
  campaign_id  UUID REFERENCES public.email_campaigns(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  event_type   TEXT NOT NULL CHECK (event_type IN ('open', 'click', 'bounce', 'unsubscribe')),
  metadata     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tracking_send    ON public.email_tracking_events(send_id);
CREATE INDEX IF NOT EXISTS idx_tracking_campaign ON public.email_tracking_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_tracking_type    ON public.email_tracking_events(event_type);

-- RLS
ALTER TABLE public.email_tracking_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tracking_select" ON public.email_tracking_events;
CREATE POLICY "tracking_select" ON public.email_tracking_events
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "tracking_insert_public" ON public.email_tracking_events;
CREATE POLICY "tracking_insert_public" ON public.email_tracking_events
  FOR INSERT WITH CHECK (true);
