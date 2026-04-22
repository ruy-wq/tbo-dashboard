-- ============================================================================
-- RLS Hardening #2 — HR / Pessoas / Projetos / Meetings
--
-- Fecha advisor rls_disabled_in_public para 25 tabelas do domínio pessoas.
--
-- Padrão default (read tenant-scoped, write owner-or-admin):
--   - SELECT: tenant match
--   - INSERT: tenant match + owner = auth.uid()  (ou admin)
--   - UPDATE/DELETE: owner = auth.uid() OR admin, sempre dentro do tenant
--
-- NOTA: policies por-role finas (ex: só o próprio avaliado + manager leem
-- um PDI) são trabalho de um ciclo seguinte. Aqui o objetivo é fechar
-- acesso anon — tenant-scoped já é ordem de magnitude mais seguro.
-- ============================================================================

-- ── talents (owner: created_by) ────────────────────────────────────────────
DROP POLICY IF EXISTS talents_select ON public.talents;
CREATE POLICY talents_select ON public.talents
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT get_user_tenant_ids()));

DROP POLICY IF EXISTS talents_write ON public.talents;
CREATE POLICY talents_write ON public.talents
  FOR ALL TO authenticated
  USING (
    tenant_id IN (SELECT get_user_tenant_ids())
    AND (created_by = auth.uid() OR is_founder_or_admin())
  )
  WITH CHECK (
    tenant_id IN (SELECT get_user_tenant_ids())
    AND (created_by = auth.uid() OR is_founder_or_admin())
  );

ALTER TABLE public.talents ENABLE ROW LEVEL SECURITY;

-- ── teams (sem owner — admin only para write) ──────────────────────────────
DROP POLICY IF EXISTS teams_select ON public.teams;
CREATE POLICY teams_select ON public.teams
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT get_user_tenant_ids()));

DROP POLICY IF EXISTS teams_write_admin ON public.teams;
CREATE POLICY teams_write_admin ON public.teams
  FOR ALL TO authenticated
  USING (is_founder_or_admin() AND tenant_id IN (SELECT get_user_tenant_ids()))
  WITH CHECK (is_founder_or_admin() AND tenant_id IN (SELECT get_user_tenant_ids()));

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- ── vacancies (owner: created_by) ──────────────────────────────────────────
DROP POLICY IF EXISTS vacancies_select ON public.vacancies;
CREATE POLICY vacancies_select ON public.vacancies
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT get_user_tenant_ids()));

DROP POLICY IF EXISTS vacancies_write ON public.vacancies;
CREATE POLICY vacancies_write ON public.vacancies
  FOR ALL TO authenticated
  USING (
    tenant_id IN (SELECT get_user_tenant_ids())
    AND (created_by = auth.uid() OR is_founder_or_admin())
  )
  WITH CHECK (
    tenant_id IN (SELECT get_user_tenant_ids())
    AND (created_by = auth.uid() OR is_founder_or_admin())
  );

ALTER TABLE public.vacancies ENABLE ROW LEVEL SECURITY;

-- ── vacancy_candidates (parent: vacancy_id) ────────────────────────────────
DROP POLICY IF EXISTS vacancy_candidates_select ON public.vacancy_candidates;
CREATE POLICY vacancy_candidates_select ON public.vacancy_candidates
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT get_user_tenant_ids()));

DROP POLICY IF EXISTS vacancy_candidates_write_admin ON public.vacancy_candidates;
CREATE POLICY vacancy_candidates_write_admin ON public.vacancy_candidates
  FOR ALL TO authenticated
  USING (is_founder_or_admin() AND tenant_id IN (SELECT get_user_tenant_ids()))
  WITH CHECK (is_founder_or_admin() AND tenant_id IN (SELECT get_user_tenant_ids()));

ALTER TABLE public.vacancy_candidates ENABLE ROW LEVEL SECURITY;

-- ── contracts (owner: created_by — documentos jurídicos sensíveis) ─────────
DROP POLICY IF EXISTS contracts_select ON public.contracts;
CREATE POLICY contracts_select ON public.contracts
  FOR SELECT TO authenticated
  USING (
    tenant_id IN (SELECT get_user_tenant_ids())
    AND (created_by = auth.uid() OR is_founder_or_admin())
  );

