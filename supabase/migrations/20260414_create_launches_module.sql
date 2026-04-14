-- ============================================================================
-- Module: Lançamentos Imobiliários (STRUX-inspired)
-- 3 sistemas: Estratégico, Operacional, Indicadores
-- 7 fases com gates de passagem
-- ============================================================================

-- ── launches: Entidade principal do lançamento ─────────────────────────────
CREATE TABLE IF NOT EXISTS launches (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL,
  name          text NOT NULL,
  description   text,

  -- Sistema Estratégico
  target_vgv       numeric DEFAULT 0,
  target_units     integer DEFAULT 0,
  location         text,
  persona          text,
  positioning      text,
  pricing_strategy text,
  commercial_policy text,
  commission_structure text,
  market_diagnosis text,
  investment_thesis text,

  -- Sistema Operacional
  current_phase    integer DEFAULT 1 CHECK (current_phase BETWEEN 1 AND 7),
  overall_progress numeric DEFAULT 0 CHECK (overall_progress BETWEEN 0 AND 100),

  -- Sistema de Indicadores (snapshot)
  actual_vgv       numeric DEFAULT 0,
  units_sold       integer DEFAULT 0,
  cac              numeric DEFAULT 0,
  conversion_rate  numeric DEFAULT 0,

  -- Meta
  status      text DEFAULT 'planning'
              CHECK (status IN ('planning', 'active', 'paused', 'completed', 'cancelled')),
  start_date  date,
  target_date date,
  cover_url   text,
  created_by  uuid,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- ── launch_phases: 7 fases por lançamento ──────────────────────────────────
CREATE TABLE IF NOT EXISTS launch_phases (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  launch_id       uuid NOT NULL REFERENCES launches(id) ON DELETE CASCADE,
  phase_number    integer NOT NULL CHECK (phase_number BETWEEN 1 AND 7),
  name            text NOT NULL,
  description     text,
  status          text DEFAULT 'pending'
                  CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')),
  progress        numeric DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  started_at      timestamptz,
  completed_at    timestamptz,
  gate_approved   boolean DEFAULT false,
  gate_approved_by uuid,
  gate_approved_at timestamptz,
  gate_notes      text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE(launch_id, phase_number)
);

-- ── launch_phase_items: Checklist por fase ─────────────────────────────────
CREATE TABLE IF NOT EXISTS launch_phase_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id     uuid NOT NULL REFERENCES launch_phases(id) ON DELETE CASCADE,
  title        text NOT NULL,
  description  text,
  is_required  boolean DEFAULT true,
  is_completed boolean DEFAULT false,
  completed_by uuid,
  completed_at timestamptz,
  sort_order   integer DEFAULT 0,
  created_at   timestamptz DEFAULT now()
);

