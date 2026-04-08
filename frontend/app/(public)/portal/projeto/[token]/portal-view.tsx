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
  IconLayoutBoard,
  IconArrowRight,
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

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "\u2014";
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ─── Link Card (TBO design) ────────────────────────────────────────────────

function LinkCard({
  href,
  number,
  label,
  description,
  icon: Icon,
}: {
  href: string;
  number: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-4 rounded-lg p-5 transition-all"
      style={{
        backgroundColor: "#fff",
        border: "1px solid #d9d4cd",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#c45a1a";
        e.currentTarget.style.backgroundColor = "#faf8f5";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#d9d4cd";
        e.currentTarget.style.backgroundColor = "#fff";
      }}
    >
      <span
        className="text-xs font-medium"
        style={{ color: "#c45a1a", minWidth: "24px" }}
      >
        {number}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 flex-shrink-0 text-[#c45a1a]" />
          <p className="text-sm font-medium" style={{ color: "#1a1a1a" }}>
            {label}
          </p>
        </div>
        <p className="mt-1 text-xs" style={{ color: "#8a8580" }}>
          {description}
        </p>
      </div>
      <IconArrowRight
        className="h-4 w-4 flex-shrink-0 transition-transform group-hover:translate-x-1"
        style={{ color: "#c45a1a", opacity: 0.5 }}
      />
    </a>
  );
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
  const [activeNav, setActiveNav] = useState("about");
  const [sidebarItem, setSidebarItem] = useState("about");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Sync sidebar → content
  function handleSidebarChange(key: string) {
    setSidebarItem(key);
    if (key === "home") {
      setActiveNav("home");
      setActiveTab("tasks");
    } else if (key === "tasks") {
      setActiveNav("home");
      setActiveTab("tasks");
    } else if (key === "analytics") {
      setActiveNav("home");
      setActiveTab("reports");
    } else if (key === "documents") {
      setActiveNav("home");
      setActiveTab("files");
    } else if (key === "about") {
      setActiveNav("about");
    }
  }

  function handleNavChange(nav: string) {
    setActiveNav(nav);
    if (nav === "home") setSidebarItem("home");
    else if (nav === "about") setSidebarItem("about");
  }

  function handleTabChange(tab: PortalTabId) {
    setActiveTab(tab);
    if (tab === "tasks") setSidebarItem("home");
    else if (tab === "files") setSidebarItem("documents");
    else if (tab === "reports") setSidebarItem("analytics");
  }

  // Delivery link
  const deliverySlug = deliveryToken;

  // Project links from portal_about
  const aboutData = (project.portal_about ?? {}) as ProjectPortalAbout;
  const hasProjectLinks = !!(aboutData.onboarding_url || aboutData.guide_url || aboutData.briefing_url || aboutData.drive_url || aboutData.miro_url);

  const hasPendingTasks = tasks.some((t) => !t.is_completed);

  // Build stepper phases — sequential: completed → first incomplete = in_progress → rest = pending
  const phases = useMemo<TrackPhase[]>(() => {
    if (sections.length === 0) {
      return [
        { key: "briefing", label: "Briefing", status: hasPendingTasks ? "in_progress" : "completed" },
        { key: "creation", label: "Criacao", status: "pending" },
        { key: "execution", label: "Execucao", status: "pending" },
        { key: "delivery", label: "Entrega", status: "pending" },
      ];
    }
    let foundFirstIncomplete = false;
    return sections.map((s) => {
      const sectionTasks = tasks.filter((t) => t.section_id === s.id);
      const allDone = sectionTasks.length > 0 && sectionTasks.every((t) => t.is_completed);
      const label = s.title.replace(/^\d+\s*[-—]\s*/, "");
      if (allDone) {
        return { key: s.id, label, status: "completed" as const };
      }
      if (!foundFirstIncomplete) {
        foundFirstIncomplete = true;
        return { key: s.id, label, status: "in_progress" as const };
      }
      return { key: s.id, label, status: "pending" as const };
    });
  }, [sections, tasks, hasPendingTasks]);

  const healthLabel = !hasPendingTasks ? "Entregue" : progressPercent >= 90 ? "Em entrega" : progressPercent >= 75 ? "No prazo" : "Em risco";
  const healthColor = !hasPendingTasks ? "#22c55e" : progressPercent >= 90 ? "#3b82f6" : progressPercent >= 75 ? "#22c55e" : "#f59e0b";
  const healthBg = !hasPendingTasks ? "#f0fdf4" : progressPercent >= 90 ? "#eff6ff" : progressPercent >= 75 ? "#f0fdf4" : "#fefce8";

  // Sidebar docs
  const sidebarDocs = useMemo(
    () =>
      projectFiles
        .filter((f) => !f.mime_type?.includes("image") && !f.mime_type?.includes("video"))
        .slice(0, 10)
        .map((f) => ({ id: f.id, name: f.name, type: f.mime_type ?? "" })),
    [projectFiles]
  );

  // Sorted tasks — respect section order (project journey), then task order within section
  const sortedTasks = useMemo(() => {
    const sectionOrder = new Map(sections.map((s, i) => [s.id, i]));
    return [...tasks].sort((a, b) => {
      const sa = sectionOrder.get(a.section_id ?? "") ?? 999;
      const sb = sectionOrder.get(b.section_id ?? "") ?? 999;
      return sa - sb; // keep original order_index within same section (already sorted by query)
    });
  }, [tasks, sections]);

  // Count link cards for numbering
  let linkNum = 0;

  return (
    <PortalLayout
      sidebarCollapsed={sidebarCollapsed}
      header={
        <PortalHeader
          projectName={project.name}
          clientName={project.client}
          clientCompany={project.client_company}
          logoUrl={aboutData.logo_url}
          pendingApprovals={pendingApprovals}
          onNavChange={handleNavChange}
          activeNav={activeNav}
        />
      }
      sidebar={
        <PortalSidebar
          projectName={project.name}
          clientCompany={project.client_company}
          activeItem={sidebarItem}
          onItemChange={handleSidebarChange}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          documents={sidebarDocs}
        />
      }
      main={activeNav === "about" ? (
          <PortalAboutSection
            projectName={project.name}
            clientCompany={project.client_company}
            data={aboutData}
          />
        ) : (
        <div className="space-y-8">
          {/* Welcome Banner */}
          <PortalWelcomeBanner
            clientName={project.client}
            clientCompany={project.client_company}
            projectName={project.name}
          />

          {/* Delivery Link */}
          {deliverySlug && (
            <a
              href={`/entrega/${deliverySlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 rounded-lg p-5 transition-all"
              style={{
                backgroundColor: "#1a1a1a",
                border: "1px solid #333",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#c45a1a";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#333";
              }}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: "#c45a1a" }}
              >
                <IconPackage className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white">
                  Portal de Entrega — {project.name}
                </h3>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Acesse todos os entregaveis finais do projeto
                </p>
              </div>
              <IconArrowRight className="h-4 w-4 text-zinc-500 transition-transform group-hover:translate-x-1 group-hover:text-white" />
            </a>
          )}

          {/* Project Quick Links — TBO numbered style */}
          {hasProjectLinks && (
            <div>
              <div className="mb-4 flex items-center gap-3">
                <span
                  className="text-xs font-medium uppercase tracking-[0.2em]"
                  style={{ color: "#c45a1a" }}
                >
                  Acessos Rapidos
                </span>
                <div className="flex-1 h-px" style={{ backgroundColor: "#d9d4cd" }} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {aboutData.onboarding_url && (
                  <LinkCard
                    href={aboutData.onboarding_url}
                    number={String(++linkNum).padStart(2, "0")}
                    label="Apresentacao"
                    description="Onboarding e equipe do projeto"
                    icon={IconPresentation}
                  />
                )}
                {aboutData.guide_url && (
                  <LinkCard
                    href={aboutData.guide_url}
                    number={String(++linkNum).padStart(2, "0")}
                    label="Guia de Boas-Vindas"
                    description="Politicas, acessos e fluxo de trabalho"
                    icon={IconBook}
                  />
                )}
                {aboutData.briefing_url && (
                  <LinkCard
                    href={aboutData.briefing_url}
                    number={String(++linkNum).padStart(2, "0")}
                    label="Briefing Criativo"
                    description="Preencher briefing interdisciplinar"
                    icon={IconForms}
                  />
                )}
                {aboutData.drive_url && (
                  <LinkCard
                    href={aboutData.drive_url}
                    number={String(++linkNum).padStart(2, "0")}
                    label="Google Drive"
                    description="Pasta de arquivos do projeto"
                    icon={IconBrandGoogleDrive}
                  />
                )}
                {aboutData.miro_url && (
                  <LinkCard
                    href={aboutData.miro_url}
                    number={String(++linkNum).padStart(2, "0")}
                    label="Miro"
                    description="Direcao criativa e retornos visuais"
                    icon={IconLayoutBoard}
                  />
                )}
              </div>
            </div>
          )}

          {/* Main Tabs */}
          <PortalMainTabs activeTab={activeTab} onTabChange={handleTabChange} />

          {/* Tab Content */}
          {activeTab === "tasks" && (
            <div className="space-y-6">
              {/* Stepper */}
              <PortalTrackStepper
                phases={phases}
                healthLabel={healthLabel}
                healthColor={healthColor}
                healthBg={healthBg}
                dueDate={project.due_date_end}
              />

              {/* Tasks */}
              <div className="overflow-hidden rounded-lg" style={{ border: "1px solid #d9d4cd", backgroundColor: "#fff" }}>
                <div
                  className="flex items-center justify-between px-5 py-3"
                  style={{ borderBottom: "1px solid #d9d4cd" }}
                >
                  <h3
                    className="text-xs font-medium uppercase tracking-wider"
                    style={{ color: "#1a1a1a" }}
                  >
                    Tarefas do Projeto
                  </h3>
                  <span className="text-xs" style={{ color: "#8a8580" }}>
                    {completedCount}/{totalCount} concluidas
                  </span>
                </div>

                <div>
                  {sortedTasks.length === 0 && (
                    <div className="px-5 py-8 text-center">
                      <IconCircleCheck className="mx-auto h-8 w-8" style={{ color: "#c45a1a", opacity: 0.3 }} />
                      <p className="mt-2 text-sm" style={{ color: "#8a8580" }}>
                        Nenhuma tarefa cadastrada ainda.
                      </p>
                    </div>
                  )}

                  {!hasPendingTasks && sortedTasks.length > 0 && (
                    <div
                      className="flex items-center gap-3 px-5 py-3"
                      style={{ backgroundColor: "#f0fdf4" }}
                    >
                      <IconCircleCheck className="h-4 w-4 text-green-600" />
                      <p className="text-xs font-medium text-green-700">
                        Todas as {totalCount} tarefas concluidas
                      </p>
                    </div>
                  )}

                  {hasPendingTasks && (
                    <div
                      className="flex items-center gap-3 px-5 py-3"
                      style={{ backgroundColor: "#faf8f5" }}
                    >
                      <IconClock className="h-4 w-4" style={{ color: "#c45a1a" }} />
                      <p className="text-xs font-medium" style={{ color: "#6b6560" }}>
                        {completedCount} de {totalCount} concluidas — {totalCount - completedCount} pendente{totalCount - completedCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  )}

                  {sortedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-4 px-5 py-3 transition-colors"
                      style={{ borderTop: "1px solid #ebe7e1" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#faf8f5";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      {/* Status */}
                      <div
                        className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded"
                        style={{
                          border: task.is_completed
                            ? "none"
                            : task.status === "em_andamento"
                              ? "1.5px solid #c45a1a"
                              : "1.5px solid #d9d4cd",
                          backgroundColor: task.is_completed ? "#c45a1a" : "transparent",
                        }}
                      >
                        {task.is_completed && (
                          <IconCheck className="h-2.5 w-2.5 text-white" />
                        )}
                      </div>

                      {/* Title */}
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn("text-sm", task.is_completed && "line-through")}
                          style={{
                            color: task.is_completed ? "#b5b0aa" : "#1a1a1a",
                          }}
                        >
                          {task.title}
                        </p>
                      </div>

                      {/* Priority */}
                      {task.priority && task.priority !== "media" && !task.is_completed && (
                        <span
                          className="text-[10px] font-medium uppercase tracking-wider"
                          style={{
                            color: task.priority === "urgente" ? "#dc2626" : task.priority === "alta" ? "#c45a1a" : "#8a8580",
                          }}
                        >
                          {task.priority}
                        </span>
                      )}

                      {/* Date */}
                      {task.due_date && (
                        <span className="flex-shrink-0 text-xs" style={{ color: "#b5b0aa" }}>
                          {formatDate(task.due_date)}
                        </span>
                      )}
                    </div>
                  ))}

                  {/* All tasks shown */}
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
      )}
      rightPanel={
        <div className="p-4">
          <PortalLatestDocs files={projectFiles} maxItems={6} />
        </div>
      }
    />
  );
}