DROP POLICY IF EXISTS contracts_write ON public.contracts;
CREATE POLICY contracts_write ON public.contracts
  FOR ALL TO authenticated
  USING (
    tenant_id IN (SELECT get_user_tenant_ids())
    AND (created_by = auth.uid() OR is_founder_or_admin())
  )
  WITH CHECK (
    tenant_id IN (SELECT get_user_tenant_ids())
    AND (created_by = auth.uid() OR is_founder_or_admin())
  );

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- ── collaborator_history (owner: user_id) ──────────────────────────────────
DROP POLICY IF EXISTS collaborator_history_select ON public.collaborator_history;
CREATE POLICY collaborator_history_select ON public.collaborator_history
  FOR SELECT TO authenticated
  USING (
    tenant_id IN (SELECT get_user_tenant_ids())
    AND (user_id = auth.uid() OR is_founder_or_admin())
  );

DROP POLICY IF EXISTS collaborator_history_write_admin ON public.collaborator_history;
CREATE POLICY collaborator_history_write_admin ON public.collaborator_history
  FOR ALL TO authenticated
  USING (is_founder_or_admin() AND tenant_id IN (SELECT get_user_tenant_ids()))
  WITH CHECK (is_founder_or_admin() AND tenant_id IN (SELECT get_user_tenant_ids()));

ALTER TABLE public.collaborator_history ENABLE ROW LEVEL SECURITY;

-- ── performance_cycles (owner: created_by) ─────────────────────────────────
DROP POLICY IF EXISTS performance_cycles_select ON public.performance_cycles;
CREATE POLICY performance_cycles_select ON public.performance_cycles
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT get_user_tenant_ids()));

DROP POLICY IF EXISTS performance_cycles_write_admin ON public.performance_cycles;
CREATE POLICY performance_cycles_write_admin ON public.performance_cycles
  FOR ALL TO authenticated
  USING (is_founder_or_admin() AND tenant_id IN (SELECT get_user_tenant_ids()))
  WITH CHECK (is_founder_or_admin() AND tenant_id IN (SELECT get_user_tenant_ids()));

ALTER TABLE public.performance_cycles ENABLE ROW LEVEL SECURITY;

-- ── performance_reviews (parent: cycle_id) ─────────────────────────────────
DROP POLICY IF EXISTS performance_reviews_select ON public.performance_reviews;
CREATE POLICY performance_reviews_select ON public.performance_reviews
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT get_user_tenant_ids()));

DROP POLICY IF EXISTS performance_reviews_write_admin ON public.performance_reviews;
CREATE POLICY performance_reviews_write_admin ON public.performance_reviews
  FOR ALL TO authenticated
  USING (is_founder_or_admin() AND tenant_id IN (SELECT get_user_tenant_ids()))
  WITH CHECK (is_founder_or_admin() AND tenant_id IN (SELECT get_user_tenant_ids()));

ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;

-- ── feedbacks (owner: from_user) ───────────────────────────────────────────
DROP POLICY IF EXISTS feedbacks_select ON public.feedbacks;
CREATE POLICY feedbacks_select ON public.feedbacks
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT get_user_tenant_ids()));

DROP POLICY IF EXISTS feedbacks_write ON public.feedbacks;
CREATE POLICY feedbacks_write ON public.feedbacks
  FOR ALL TO authenticated
  USING (
    tenant_id IN (SELECT get_user_tenant_ids())
    AND (from_user = auth.uid() OR is_founder_or_admin())
  )
  WITH CHECK (
    tenant_id IN (SELECT get_user_tenant_ids())
    AND (from_user = auth.uid() OR is_founder_or_admin())
  );

ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- ── pdis, pdi_goals, pdi_actions ───────────────────────────────────────────
DROP POLICY IF EXISTS pdis_select ON public.pdis;
CREATE POLICY pdis_select ON public.pdis
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT get_user_tenant_ids()));

DROP POLICY IF EXISTS pdis_write ON public.pdis;
CREATE POLICY pdis_write ON public.pdis
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT get_user_tenant_ids()));

ALTER TABLE public.pdis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pdi_goals_select ON public.pdi_goals;
CREATE POLICY pdi_goals_select ON public.pdi_goals
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT get_user_tenant_ids()));

DROP POLICY IF EXISTS pdi_goals_write ON public.pdi_goals;
CREATE POLICY pdi_goals_write ON public.pdi_goals
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT get_user_tenant_ids()));