-- ── launch_kpis: Indicadores por lançamento/fase ───────────────────────────
CREATE TABLE IF NOT EXISTS launch_kpis (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  launch_id       uuid NOT NULL REFERENCES launches(id) ON DELETE CASCADE,
  phase_number    integer CHECK (phase_number BETWEEN 1 AND 7),
  name            text NOT NULL,
  category        text NOT NULL
                  CHECK (category IN ('conversion', 'financial', 'operational', 'engagement')),
  target_value    numeric,
  current_value   numeric DEFAULT 0,
  unit            text DEFAULT '',
  trend           text DEFAULT 'stable' CHECK (trend IN ('up', 'down', 'stable')),
  alert_threshold numeric,
  is_alert        boolean DEFAULT false,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ── Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_launches_tenant ON launches(tenant_id);
CREATE INDEX IF NOT EXISTS idx_launches_status ON launches(status);
CREATE INDEX IF NOT EXISTS idx_launch_phases_launch ON launch_phases(launch_id);
CREATE INDEX IF NOT EXISTS idx_launch_phase_items_phase ON launch_phase_items(phase_id);
CREATE INDEX IF NOT EXISTS idx_launch_kpis_launch ON launch_kpis(launch_id);

-- ── RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE launches ENABLE ROW LEVEL SECURITY;
ALTER TABLE launch_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE launch_phase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE launch_kpis ENABLE ROW LEVEL SECURITY;

-- Policies: tenant isolation
CREATE POLICY "launches_tenant_select" ON launches
  FOR SELECT USING (tenant_id = (SELECT raw_app_meta_data->>'tenant_id' FROM auth.users WHERE id = auth.uid())::uuid);

CREATE POLICY "launches_tenant_insert" ON launches
  FOR INSERT WITH CHECK (tenant_id = (SELECT raw_app_meta_data->>'tenant_id' FROM auth.users WHERE id = auth.uid())::uuid);

CREATE POLICY "launches_tenant_update" ON launches
  FOR UPDATE USING (tenant_id = (SELECT raw_app_meta_data->>'tenant_id' FROM auth.users WHERE id = auth.uid())::uuid);

CREATE POLICY "launches_tenant_delete" ON launches
  FOR DELETE USING (tenant_id = (SELECT raw_app_meta_data->>'tenant_id' FROM auth.users WHERE id = auth.uid())::uuid);

-- Phases inherit from launch
CREATE POLICY "launch_phases_select" ON launch_phases
  FOR SELECT USING (
    launch_id IN (SELECT id FROM launches WHERE tenant_id = (SELECT raw_app_meta_data->>'tenant_id' FROM auth.users WHERE id = auth.uid())::uuid)
  );

CREATE POLICY "launch_phases_insert" ON launch_phases
  FOR INSERT WITH CHECK (
    launch_id IN (SELECT id FROM launches WHERE tenant_id = (SELECT raw_app_meta_data->>'tenant_id' FROM auth.users WHERE id = auth.uid())::uuid)
  );

CREATE POLICY "launch_phases_update" ON launch_phases
  FOR UPDATE USING (
    launch_id IN (SELECT id FROM launches WHERE tenant_id = (SELECT raw_app_meta_data->>'tenant_id' FROM auth.users WHERE id = auth.uid())::uuid)
  );

CREATE POLICY "launch_phases_delete" ON launch_phases
  FOR DELETE USING (
    launch_id IN (SELECT id FROM launches WHERE tenant_id = (SELECT raw_app_meta_data->>'tenant_id' FROM auth.users WHERE id = auth.uid())::uuid)
  );

-- Phase items inherit from phase -> launch
CREATE POLICY "launch_phase_items_select" ON launch_phase_items
  FOR SELECT USING (
    phase_id IN (
      SELECT lp.id FROM launch_phases lp
      JOIN launches l ON l.id = lp.launch_id
      WHERE l.tenant_id = (SELECT raw_app_meta_data->>'tenant_id' FROM auth.users WHERE id = auth.uid())::uuid
    )
  );

CREATE POLICY "launch_phase_items_modify" ON launch_phase_items
  FOR ALL USING (
    phase_id IN (
      SELECT lp.id FROM launch_phases lp
      JOIN launches l ON l.id = lp.launch_id
      WHERE l.tenant_id = (SELECT raw_app_meta_data->>'tenant_id' FROM auth.users WHERE id = auth.uid())::uuid
    )
  );

-- KPIs inherit from launch
CREATE POLICY "launch_kpis_select" ON launch_kpis
  FOR SELECT USING (
    launch_id IN (SELECT id FROM launches WHERE tenant_id = (SELECT raw_app_meta_data->>'tenant_id' FROM auth.users WHERE id = auth.uid())::uuid)
  );

CREATE POLICY "launch_kpis_modify" ON launch_kpis
  FOR ALL USING (
    launch_id IN (SELECT id FROM launches WHERE tenant_id = (SELECT raw_app_meta_data->>'tenant_id' FROM auth.users WHERE id = auth.uid())::uuid)
  );

-- ── Trigger: updated_at ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_launches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_launches_updated_at
  BEFORE UPDATE ON launches
  FOR EACH ROW EXECUTE FUNCTION update_launches_updated_at();

CREATE TRIGGER trg_launch_phases_updated_at
  BEFORE UPDATE ON launch_phases
  FOR EACH ROW EXECUTE FUNCTION update_launches_updated_at();

CREATE TRIGGER trg_launch_kpis_updated_at
  BEFORE UPDATE ON launch_kpis
  FOR EACH ROW EXECUTE FUNCTION update_launches_updated_at();
