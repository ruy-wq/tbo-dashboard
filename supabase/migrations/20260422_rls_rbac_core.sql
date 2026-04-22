-- ============================================================================
-- RLS Hardening #1 — RBAC core + finance + integrations
--
-- Fecha o advisor rls_disabled_in_public para:
--   RBAC:          tenants, tenant_members, roles, role_permissions,
--                  permissions, space_members, space_invitations
--   Finance:       fin_invoices, fin_receivables, fin_payables,
--                  fin_balance_snapshots, finance_snapshots_daily,
--                  bank_imports, bank_transactions,
--                  reconciliation_rules, reconciliation_audit,
--                  omie_sync_log, sync_logs
--   Integrations:  integration_configs
--
-- Padrão:
--   - RBAC core: read tenant-scoped, write admin only
--   - Finance: is_finance_admin(tenant_id) para TUDO
--   - Audit/sync tables: read admin, write via service_role (sem policy)
-- ============================================================================

-- ── tenants ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS tenants_select_self ON public.tenants;
CREATE POLICY tenants_select_self ON public.tenants
  FOR SELECT TO authenticated
  USING (id IN (SELECT get_user_tenant_ids()));

DROP POLICY IF EXISTS tenants_update_admin ON public.tenants;
CREATE POLICY tenants_update_admin ON public.tenants
  FOR UPDATE TO authenticated
  USING (is_founder_or_admin() AND id IN (SELECT get_user_tenant_ids()))
  WITH CHECK (is_founder_or_admin() AND id IN (SELECT get_user_tenant_ids()));

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- ── tenant_members ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS tenant_members_select ON public.tenant_members;
CREATE POLICY tenant_members_select ON public.tenant_members
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT get_user_tenant_ids()));

DROP POLICY IF EXISTS tenant_members_write_admin ON public.tenant_members;
CREATE POLICY tenant_members_write_admin ON public.tenant_members
  FOR ALL TO authenticated
  USING (is_founder_or_admin() AND tenant_id IN (SELECT get_user_tenant_ids()))
  WITH CHECK (is_founder_or_admin() AND tenant_id IN (SELECT get_user_tenant_ids()));

ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;

-- ── roles ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS roles_select ON public.roles;
CREATE POLICY roles_select ON public.roles
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT get_user_tenant_ids()));

DROP POLICY IF EXISTS roles_write_admin ON public.roles;
CREATE POLICY roles_write_admin ON public.roles
  FOR ALL TO authenticated
  USING (is_founder_or_admin() AND tenant_id IN (SELECT get_user_tenant_ids()))
  WITH CHECK (is_founder_or_admin() AND tenant_id IN (SELECT get_user_tenant_ids()));

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- ── role_permissions ──────────────────────────────────────────────────────
-- role_id -> roles. Read por qualquer authenticated (UI precisa pra renderizar
-- permissões), write admin only.
DROP POLICY IF EXISTS role_permissions_select ON public.role_permissions;
CREATE POLICY role_permissions_select ON public.role_permissions
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS role_permissions_write_admin ON public.role_permissions;
CREATE POLICY role_permissions_write_admin ON public.role_permissions
  FOR ALL TO authenticated
  USING (is_founder_or_admin())
  WITH CHECK (is_founder_or_admin());

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- ── permissions ────────────────────────────────────────────────────────────
-- Catálogo global. Read authenticated, write admin only.
DROP POLICY IF EXISTS permissions_select ON public.permissions;
CREATE POLICY permissions_select ON public.permissions
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS permissions_write_admin ON public.permissions;
CREATE POLICY permissions_write_admin ON public.permissions
  FOR ALL TO authenticated
  USING (is_founder_or_admin())
  WITH CHECK (is_founder_or_admin());

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- ── space_members ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS space_members_select ON public.space_members;
CREATE POLICY space_members_select ON public.space_members
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT get_user_tenant_ids()));

DROP POLICY IF EXISTS space_members_write ON public.space_members;
CREATE POLICY space_members_write ON public.space_members
  FOR ALL TO authenticated
  USING (
    tenant_id IN (SELECT get_user_tenant_ids())
    AND (user_id = auth.uid() OR is_founder_or_admin())
  )
  WITH CHECK (
    tenant_id IN (SELECT get_user_tenant_ids())
    AND (user_id = auth.uid() OR is_founder_or_admin())
  );

ALTER TABLE public.space_members ENABLE ROW LEVEL SECURITY;

-- ── space_invitations ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS space_invitations_select ON public.space_invitations;
CREATE POLICY space_invitations_select ON public.space_invitations
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT get_user_tenant_ids()));

DROP POLICY IF EXISTS space_invitations_write_admin ON public.space_invitations;
CREATE POLICY space_invitations_write_admin ON public.space_invitations
  FOR ALL TO authenticated
  USING (is_founder_or_admin() AND tenant_id IN (SELECT get_user_tenant_ids()))
  WITH CHECK (is_founder_or_admin() AND tenant_id IN (SELECT get_user_tenant_ids()));

ALTER TABLE public.space_invitations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FINANCE — founder/owner/diretoria only (is_finance_admin)
-- ============================================================================

-- fin_invoices, fin_receivables, fin_payables, fin_balance_snapshots,
-- finance_snapshots_daily, bank_imports, bank_transactions,
-- reconciliation_rules, reconciliation_audit
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'fin_invoices', 'fin_receivables', 'fin_payables',
    'fin_balance_snapshots', 'finance_snapshots_daily',
    'bank_imports', 'bank_transactions',
    'reconciliation_rules', 'reconciliation_audit'
  ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_finance_admin_all ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY %I_finance_admin_all ON public.%I
         FOR ALL TO authenticated
         USING (is_finance_admin(tenant_id))
         WITH CHECK (is_finance_admin(tenant_id))',
      t, t
    );
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- ── omie_sync_log / sync_logs ──────────────────────────────────────────────
-- Read por admin. Writes via service_role (edge functions) — sem policy.
DROP POLICY IF EXISTS omie_sync_log_select_admin ON public.omie_sync_log;
CREATE POLICY omie_sync_log_select_admin ON public.omie_sync_log
  FOR SELECT TO authenticated
  USING (is_finance_admin(tenant_id));

ALTER TABLE public.omie_sync_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sync_logs_select_admin ON public.sync_logs;
CREATE POLICY sync_logs_select_admin ON public.sync_logs
  FOR SELECT TO authenticated
  USING (is_founder_or_admin() AND tenant_id IN (SELECT get_user_tenant_ids()));

ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- ── integration_configs ────────────────────────────────────────────────────
-- Pode conter tokens/API keys — admin only, sempre.
DROP POLICY IF EXISTS integration_configs_admin_all ON public.integration_configs;
CREATE POLICY integration_configs_admin_all ON public.integration_configs
  FOR ALL TO authenticated
  USING (is_founder_or_admin() AND tenant_id IN (SELECT get_user_tenant_ids()))
  WITH CHECK (is_founder_or_admin() AND tenant_id IN (SELECT get_user_tenant_ids()));

ALTER TABLE public.integration_configs ENABLE ROW LEVEL SECURITY;