ALTER TABLE public.pdi_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pdi_actions_select ON public.pdi_actions;
CREATE POLICY pdi_actions_select ON public.pdi_actions
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT get_user_tenant_ids()));

DROP POLICY IF EXISTS pdi_actions_write ON public.pdi_actions;
CREATE POLICY pdi_actions_write ON public.pdi_actions
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT get_user_tenant_ids()));

ALTER TABLE public.pdi_actions ENABLE ROW LEVEL SECURITY;

-- ── person_skills / person_tasks ───────────────────────────────────────────
DROP POLICY IF EXISTS person_skills_select ON public.person_skills;
CREATE POLICY person_skills_select ON public.person_skills
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT get_user_tenant_ids()));

DROP POLICY IF EXISTS person_skills_write ON public.person_skills;
CREATE POLICY person_skills_write ON public.person_skills
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT get_user_tenant_ids()));

ALTER TABLE public.person_skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS person_tasks_select ON public.person_tasks;
CREATE POLICY person_tasks_select ON public.person_tasks
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT get_user_tenant_ids()));

DROP POLICY IF EXISTS person_tasks_write ON public.person_tasks;
CREATE POLICY person_tasks_write ON public.person_tasks
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT get_user_tenant_ids()));

ALTER TABLE public.person_tasks ENABLE ROW LEVEL SECURITY;

-- ── recognitions (owner: from_user, parent: meeting_id) ───────────────────
DROP POLICY IF EXISTS recognitions_select ON public.recognitions;
CREATE POLICY recognitions_select ON public.recognitions
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT get_user_tenant_ids()));

DROP POLICY IF EXISTS recognitions_write ON public.recognitions;
CREATE POLICY recognitions_write ON public.recognitions
  FOR ALL TO authenticated
  USING (
    tenant_id IN (SELECT get_user_tenant_ids())
    AND (from_user = auth.uid() OR is_founder_or_admin())
  )
  WITH CHECK (
    tenant_id IN (SELECT get_user_tenant_ids())
    AND (from_user = auth.uid() OR is_founder_or_admin())
  );

ALTER TABLE public.recognitions ENABLE ROW LEVEL SECURITY;

-- ── one_on_ones (owner: created_by) ────────────────────────────────────────
DROP POLICY IF EXISTS one_on_ones_select ON public.one_on_ones;
CREATE POLICY one_on_ones_select ON public.one_on_ones
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT get_user_tenant_ids()));

DROP POLICY IF EXISTS one_on_ones_write ON public.one_on_ones;
CREATE POLICY one_on_ones_write ON public.one_on_ones
  FOR ALL TO authenticated
  USING (
    tenant_id IN (SELECT get_user_tenant_ids())
    AND (created_by = auth.uid() OR is_founder_or_admin())
  )
  WITH CHECK (
    tenant_id IN (SELECT get_user_tenant_ids())
    AND (created_by = auth.uid() OR is_founder_or_admin())
  );

ALTER TABLE public.one_on_ones ENABLE ROW LEVEL SECURITY;

-- ── one_on_one_actions (parent: one_on_one_id) ────────────────────────────
DROP POLICY IF EXISTS one_on_one_actions_select ON public.one_on_one_actions;
CREATE POLICY one_on_one_actions_select ON public.one_on_one_actions
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT get_user_tenant_ids()));

DROP POLICY IF EXISTS one_on_one_actions_write ON public.one_on_one_actions;
CREATE POLICY one_on_one_actions_write ON public.one_on_one_actions
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT get_user_tenant_ids()));

ALTER TABLE public.one_on_one_actions ENABLE ROW LEVEL SECURITY;

-- ── one_on_one_transcript_logs (parent: meeting_id) ───────────────────────
DROP POLICY IF EXISTS one_on_one_transcript_logs_select ON public.one_on_one_transcript_logs;
CREATE POLICY one_on_one_transcript_logs_select ON public.one_on_one_transcript_logs
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT get_user_tenant_ids()));

DROP POLICY IF EXISTS one_on_one_transcript_logs_write_admin ON public.one_on_one_transcript_logs;
CREATE POLICY one_on_one_transcript_logs_write_admin ON public.one_on_one_transcript_logs
  FOR ALL TO authenticated
  USING (is_founder_or_admin() AND tenant_id IN (SELECT get_user_tenant_ids()))
  WITH CHECK (is_founder_or_admin() AND tenant_id IN (SELECT get_user_tenant_ids()));

