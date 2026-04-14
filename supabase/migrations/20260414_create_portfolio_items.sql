-- ============================================================================
-- Portfolio Items — centralizador de cases por BU para o comercial
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.portfolio_items (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id     uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  project_id    uuid REFERENCES public.projects(id) ON DELETE SET NULL,

  -- Metadata
  project_name    text,
  client_name     text,
  client_company  text,

  -- Taxonomy
  bu              text NOT NULL,           -- "Digital 3D", "Audiovisual", etc.
  category        text NOT NULL,           -- "Institucional", "Teaser", "Filme", etc.

  -- Content
  title           text NOT NULL,
  description     text,
  thumbnail_url   text,
  media_urls      text[] DEFAULT '{}',     -- array de URLs de mídia
  external_url    text,                    -- link para Vimeo, Drive, etc.

  -- Classification
  year            smallint,
  is_featured     boolean DEFAULT false,
  featured_by     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  tags            text[] DEFAULT '{}',

  -- Audit
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_portfolio_items_tenant
  ON public.portfolio_items(tenant_id);

CREATE INDEX IF NOT EXISTS idx_portfolio_items_bu
  ON public.portfolio_items(bu);

CREATE INDEX IF NOT EXISTS idx_portfolio_items_category
  ON public.portfolio_items(category);

CREATE INDEX IF NOT EXISTS idx_portfolio_items_project
  ON public.portfolio_items(project_id);

CREATE INDEX IF NOT EXISTS idx_portfolio_items_featured
  ON public.portfolio_items(is_featured) WHERE is_featured = true;

-- ── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

-- Todos do tenant podem visualizar
CREATE POLICY "portfolio_items_select"
  ON public.portfolio_items FOR SELECT
  USING (
    tenant_id IN (
      SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

-- Qualquer role pode inserir (produção marca cases)
CREATE POLICY "portfolio_items_insert"
  ON public.portfolio_items FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

-- Apenas quem criou ou roles >= lider podem editar
CREATE POLICY "portfolio_items_update"
  ON public.portfolio_items FOR UPDATE
  USING (
    tenant_id IN (
      SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid()
    )
    AND (
      created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role IN ('founder', 'diretoria', 'lider')
      )
    )
  );

-- Apenas founder/diretoria podem deletar
CREATE POLICY "portfolio_items_delete"
  ON public.portfolio_items FOR DELETE
  USING (
    tenant_id IN (
      SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('founder', 'diretoria')
    )
  );
