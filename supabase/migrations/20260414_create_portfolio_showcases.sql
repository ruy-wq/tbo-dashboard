-- ============================================================================
-- Portfolio Showcases — links publicos compartilhaveis de cases
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.portfolio_showcases (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  token           text NOT NULL UNIQUE,
  title           text NOT NULL,
  description     text,
  item_ids        uuid[] NOT NULL DEFAULT '{}',
  accent_color    text DEFAULT '#E85102',
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  access_count    integer DEFAULT 0,
  first_accessed_at timestamptz,
  last_accessed_at  timestamptz,
  expires_at      timestamptz,
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_showcases_token ON public.portfolio_showcases(token);
CREATE INDEX IF NOT EXISTS idx_portfolio_showcases_tenant ON public.portfolio_showcases(tenant_id);

ALTER TABLE public.portfolio_showcases ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode ver showcases ativos (pagina publica) + membros do tenant
CREATE POLICY "portfolio_showcases_select" ON public.portfolio_showcases FOR SELECT
  USING (
    tenant_id IN (SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid())
    OR is_active = true
  );

CREATE POLICY "portfolio_showcases_insert" ON public.portfolio_showcases FOR INSERT
  WITH CHECK (tenant_id IN (SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid()));

CREATE POLICY "portfolio_showcases_update" ON public.portfolio_showcases FOR UPDATE
  USING (
    tenant_id IN (SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid())
    OR is_active = true
  );

CREATE POLICY "portfolio_showcases_delete" ON public.portfolio_showcases FOR DELETE
  USING (
    tenant_id IN (SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('founder', 'diretoria'))
  );
