-- ============================================================================
-- RLS Hardening #3 — Audit / Content / Templates / Polls / UI prefs
--
-- Fecha advisor rls_disabled_in_public para 19 tabelas (academy excluído).
--
-- Padrões:
--   - Audit tables: SELECT admin only, writes via service_role (sem policy)
--   - Content tenant-scoped: read tenant, write admin
--   - UI prefs per-user: user_id = auth.uid() em tudo
--   - Chat polls: acesso herdado do channel (via message -> channel_members)
-- ============================================================================

-- ── audit_logs (owner: user_id) ────────────────────────────────────────────
-- Read só admin. Insert permitido pro próprio user (para logar ações).
-- Update/Delete bloqueados (imutável).
DROP POLICY IF EXISTS audit_logs_select_admin ON public.audit_logs;
CREATE POLICY audit_logs_select_admin ON public.audit_logs
  FOR SELECT TO authenticated
  USING (is_founder_or_admin() AND tenant_id IN (SELECT get_user_tenant_ids()));

DROP POLICY IF EXISTS audit_logs_insert_self ON public.audit_logs;
CREATE POLICY audit_logs_insert_self ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT get_user_tenant_ids())
    AND user_id = auth.uid()
  );

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ── changelog_entries (sem tenant — log global, admin only) ────────────────
DROP POLICY IF EXISTS changelog_entries_select_admin ON public.changelog_entries;
CREATE POLICY changelog_entries_select_admin ON public.changelog_entries
  FOR SELECT TO authenticated
  USING (is_founder_or_admin());

ALTER TABLE public.changelog_entries ENABLE ROW LEVEL SECURITY;

-- ── digest_logs (sem tenant — log global, admin only) ──────────────────────
DROP POLICY IF EXISTS digest_logs_select_admin ON public.digest_logs;
CREATE POLICY digest_logs_select_admin ON public.digest_logs
  FOR SELECT TO authenticated
  USING (is_founder_or_admin());

ALTER TABLE public.digest_logs ENABLE ROW LEVEL SECURITY;

-- ── cultura_audit_log ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS cultura_audit_log_select_admin ON public.cultura_audit_log;
CREATE POLICY cultura_audit_log_select_admin ON public.cultura_audit_log
  FOR SELECT TO authenticated
  USING (is_founder_or_admin() AND tenant_id IN (SELECT get_user_tenant_ids()));

ALTER TABLE public.cultura_audit_log ENABLE ROW LEVEL SECURITY;

-- ── cultura_items ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS cultura_items_select ON public.cultura_items;
CREATE POLICY cultura_items_select ON public.cultura_items
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT get_user_tenant_ids()));

DROP POLICY IF EXISTS cultura_items_write_admin ON public.cultura_items;
CREATE POLICY cultura_items_write_admin ON public.cultura_items
  FOR ALL TO authenticated
  USING (is_founder_or_admin() AND tenant_id IN (SELECT get_user_tenant_ids()))
  WITH CHECK (is_founder_or_admin() AND tenant_id IN (SELECT get_user_tenant_ids()));

ALTER TABLE public.cultura_items ENABLE ROW LEVEL SECURITY;

-- ── cultura_item_versions (parent: item_id → cultura_items) ────────────────
DROP POLICY IF EXISTS cultura_item_versions_select ON public.cultura_item_versions;
CREATE POLICY cultura_item_versions_select ON public.cultura_item_versions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cultura_items ci
      WHERE ci.id = cultura_item_versions.item_id
        AND ci.tenant_id IN (SELECT get_user_tenant_ids())
    )
  );

DROP POLICY IF EXISTS cultura_item_versions_write_admin ON public.cultura_item_versions;
CREATE POLICY cultura_item_versions_write_admin ON public.cultura_item_versions
  FOR ALL TO authenticated
  USING (
    is_founder_or_admin()
    AND EXISTS (
      SELECT 1 FROM cultura_items ci
      WHERE ci.id = cultura_item_versions.item_id
        AND ci.tenant_id IN (SELECT get_user_tenant_ids())
    )
  )
  WITH CHECK (
    is_founder_or_admin()
    AND EXISTS (
      SELECT 1 FROM cultura_items ci
      WHERE ci.id = cultura_item_versions.item_id
        AND ci.tenant_id IN (SELECT get_user_tenant_ids())
    )
  );

