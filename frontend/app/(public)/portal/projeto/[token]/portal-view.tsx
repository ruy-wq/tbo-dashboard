"use client";

import { useState, useMemo } from "react";
import { PortalLayout } from "@/features/projects/components/portal/portal-layout";
import { PortalHeader } from "@/features/projects/components/portal/portal-header";
import { PortalSidebar } from "@/features/projects/components/portal/portal-sidebar";
import { PortalWelcomeBanner } from "@/features/projects/components/portal/portal-welcome-banner";
import {
  PortalMainTabs,
  type PortalTabId,
} from "@/features/projects/components/portal/portal-main-tabs";
import { PortalFilesTab, type PortalFile } from "@/features/projects/components/portal/portal-files-tab";
import { PortalReportsTab } from "@/features/projects/components/portal/portal-reports-tab";
import { PortalLatestDocs } from "@/features/projects/components/portal/portal-latest-docs";
import { PortalTrackStepper, type TrackPhase } from "@/features/projects/components/portal/portal-track-stepper";
import { PortalAboutSection, type ProjectPortalAbout } from "@/features/projects/components/portal/portal-about-section";
import { Badge } from "@/components/ui/badge";
import {
  IconCircleCheck,
  IconClock,
  IconCheck,
  IconExternalLink,
  IconPackage,
  IconPresentation,
  IconBook,
  IconForms,
  IconBrandGoogleDrive,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

interface PortalTask {
  id: string;
  title: string;
  status: string;
  is_completed: boolean;
  due_date: string | null;
  priority: string | null;
  section_id: string | null;
  requires_client_approval: boolean | null;
  client_approval_status: string | null;
  client_approval_comment: string | null;
  client_approval_at: string | null;
  completed_at: string | null;
}

interface StatusUpdate {
  id: string;
  status: string;
  summary: string | null;
  created_at: string;
  author_name: string | null;
}

interface PortalProject {
  id: string;
  name: string;
  status: string | null;
  client: string | null;
  client_company: string | null;
  due_date_start: string | null;
  due_date_end: string | null;
  tenant_id: string;
  portal_about?: Record<string, unknown> | null;
}

interface Section {
  id: string;
  title: string;
  color: string | null;
  order_index: number;
}

interface ProjectPortalViewProps {
  project: PortalProject;
  tasks: PortalTask[];
  projectFiles: PortalFile[];
  chatMessages: unknown[];
  sections: Section[];
  latestUpdate: StatusUpdate | null;
  progressPercent: number;
  completedCount: number;
  inProgressCount: number;
  overdueCount: number;
  totalCount: number;
  token: string;
  deliveryToken: string | null;
  pendingApprovals: number;
  commentsCount: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, string> = {
  urgente: "bg-red-100 text-red-700",
  alta: "bg-amber-100 text-amber-700",
  media: "bg-blue-100 text-blue-700",
  baixa: "bg-zinc-100 text-zinc-600",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "\u2014";
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function ProjectPortalView({
  project,
  tasks,
  projectFiles,
  sections,
  latestUpdate,
  progressPercent,
  completedCount,
  inProgressCount,
  overdueCount,
  totalCount,
  token,
  deliveryToken,
  pendingApprovals,
}: ProjectPortalViewProps) {
  const [activeTab, setActiveTab] = useState<PortalTabId>("tasks");
  const [activeNav, setActiveNav] = useState("home");
  const [sidebarItem, setSidebarItem] = useState("home");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Delivery link (unique per project from project_deliveries)
  const deliverySlug = deliveryToken;

  // Project links from portal_about
  const aboutData = (project.portal_about ?? {}) as ProjectPortalAbout;
  const hasProjectLinks = !!(aboutData.onboarding_url || aboutData.guide_url || aboutData.briefing_url || aboutData.drive_url);

  const hasPendingTasks = tasks.some((t) => !t.is_completed);

  // Build stepper phases
  const phases = useMemo<TrackPhase[]>(() => {
    if (sections.length === 0) {
      return [
        { key: "briefing", label: "Briefing", status: "completed" },
        { key: "creation", label: "Criacao", status: "completed" },
        { key: "execution", label: "Execucao", status: "completed" },
        { key: "delivery", label: "Entrega", status: hasPendingTasks ? "in_progress" : "completed" },
      ];
    }
    return sections.map((s) => {
      const sectionTasks = tasks.filter((t) => t.section_id === s.id);
      const allDone = sectionTasks.length > 0 && sectionTasks.every((t) => t.is_completed);
      const someActive = sectionTasks.some((t) => !t.is_completed);
      return {
        key: s.id,
        label: s.title,
        status: allDone ? "completed" : someActive ? "in_progress" : "pending",
      } satisfies TrackPhase;
    });
  }, [sections, tasks, hasPendingTasks]);
  const healthLabel = !hasPendingTasks ? "Entregue" : progressPercent >= 90 ? "Em entrega" : progressPercent >= 75 ? "No prazo" : "Em risco";
  const healthColor = !hasPendingTasks ? "#22c55e" : progressPercent >= 90 ? "#3b82f6" : progressPercent >= 75 ? "#22c55e" : "#f59e0b";
  const healthBg = !hasPendingTasks ? "#f0fdf4" : progressPercent >= 90 ? "#eff6ff" : progressPercent >= 75 ? "#f0fdf4" : "#fefce8";

  // Sidebar documents from project files (non-image)
  const sidebarDocs = useMemo(
    () =>
      projectFiles
        .filter((f) => !f.mime_type?.includes("image") && !f.mime_type?.includes("video"))
        .slice(0, 10)
        .map((f) => ({ id: f.id, name: f.name, type: f.mime_type ?? "" })),
    [projectFiles]
  );

  // Tasks sorted: incomplete first, then by priority
  const sortedTasks = useMemo(
    () => [...tasks].sort((a, b) => {
      if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
      if (a.is_completed && b.is_completed) {
        const da = a.completed_at ?? a.due_date ?? "";
        const db = b.completed_at ?? b.due_date ?? "";
        return db.localeCompare(da);
      }
      const priorities = ["urgente", "alta", "media", "baixa"];
      return priorities.indexOf(a.priority ?? "baixa") - priorities.indexOf(b.priority ?? "baixa");
    }),
    [tasks]
  );

  return (
    <PortalLayout
      sidebarCollapsed={sidebarCollapsed}
      header={
        <PortalHeader
          projectName={project.name}
          clientName={project.client}
          clientCompany={project.client_company}
          pendingApprovals={pendingApprovals}
          onNavChange={setActiveNav}
          activeNav={activeNav}
        />
      }
      sidebar={
        <PortalSidebar
          projectName={project.name}
          clientCompany={project.client_company}
          activeItem={sidebarItem}
          onItemChange={setSidebarItem}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          documents={sidebarDocs}
        />
      }
      main={activeNav === "about" ? (
          <PortalAboutSection
            projectName={project.name}
            clientCompany={project.client_company}
            data={(project.portal_about ?? {}) as ProjectPortalAbout}
          />
        ) : (
        <div className="space-y-6">
          {/* Welcome Banner */}
          <PortalWelcomeBanner
            clientName={project.client}
            projectName={project.name}
          />

          {/* Delivery Link Card */}
          {deliverySlug && <a
            href={`/entrega/${deliverySlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 rounded-xl border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 p-5 transition-all hover:border-orange-300 hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
              <IconPackage className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-zinc-900">
                Portal de Entrega — {project.name}
              </h3>
              <p className="mt-0.5 text-sm text-zinc-500">
                Acesse todos os entregaveis finais do projeto
              </p>
            </div>
            <IconExternalLink className="h-5 w-5 text-orange-400 transition-transform group-hover:translate-x-0.5" />
          </a>}

          {/* Project Quick Links */}
          {hasProjectLinks && (
            <div className="grid gap-3 sm:grid-cols-2">
              {aboutData.onboarding_url && (
                <a
                  href={aboutData.onboarding_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-xl border bg-white p-4 transition-all hover:border-orange-200 hover:bg-orange-50/50 hover:shadow-sm"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                    <IconPresentation className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900">Apresentacao</p>
                    <p className="text-xs text-zinc-500">Onboarding do projeto</p>
                  </div>
                  <IconExternalLink className="h-4 w-4 flex-shrink-0 text-zinc-300 group-hover:text-orange-400" />
                </a>
              )}
              {aboutData.guide_url && (
                <a
                  href={aboutData.guide_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-xl border bg-white p-4 transition-all hover:border-blue-200 hover:bg-blue-50/50 hover:shadow-sm"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <IconBook className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900">Guia de Boas-Vindas</p>
                    <p className="text-xs text-zinc-500">Politicas e acessos</p>
                  </div>
                  <IconExternalLink className="h-4 w-4 flex-shrink-0 text-zinc-300 group-hover:text-blue-400" />
                </a>
              )}
              {aboutData.briefing_url && (
                <a
                  href={aboutData.briefing_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-xl border bg-white p-4 transition-all hover:border-emerald-200 hover:bg-emerald-50/50 hover:shadow-sm"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                    <IconForms className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900">Briefing</p>
                    <p className="text-xs text-zinc-500">Preencher briefing criativo</p>
                  </div>
                  <IconExternalLink className="h-4 w-4 flex-shrink-0 text-zinc-300 group-hover:text-emerald-400" />
                </a>
              )}
              {aboutData.drive_url && (
                <a
                  href={aboutData.drive_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-xl border bg-white p-4 transition-all hover:border-yellow-200 hover:bg-yellow-50/50 hover:shadow-sm"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600">
                    <IconBrandGoogleDrive className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900">Google Drive</p>
                    <p className="text-xs text-zinc-500">Pasta de arquivos</p>
                  </div>
                  <IconExternalLink className="h-4 w-4 flex-shrink-0 text-zinc-300 group-hover:text-yellow-500" />
                </a>
              )}
            </div>
          )}

          {/* Main Tabs */}
          <PortalMainTabs activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Tab Content */}
          {activeTab === "tasks" && (
            <div className="space-y-6">
              {/* Project Progress Stepper */}
              <PortalTrackStepper
                phases={phases}
                healthLabel={healthLabel}
                healthColor={healthColor}
                healthBg={healthBg}
                dueDate={project.due_date_end}
              />

              {/* Client Tasks */}
              <div className="rounded-xl border bg-white">
                <div className="flex items-center justify-between border-b px-5 py-3">
                  <h3 className="text-sm font-semibold text-zinc-900">
                    Tarefas do Projeto
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    {completedCount}/{totalCount} concluidas
                  </Badge>
                </div>

                <div className="divide-y">
                  {sortedTasks.length === 0 && (
                    <div className="px-5 py-8 text-center">
                      <IconCircleCheck className="mx-auto h-8 w-8 text-green-400" />
                      <p className="mt-2 text-sm text-zinc-500">
                        Nenhuma tarefa cadastrada ainda.
                      </p>
                    </div>
                  )}

                  {!hasPendingTasks && sortedTasks.length > 0 && (
                    <div className="flex items-center gap-3 bg-green-50/50 px-5 py-3">
                      <IconCircleCheck className="h-5 w-5 text-green-500" />
                      <p className="text-sm font-medium text-green-700">
                        Todas as {totalCount} tarefas foram concluidas com sucesso!
                      </p>
                    </div>
                  )}
                  {hasPendingTasks && (
                    <div className="flex items-center gap-3 bg-blue-50/50 px-5 py-3">
                      <IconClock className="h-5 w-5 text-blue-500" />
                      <p className="text-sm font-medium text-blue-700">
                        {completedCount} de {totalCount} concluidas — {totalCount - completedCount} pendente{totalCount - completedCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  )}

                  {sortedTasks.slice(0, 20).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-zinc-50"
                    >
                      {/* Status circle */}
                      <div
                        className={cn(
                          "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2",
                          task.is_completed
                            ? "border-green-500 bg-green-500"
                            : task.status === "em_andamento"
                              ? "border-blue-400"
                              : "border-zinc-300"
                        )}
                      >
                        {task.is_completed && (
                          <IconCheck className="h-3 w-3 text-white" />
                        )}
                      </div>

                      {/* Title */}
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "text-sm",
                            task.is_completed
                              ? "text-zinc-400 line-through"
                              : "text-zinc-800"
                          )}
                        >
                          {task.title}
                        </p>
                      </div>

                      {/* Priority */}
                      {task.priority && task.priority !== "media" && !task.is_completed && (
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px]",
                            PRIORITY_COLORS[task.priority] ?? ""
                          )}
                        >
                          {task.priority === "urgente"
                            ? "Urgente"
                            : task.priority === "alta"
                              ? "Alta"
                              : task.priority}
                        </Badge>
                      )}

                      {/* Due date */}
                      {task.due_date && (
                        <span className="flex-shrink-0 text-xs text-zinc-400">
                          {formatDate(task.due_date)}
                        </span>
                      )}
                    </div>
                  ))}

                  {sortedTasks.length > 20 && (
                    <div className="px-5 py-3 text-center text-xs text-zinc-400">
                      +{sortedTasks.length - 20} tarefas adicionais
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "files" && (
            <PortalFilesTab files={projectFiles} />
          )}

          {activeTab === "reports" && (
            <PortalReportsTab
              taskSummary={{
                total: totalCount,
                completed: completedCount,
                inProgress: inProgressCount,
                overdue: overdueCount,
                pendingApprovals,
              }}
              progressPercent={progressPercent}
              dueDate={project.due_date_end}
              projectStatus={project.status}
              latestUpdate={latestUpdate}
            />
          )}
          </div>
        )
      }
      rightPanel={
        <div className="p-4">
          <PortalLatestDocs files={projectFiles} maxItems={6} />
        </div>
      }
    />
  );
}
