"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared";
import { ProjectTopbar, type ProjectTabKey } from "@/features/projects/components/project-topbar";
import { ProjectOverview } from "@/features/projects/components/tabs/project-overview";
import { TaskDetailSheet } from "@/features/tasks/components/task-detail-sheet";
import { useProject, useProjectMembers, useAddProjectMember, useRemoveProjectMember } from "@/features/projects/hooks/use-projects";
import { useProfiles } from "@/features/people/hooks/use-people";
import { useUser } from "@/hooks/use-user";
import { useAuthStore } from "@/stores/auth-store";
import { useToast } from "@/hooks/use-toast";
import type { UserOption } from "@/components/ui/user-selector";
import type { MemberInfo } from "@/features/projects/components/member-avatar-stack";
import { RequireRole } from "@/features/auth/components/require-role";
import { ProjectTasksToolbar, ProjectTasksSubToolbar } from "@/features/projects/components/tabs/project-tasks-toolbar";
import { useProjectTaskFilters } from "@/stores/task-filters-store";
import { useFilteredTasks } from "@/features/projects/hooks/use-filtered-tasks";

// ── Lazy-loaded tabs — only download JS when tab becomes active ───────────
// Next.js 16 Turbopack requires inline object literals for dynamic() options
const tabFallback = <div className="h-64 animate-pulse rounded-lg bg-muted" />;

