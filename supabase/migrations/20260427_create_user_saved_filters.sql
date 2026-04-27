-- ============================================================================
-- user_saved_filters
-- Permite cada usuário salvar combinações de filtros por módulo.
-- Inicialmente usado em /comercial/leads, mas a coluna `module` permite expansão.
-- RLS: cada usuário vê e gerencia somente os próprios filtros, dentro do tenant ativo.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_saved_filters (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id   uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  module      text        NOT NULL DEFAULT 'leads',
  name        text        NOT NULL,
  filters     jsonb       NOT NULL,
  is_pinned   boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_saved_filters_user_module
  ON public.user_saved_filters(user_id, module, tenant_id);

CREATE INDEX IF NOT EXISTS idx_user_saved_filters_pinned
  ON public.user_saved_filters(user_id, module, tenant_id)
  WHERE is_pinned = true;

ALTER TABLE public.user_saved_filters ENABLE ROW LEVEL SECURITY;

-- Nota: usamos subquery em tenant_members em vez de get_user_tenant_ids() porque
-- Postgres não permite SETOF functions em policy expressions.
CREATE POLICY "user_saved_filters_owner_read"
  ON public.user_saved_filters FOR SELECT
  USING (
    user_id = auth.uid()
    AND tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid())
  );

CREATE POLICY "user_saved_filters_owner_write"
  ON public.user_saved_filters FOR ALL
  USING (
    user_id = auth.uid()
    AND tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid())
  )
  WITH CHECK (
    user_id = auth.uid()
    AND tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid())
  );

CREATE OR REPLACE FUNCTION public.trg_user_saved_filters_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_user_saved_filters_updated_at ON public.user_saved_filters;
CREATE TRIGGER set_user_saved_filters_updated_at
  BEFORE UPDATE ON public.user_saved_filters
  FOR EACH ROW EXECUTE FUNCTION public.trg_user_saved_filters_updated_at();