ALTER TABLE public.one_on_one_transcript_logs ENABLE ROW LEVEL SECURITY;

-- ── meeting_transcriptions (parent: meeting_id) ───────────────────────────
DROP POLICY IF EXISTS meeting_transcriptions_select ON public.meeting_transcriptions;
CREATE POLICY meeting_transcriptions_select ON public.meeting_transcriptions
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT get_user_tenant_ids()));

DROP POLICY IF EXISTS meeting_transcriptions_write ON public.meeting_transcriptions;
CREATE POLICY meeting_transcriptions_write ON public.meeting_transcriptions
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT get_user_tenant_ids()));

ALTER TABLE public.meeting_transcriptions ENABLE ROW LEVEL SECURITY;

-- ── meeting_participants (parent: meeting_id) ────────────────────────────
DROP POLICY IF EXISTS meeting_participants_select ON public.meeting_participants;
CREATE POLICY meeting_participants_select ON public.meeting_participants
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT get_user_tenant_ids()));

DROP POLICY IF EXISTS meeting_participants_write ON public.meeting_participants;
CREATE POLICY meeting_participants_write ON public.meeting_participants
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT get_user_tenant_ids()));

ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;

-- ── projects (owner: owner_id) ─────────────────────────────────────────────
DROP POLICY IF EXISTS projects_select ON public.projects;
CREATE POLICY projects_select ON public.projects
  FOR SELECT TO authenticated
  USING (
    tenant_id IN (SELECT get_user_tenant_ids())
    AND (
      owner_id = auth.uid()
      OR is_founder_or_admin()
      OR EXISTS (
        SELECT 1 FROM project_memberships pm
        WHERE pm.project_id = projects.id AND pm.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS projects_write ON public.projects;
CREATE POLICY projects_write ON public.projects
  FOR ALL TO authenticated
  USING (
    tenant_id IN (SELECT get_user_tenant_ids())
    AND (owner_id = auth.uid() OR is_founder_or_admin())
  )
  WITH CHECK (
    tenant_id IN (SELECT get_user_tenant_ids())
    AND (owner_id = auth.uid() OR is_founder_or_admin())
  );

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- ── project_files (parent: project_id) ────────────────────────────────────
DROP POLICY IF EXISTS project_files_select ON public.project_files;
CREATE POLICY project_files_select ON public.project_files
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT get_user_tenant_ids()));

DROP POLICY IF EXISTS project_files_write ON public.project_files;
CREATE POLICY project_files_write ON public.project_files
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT get_user_tenant_ids()));

ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

-- ── project_memberships (owner: user_id, parent: project_id) ──────────────
DROP POLICY IF EXISTS project_memberships_select ON public.project_memberships;
CREATE POLICY project_memberships_select ON public.project_memberships
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT get_user_tenant_ids()));

DROP POLICY IF EXISTS project_memberships_write_admin ON public.project_memberships;
CREATE POLICY project_memberships_write_admin ON public.project_memberships
  FOR ALL TO authenticated
  USING (
    tenant_id IN (SELECT get_user_tenant_ids())
    AND (user_id = auth.uid() OR is_founder_or_admin())
  )
  WITH CHECK (
    tenant_id IN (SELECT get_user_tenant_ids())
    AND (user_id = auth.uid() OR is_founder_or_admin())
  );

ALTER TABLE public.project_memberships ENABLE ROW LEVEL SECURITY;

-- ── market_research ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS market_research_select ON public.market_research;
CREATE POLICY market_research_select ON public.market_research
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT get_user_tenant_ids()));

DROP POLICY IF EXISTS market_research_write ON public.market_research;
CREATE POLICY market_research_write ON public.market_research
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT get_user_tenant_ids()));

ALTER TABLE public.market_research ENABLE ROW LEVEL SECURITY;

-- ── market_sources (sem tenant_id — catálogo global) ──────────────────────
DROP POLICY IF EXISTS market_sources_select ON public.market_sources;
CREATE POLICY market_sources_select ON public.market_sources
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS market_sources_write_admin ON public.market_sources;
CREATE POLICY market_sources_write_admin ON public.market_sources
  FOR ALL TO authenticated
  USING (is_founder_or_admin())
  WITH CHECK (is_founder_or_admin());

ALTER TABLE public.market_sources ENABLE ROW LEVEL SECURITY;