ALTER TABLE public.cultura_item_versions ENABLE ROW LEVEL SECURITY;

-- ── pages (owner: created_by, parent: space_id) ────────────────────────────
DROP POLICY IF EXISTS pages_select ON public.pages;
CREATE POLICY pages_select ON public.pages
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT get_user_tenant_ids()));

DROP POLICY IF EXISTS pages_insert ON public.pages;
CREATE POLICY pages_insert ON public.pages
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT get_user_tenant_ids())
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS pages_update ON public.pages;
CREATE POLICY pages_update ON public.pages
  FOR UPDATE TO authenticated
  USING (
    tenant_id IN (SELECT get_user_tenant_ids())
    AND (created_by = auth.uid() OR is_founder_or_admin())
  )
  WITH CHECK (
    tenant_id IN (SELECT get_user_tenant_ids())
    AND (created_by = auth.uid() OR is_founder_or_admin())
  );

DROP POLICY IF EXISTS pages_delete ON public.pages;
CREATE POLICY pages_delete ON public.pages
  FOR DELETE TO authenticated
  USING (
    tenant_id IN (SELECT get_user_tenant_ids())
    AND (created_by = auth.uid() OR is_founder_or_admin())
  );

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- ── document_versions ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS document_versions_select ON public.document_versions;
CREATE POLICY document_versions_select ON public.document_versions
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT get_user_tenant_ids()));

DROP POLICY IF EXISTS document_versions_write ON public.document_versions;
CREATE POLICY document_versions_write ON public.document_versions
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT get_user_tenant_ids()));

ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

-- ── dynamic_templates (sem tenant — catálogo global, owner: created_by) ───
DROP POLICY IF EXISTS dynamic_templates_select ON public.dynamic_templates;
CREATE POLICY dynamic_templates_select ON public.dynamic_templates
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS dynamic_templates_write ON public.dynamic_templates;
CREATE POLICY dynamic_templates_write ON public.dynamic_templates
  FOR ALL TO authenticated
  USING (created_by = auth.uid() OR is_founder_or_admin())
  WITH CHECK (created_by = auth.uid() OR is_founder_or_admin());

ALTER TABLE public.dynamic_templates ENABLE ROW LEVEL SECURITY;

-- ── onboarding_templates (owner: created_by) ───────────────────────────────
DROP POLICY IF EXISTS onboarding_templates_select ON public.onboarding_templates;
CREATE POLICY onboarding_templates_select ON public.onboarding_templates
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT get_user_tenant_ids()));

DROP POLICY IF EXISTS onboarding_templates_write ON public.onboarding_templates;
CREATE POLICY onboarding_templates_write ON public.onboarding_templates
  FOR ALL TO authenticated
  USING (
    tenant_id IN (SELECT get_user_tenant_ids())
    AND (created_by = auth.uid() OR is_founder_or_admin())
  )
  WITH CHECK (
    tenant_id IN (SELECT get_user_tenant_ids())
    AND (created_by = auth.uid() OR is_founder_or_admin())
  );

ALTER TABLE public.onboarding_templates ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CHAT POLLS — acesso herdado do channel (via chat_messages -> members)
-- ============================================================================

-- ── chat_polls (parent: message_id) ───────────────────────────────────────
DROP POLICY IF EXISTS chat_polls_select ON public.chat_polls;
CREATE POLICY chat_polls_select ON public.chat_polls
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_messages cm
      JOIN chat_channel_members ccm ON ccm.channel_id = cm.channel_id
      WHERE cm.id = chat_polls.message_id
        AND ccm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS chat_polls_write ON public.chat_polls;
CREATE POLICY chat_polls_write ON public.chat_polls
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_messages cm
      WHERE cm.id = chat_polls.message_id
        AND cm.sender_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_messages cm
      WHERE cm.id = chat_polls.message_id
        AND cm.sender_id = auth.uid()
    )
  );

ALTER TABLE public.chat_polls ENABLE ROW LEVEL SECURITY;

-- ── chat_poll_options (parent: poll_id) ───────────────────────────────────
DROP POLICY IF EXISTS chat_poll_options_select ON public.chat_poll_options;
CREATE POLICY chat_poll_options_select ON public.chat_poll_options
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_polls p
      JOIN chat_messages cm ON cm.id = p.message_id
      JOIN chat_channel_members ccm ON ccm.channel_id = cm.channel_id
      WHERE p.id = chat_poll_options.poll_id
        AND ccm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS chat_poll_options_write ON public.chat_poll_options;
