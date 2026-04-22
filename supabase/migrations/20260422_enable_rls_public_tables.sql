-- ============================================================================
-- Enable RLS on public tables flagged by Supabase advisor (rls_disabled_in_public)
--
-- Root cause: 000_consolidated_schema.sql creates these tables and defines
-- CREATE POLICY statements, but never calls ALTER TABLE ... ENABLE ROW LEVEL
-- SECURITY. Postgres ignores policies when RLS is off, so the tables remained
-- readable/writable by the anon role via PostgREST.
--
-- Affected tables:
--   - profiles                (only had INSERT policy -> add SELECT/UPDATE/DELETE)
--   - culture_pages           (only had UPDATE/DELETE -> add SELECT/INSERT)
--   - chat_messages           (all CRUD policies already exist)
--   - recognition_rewards     (all CRUD policies already exist)
--   - recognition_redemptions (missing DELETE -> add admin DELETE)
-- ============================================================================

-- ── profiles ────────────────────────────────────────────────────────────────
-- Every user in the tenant needs to read profiles (member pickers, mentions,
-- avatars, org chart). Users can update their own row; admins can update any.

DROP POLICY IF EXISTS rls_profiles_select_tenant ON public.profiles;
CREATE POLICY rls_profiles_select_tenant ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR tenant_id IN (SELECT get_user_tenant_ids())
  );

DROP POLICY IF EXISTS rls_profiles_update_self_or_admin ON public.profiles;
CREATE POLICY rls_profiles_update_self_or_admin ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    id = auth.uid()
    OR (is_founder_or_admin() AND tenant_id IN (SELECT get_user_tenant_ids()))
  )
  WITH CHECK (
    id = auth.uid()
    OR (is_founder_or_admin() AND tenant_id IN (SELECT get_user_tenant_ids()))
  );

DROP POLICY IF EXISTS rls_profiles_delete_admin ON public.profiles;
CREATE POLICY rls_profiles_delete_admin ON public.profiles
  FOR DELETE TO authenticated
  USING (
    is_founder_or_admin()
    AND tenant_id IN (SELECT get_user_tenant_ids())
  );

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ── culture_pages ───────────────────────────────────────────────────────────
-- Read for everyone in the tenant; create restricted to admins (matches
-- update/delete policies already in place).

DROP POLICY IF EXISTS culture_pages_select_tenant ON public.culture_pages;
CREATE POLICY culture_pages_select_tenant ON public.culture_pages
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT get_user_tenant_ids()));

DROP POLICY IF EXISTS culture_pages_insert_admin ON public.culture_pages;
CREATE POLICY culture_pages_insert_admin ON public.culture_pages
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT get_user_tenant_ids())
    AND (
      created_by = auth.uid()
      OR is_founder_or_admin()
    )
  );

ALTER TABLE public.culture_pages ENABLE ROW LEVEL SECURITY;

-- ── recognition_redemptions ─────────────────────────────────────────────────
-- Missing DELETE policy — admin only.

DROP POLICY IF EXISTS redemptions_delete_admin ON public.recognition_redemptions;
CREATE POLICY redemptions_delete_admin ON public.recognition_redemptions
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenant_members tm
      JOIN roles r ON r.id = tm.role_id
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = recognition_redemptions.tenant_id
        AND LOWER(r.name) IN ('owner', 'admin', 'founder')
    )
  );

ALTER TABLE public.recognition_redemptions ENABLE ROW LEVEL SECURITY;

-- ── recognition_rewards ─────────────────────────────────────────────────────
-- All CRUD policies already defined; just flip RLS on.

ALTER TABLE public.recognition_rewards ENABLE ROW LEVEL SECURITY;

-- ── chat_messages ───────────────────────────────────────────────────────────
-- All CRUD policies already defined; just flip RLS on.

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