const ProjectTaskList = dynamic(() => import("@/features/projects/components/tabs/project-task-list").then((m) => ({ default: m.ProjectTaskList })), { loading: () => tabFallback });
const ProjectTaskBoard = dynamic(() => import("@/features/projects/components/tabs/project-task-board").then((m) => ({ default: m.ProjectTaskBoard })), { loading: () => tabFallback });
const ProjectGantt = dynamic(() => import("@/features/projects/components/tabs/project-gantt").then((m) => ({ default: m.ProjectGantt })), { ssr: false, loading: () => tabFallback });
const ProjectCalendar = dynamic(() => import("@/features/projects/components/tabs/project-calendar").then((m) => ({ default: m.ProjectCalendar })), { loading: () => tabFallback });
const ProjectFiles = dynamic(() => import("@/features/projects/components/tabs/project-files").then((m) => ({ default: m.ProjectFiles })), { loading: () => tabFallback });
const ProjectSettings = dynamic(() => import("@/features/projects/components/tabs/project-settings").then((m) => ({ default: m.ProjectSettings })), { loading: () => tabFallback });
const ProjectActivityTab = dynamic(() => import("@/features/projects/components/tabs/project-activity").then((m) => ({ default: m.ProjectActivityTab })), { loading: () => tabFallback });
const ProjectUpdates = dynamic(() => import("@/features/projects/components/tabs/project-updates").then((m) => ({ default: m.ProjectUpdates })), { loading: () => tabFallback });
const ProjectDashboard = dynamic(() => import("@/features/projects/components/tabs/project-dashboard").then((m) => ({ default: m.ProjectDashboard })), { loading: () => tabFallback });
const ProjectOverdueReport = dynamic(() => import("@/features/projects/components/tabs/project-overdue-report").then((m) => ({ default: m.ProjectOverdueReport })), { loading: () => tabFallback });
const ProjectPortal = dynamic(() => import("@/features/projects/components/tabs/project-portal").then((m) => ({ default: m.ProjectPortal })), { loading: () => tabFallback });
const ProjectIntake = dynamic(() => import("@/features/projects/components/tabs/project-intake").then((m) => ({ default: m.ProjectIntake })), { loading: () => tabFallback });
const ProjectEntregas = dynamic(() => import("@/features/deliveries/components/project-entregas").then((m) => ({ default: m.ProjectEntregas })), { loading: () => tabFallback });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const routerGuard = useRouter();

  // Redirect non-UUID slugs (e.g. "digital-3d") back to Quadro Geral
  useEffect(() => {
    if (!UUID_RE.test(id)) {
      routerGuard.replace("/projetos");
    }
  }, [id, routerGuard]);

  useUser();
  const isValidId = UUID_RE.test(id);
  const { data: project, isLoading, error, refetch } = useProject(isValidId ? id : "");
  const { data: profiles } = useProfiles();
  const { data: projectMembers } = useProjectMembers(id);
  const addMember = useAddProjectMember();
  const removeMember = useRemoveProjectMember();
  const currentUser = useAuthStore((s) => s.user);
  const tenantId = useAuthStore((s) => s.tenantId);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Persist active tab in URL: ?tab=list
  const tabFromUrl = searchParams.get("tab") as ProjectTabKey | null;
  const [activeTab, setActiveTabState] = useState<ProjectTabKey>(tabFromUrl ?? "overview");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [membersOpen, setMembersOpen] = useState(false);

  const setActiveTab = useCallback(
    (tab: ProjectTabKey) => {
      setActiveTabState(tab);
      const params = new URLSearchParams(searchParams.toString());
      if (tab === "overview") {
        params.delete("tab");
      } else {
        params.set("tab", tab);
      }
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  // Sync tab from URL on navigation
  useEffect(() => {
    const urlTab = searchParams.get("tab") as ProjectTabKey | null;
    if (urlTab && urlTab !== activeTab) {
      setActiveTabState(urlTab);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Deep-link: ?task=<id> or ?demanda=<id> (backward compat)
  useEffect(() => {
    const taskId = searchParams.get("task") ?? searchParams.get("demanda");
    if (taskId) {
      setSelectedTaskId(taskId);
      if (activeTab === "overview") setActiveTab("list");
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectTask = useCallback((taskId: string) => {
    setSelectedTaskId(taskId);
  }, []);

  const handleCloseTask = useCallback(() => {
    setSelectedTaskId(null);
  }, []);

  // Shared task filters (for toolbar above tabs)
  const [taskFilters, setTaskFilters] = useProjectTaskFilters(isValidId ? id : "");
  const { parents: allParents, filtered: filteredParents } = useFilteredTasks(isValidId ? id : "");
  const TASK_TABS = new Set<ProjectTabKey>(["list", "board", "gantt", "calendar"]);
  const showTaskToolbar = TASK_TABS.has(activeTab);

  const users: UserOption[] = (profiles || []).map((p) => ({
    id: p.id,
    full_name: p.full_name,
    avatar_url: p.avatar_url,
    email: p.email,
  }));

  // Map user_id → membership_id for removal lookup
  const membershipMap = new Map(
    (projectMembers || []).map((pm) => [pm.user_id, pm.id]),
  );

  // Real project members from project_memberships table (id = user_id for filtering)
  const members: MemberInfo[] = (projectMembers || [])
    .map((pm) => ({
      id: pm.user_id,
      full_name: pm.profile?.full_name ?? null,
      avatar_url: pm.profile?.avatar_url ?? null,
    }))
    .filter((m) => m.full_name);

  // All profiles for add-member picker
  const allProfiles: MemberInfo[] = (profiles || [])
    .filter((p) => p.full_name)
    .map((p) => ({
      id: p.id,
      full_name: p.full_name,
      avatar_url: p.avatar_url,
    }));

  const handleAddMember = useCallback(
    (member: MemberInfo) => {
      if (!tenantId || !currentUser?.id) return;
      addMember.mutate(
        { projectId: id, userId: member.id, tenantId, grantedBy: currentUser.id },
        {
          onError: () => toast({ title: "Erro ao adicionar membro", variant: "destructive" }),
        },
      );
    },
    [id, tenantId, currentUser?.id, addMember, toast],
  );

  const handleRemoveMember = useCallback(
    (userId: string) => {
      const membershipId = membershipMap.get(userId);
      if (!membershipId) return;
      removeMember.mutate(
        { membershipId, projectId: id },
        {
          onError: () => toast({ title: "Erro ao remover membro", variant: "destructive" }),
        },
      );
    },
    [id, membershipMap, removeMember, toast],
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* UX04 — Content-aware skeleton: topbar */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="size-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-48 rounded" />
              <Skeleton className="h-3 w-64 rounded" />
            </div>
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
          <div className="flex gap-1 border-b border-border/60 pb-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-7 rounded-md" style={{ width: `${56 + (i % 3) * 12}px` }} />
            ))}
          </div>
        </div>
        {/* UX04 — Content-aware skeleton: tab content */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-border/40 p-3">
                <Skeleton className="size-4 rounded-full" />
                <Skeleton className="h-4 flex-1 rounded" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <ErrorState
        message={error?.message || "Projeto não encontrado"}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <RequireRole module="projetos">
    <div className="space-y-6">
      <ProjectTopbar
        project={project}
        users={users}
        members={members}
        allProfiles={allProfiles}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAddMember={handleAddMember}
        onRemoveMember={handleRemoveMember}
        membersOpen={membersOpen}
        onMembersOpenChange={setMembersOpen}
      />

      {/* Shared task toolbar — visible on list/board/gantt/calendar */}
      {showTaskToolbar && (
        <div className="space-y-2">
          <ProjectTasksToolbar
            filters={taskFilters}
            onFiltersChange={setTaskFilters}
            totalCount={allParents.length}
            filteredCount={filteredParents.length}
            onAddTask={() => handleSelectTask("new")}
          />
          <ProjectTasksSubToolbar
            filters={taskFilters}
            onFiltersChange={setTaskFilters}
          />
        </div>
      )}

      {/* Tab content */}
      <div key={activeTab}>
        {activeTab === "overview" && (
          <ProjectOverview
            projectId={id}
            members={members}
            onOpenMembers={() => setMembersOpen(true)}
          />
        )}
        {activeTab === "list" && (
          <ProjectTaskList
            projectId={id}
            onSelectTask={handleSelectTask}
            onAddTask={() => handleSelectTask("new")}
          />
        )}
        {activeTab === "board" && (
          <ProjectTaskBoard
            projectId={id}
            onSelectTask={handleSelectTask}
          />
        )}
        {activeTab === "gantt" && (
          <ProjectGantt projectId={id} onSelectTask={handleSelectTask} />
        )}
        {activeTab === "calendar" && (
          <ProjectCalendar projectId={id} onSelectTask={handleSelectTask} />
        )}
        {activeTab === "files" && <ProjectFiles projectId={id} />}
        {activeTab === "updates" && <ProjectUpdates projectId={id} />}
        {activeTab === "activity" && <ProjectActivityTab projectId={id} />}
        {activeTab === "dashboard" && <ProjectDashboard projectId={id} />}
        {activeTab === "overdue" && (
          <ProjectOverdueReport projectId={id} onSelectTask={handleSelectTask} />
        )}
        {activeTab === "intake" && <ProjectIntake projectId={id} />}
        {activeTab === "settings" && <ProjectSettings projectId={id} />}
        {activeTab === "portal" && (
          <ProjectPortal
            projectId={id}
            projectName={project.name}
            dueDate={project.due_date_end}
            bus={project.bus}
            portalToken={(project as Record<string, unknown>).portal_token as string | null}
          />
        )}
        {activeTab === "entregas" && (
          <ProjectEntregas projectId={id} projectName={project.name} />
        )}
      </div>

      {/* Task detail sheet */}
      <TaskDetailSheet
        taskId={selectedTaskId === "new" ? undefined : (selectedTaskId ?? undefined)}
        open={!!selectedTaskId && selectedTaskId !== "new"}
        onClose={handleCloseTask}
        projectName={project.name}
      />
    </div>
    </RequireRole>
  );
}