CREATE POLICY chat_poll_options_write ON public.chat_poll_options
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_polls p
      JOIN chat_messages cm ON cm.id = p.message_id
      WHERE p.id = chat_poll_options.poll_id
        AND cm.sender_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_polls p
      JOIN chat_messages cm ON cm.id = p.message_id
      WHERE p.id = chat_poll_options.poll_id
        AND cm.sender_id = auth.uid()
    )
  );

ALTER TABLE public.chat_poll_options ENABLE ROW LEVEL SECURITY;

-- ── chat_poll_votes (owner: user_id, parent: poll_id) ─────────────────────
DROP POLICY IF EXISTS chat_poll_votes_select ON public.chat_poll_votes;
CREATE POLICY chat_poll_votes_select ON public.chat_poll_votes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_polls p
      JOIN chat_messages cm ON cm.id = p.message_id
      JOIN chat_channel_members ccm ON ccm.channel_id = cm.channel_id
      WHERE p.id = chat_poll_votes.poll_id
        AND ccm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS chat_poll_votes_write_self ON public.chat_poll_votes;
CREATE POLICY chat_poll_votes_write_self ON public.chat_poll_votes
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

ALTER TABLE public.chat_poll_votes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- REWARDS CONFIG
-- ============================================================================

-- ── reward_policy ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS reward_policy_select ON public.reward_policy;
CREATE POLICY reward_policy_select ON public.reward_policy
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT get_user_tenant_ids()));

DROP POLICY IF EXISTS reward_policy_write_admin ON public.reward_policy;
CREATE POLICY reward_policy_write_admin ON public.reward_policy
  FOR ALL TO authenticated
  USING (is_founder_or_admin() AND tenant_id IN (SELECT get_user_tenant_ids()))
  WITH CHECK (is_founder_or_admin() AND tenant_id IN (SELECT get_user_tenant_ids()));

ALTER TABLE public.reward_policy ENABLE ROW LEVEL SECURITY;

-- ── reward_tiers ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS reward_tiers_select ON public.reward_tiers;
CREATE POLICY reward_tiers_select ON public.reward_tiers
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT get_user_tenant_ids()));

DROP POLICY IF EXISTS reward_tiers_write_admin ON public.reward_tiers;
CREATE POLICY reward_tiers_write_admin ON public.reward_tiers
  FOR ALL TO authenticated
  USING (is_founder_or_admin() AND tenant_id IN (SELECT get_user_tenant_ids()))
  WITH CHECK (is_founder_or_admin() AND tenant_id IN (SELECT get_user_tenant_ids()));

ALTER TABLE public.reward_tiers ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- UI PREFERENCES — per-user
-- ============================================================================

-- ── sidebar_items (config compartilhada — tenant + admin write) ───────────
DROP POLICY IF EXISTS sidebar_items_select ON public.sidebar_items;
CREATE POLICY sidebar_items_select ON public.sidebar_items
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT get_user_tenant_ids()));

DROP POLICY IF EXISTS sidebar_items_write_admin ON public.sidebar_items;
CREATE POLICY sidebar_items_write_admin ON public.sidebar_items
  FOR ALL TO authenticated
  USING (is_founder_or_admin() AND tenant_id IN (SELECT get_user_tenant_ids()))
  WITH CHECK (is_founder_or_admin() AND tenant_id IN (SELECT get_user_tenant_ids()));

ALTER TABLE public.sidebar_items ENABLE ROW LEVEL SECURITY;

-- ── sidebar_user_state (owner: user_id) ────────────────────────────────────
DROP POLICY IF EXISTS sidebar_user_state_self ON public.sidebar_user_state;
CREATE POLICY sidebar_user_state_self ON public.sidebar_user_state
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

ALTER TABLE public.sidebar_user_state ENABLE ROW LEVEL SECURITY;

-- ── user_recent_icons (owner: user_id) ─────────────────────────────────────
DROP POLICY IF EXISTS user_recent_icons_self ON public.user_recent_icons;
CREATE POLICY user_recent_icons_self ON public.user_recent_icons
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

ALTER TABLE public.user_recent_icons ENABLE ROW LEVEL SECURITY;
