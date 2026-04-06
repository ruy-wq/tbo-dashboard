"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  IconGlobe,
  IconLink,
  IconCheck,
  IconExternalLink,
  IconCircleCheck,
  IconClock,
  IconPackage,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useUpdateProject } from "@/features/projects/hooks/use-projects";
import { useAuthStore } from "@/stores/auth-store";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { PortalLayout } from "@/features/projects/components/portal/portal-layout";
import { PortalHeader } from "@/features/projects/components/portal/portal-header";
import { PortalSidebar } from "@/features/projects/components/portal/portal-sidebar";
import { PortalWelcomeBanner } from "@/features/projects/components/portal/portal-welcome-banner";
import { PortalMainTabs, type PortalTabId } from "@/features/projects/components/portal/portal-main-tabs";
import { PortalFilesTab, type PortalFile } from "@/features/projects/components/portal/portal-files-tab";
import { PortalReportsTab } from "@/features/projects/components/portal/portal-reports-tab";
import { PortalLatestDocs } from "@/features/projects/components/portal/portal-latest-docs";
import { PortalTrackStepper, type TrackPhase } from "@/features/projects/components/portal/portal-track-stepper";
import { PortalAboutSection } from "@/features/projects/components/portal/portal-about-section";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ProjectPortalProps {
  projectId: string;
  projectName?: string;
  dueDate?: string | null;
  bus?: string[] | null;
  portalToken?: string | null;
}

interface PortalTask {
  id: string;
  title: string;
  status: string;
  is_completed: boolean;
  due_date: string | null;
  priority: string | null;
  section_id: string | null;
  completed_at: string | null;
}

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

// ─── Data Hooks ─────────────────────────────────────────────────────────────

function usePortalTasks(projectId: string) {
  return useQuery({
    queryKey: ["portal-tasks", projectId],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("os_tasks" as never)
        .select("id, title, status, is_completed, due_date, priority, section_id, completed_at")
        .eq("project_id", projectId)
        .is("parent_id", null)
        .in("status", ["em_andamento", "revisao", "concluida", "a_fazer"])
        .order("order_index", { ascending: true });
      return (data ?? []) as unknown as PortalTask[];
    },
    staleTime: 60_000,
    enabled: !!projectId,
  });
}

function usePortalProjectFiles(projectId: string) {
  return useQuery({
    queryKey: ["portal-project-files", projectId],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("project_files")
        .select("id, name, mime_type, size_bytes, web_view_link, web_content_link, created_at, updated_at")
        .eq("project_id", projectId)
        .order("updated_at", { ascending: false })
        .limit(50);
      return (data ?? []) as PortalFile[];
    },
    staleTime: 60_000,
    enabled: !!projectId,
  });
}

function useProjectClient(projectId: string) {
  return useQuery({
    queryKey: ["project-client-info", projectId],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("projects")
        .select("client, client_company, status, due_date_end")
        .eq("id", projectId)
        .single();
      return data as { client: string | null; client_company: string | null; status: string | null; due_date_end: string | null } | null;
    },
    staleTime: 60_000,
    enabled: !!projectId,
  });
}

interface DeliveryPreview {
  token: string;
  title: string;
  description: string | null;
  delivery_date: string | null;
  hero_subtitle: string | null;
  accent_color: string | null;
  cover_image_url: string | null;
  access_password: string | null;
  access_count: number;
  deliverables: { title: string; description: string; type: string; url: string }[];
}

function useDeliveryPreview(projectId: string) {
  return useQuery({
    queryKey: ["delivery-preview", projectId],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("project_deliveries" as never)
        .select("token, title, description, delivery_date, hero_subtitle, accent_color, cover_image_url, access_password, access_count, deliverables")
        .eq("project_id", projectId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return (data as DeliveryPreview | null) ?? null;
    },
    staleTime: 60_000,
    enabled: !!projectId,
  });
}

// Keep backwards-compatible hook
function useDeliveryToken(projectId: string) {
  const { data } = useDeliveryPreview(projectId);
  return { data: data?.token ?? null };
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function ProjectPortal({
  projectId,
  projectName,
  dueDate,
  bus,
  portalToken,
}: ProjectPortalProps) {
  const updateProject = useUpdateProject();
  const tenantId = useAuthStore((s) => s.tenantId);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<PortalTabId>("tasks");
  const [activeNav, setActiveNav] = useState("home");
  const [sidebarItem, setSidebarItem] = useState("home");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { data: tasks = [], isLoading: tasksLoading } = usePortalTasks(projectId);
  const { data: projectFiles = [], isLoading: filesLoading } = usePortalProjectFiles(projectId);
  const { data: clientInfo } = useProjectClient(projectId);
  const { data: deliveryToken } = useDeliveryToken(projectId);
  const { data: deliveryPreview } = useDeliveryPreview(projectId);

  const clientName = clientInfo?.client ?? null;
  const clientCompany = clientInfo?.client_company ?? null;

  // Portal URL
  const portalUrl = portalToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/portal/projeto/${portalToken}`
    : null;

  // Delivery URL (from project_deliveries table — unique per project)
  const deliveryUrl = deliveryToken
    ? `/entrega/${deliveryToken}`
    : null;

  // Metrics
  const completedCount = tasks.filter((t) => t.is_completed).length;
  const inProgressCount = tasks.filter((t) => !t.is_completed && t.status === "em_andamento").length;
  const overdueCount = tasks.filter((t) => !t.is_completed && t.due_date && new Date(t.due_date) < new Date()).length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isDelivered = progressPercent === 100;

  // Stepper phases
  const hasPendingTasks = tasks.some((t) => !t.is_completed);
  const phases = useMemo<TrackPhase[]>(() => [
    { key: "briefing", label: "Briefing", status: "completed" },
    { key: "creation", label: "Criacao", status: "completed" },
    { key: "execution", label: "Execucao", status: "completed" },
    { key: "delivery", label: "Entrega", status: hasPendingTasks ? "in_progress" : "completed" },
  ], [hasPendingTasks]);

  const healthLabel = !hasPendingTasks ? "Entregue" : progressPercent >= 90 ? "Em entrega" : progressPercent >= 75 ? "No prazo" : "Em risco";
  const healthColor = !hasPendingTasks ? "#22c55e" : progressPercent >= 90 ? "#3b82f6" : progressPercent >= 75 ? "#22c55e" : "#f59e0b";
  const healthBg = !hasPendingTasks ? "#f0fdf4" : progressPercent >= 90 ? "#eff6ff" : progressPercent >= 75 ? "#f0fdf4" : "#fefce8";

  // Sidebar docs
  const sidebarDocs = useMemo(
    () => projectFiles
      .filter((f) => !f.mime_type?.includes("image") && !f.mime_type?.includes("video"))
      .slice(0, 10)
      .map((f) => ({ id: f.id, name: f.name, type: f.mime_type ?? "" })),
    [projectFiles]
  );

  // Sorted tasks
  const sortedTasks = useMemo(
    () => [...tasks].sort((a, b) => {
      // Incomplete first, then by most recently completed (due_date desc as proxy)
      if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
      // Both completed: most recently completed first
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

  // Token management
  function handleGenerateToken() {
    const token = crypto.randomUUID();
    updateProject.mutate(
      { id: projectId, updates: { portal_token: token } as never },
      {
        onSuccess: () => toast.success("Link do portal gerado"),
        onError: () => toast.error("Erro ao gerar link"),
      },
    );
  }

  function handleCopy() {
    if (!portalUrl) return;
    navigator.clipboard.writeText(portalUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (tasksLoading || filesLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-60 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="-mx-4 -mt-4 lg:-mx-6">
      {/* Admin bar: token management */}
      <div className="flex items-center justify-between border-b bg-zinc-50 px-6 py-2">
        <p className="text-xs text-muted-foreground">
          Visualizacao do portal como o cliente ve
        </p>
        <div className="flex items-center gap-2">
          {portalUrl ? (
            <>
              <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs" onClick={handleCopy}>
                {copied ? <IconCheck className="size-3 text-green-500" /> : <IconLink className="size-3" />}
                {copied ? "Copiado" : "Copiar link"}
              </Button>
              <Button size="sm" variant="ghost" className="h-7" asChild>
                <a href={portalUrl} target="_blank" rel="noopener noreferrer">
                  <IconExternalLink className="size-3" />
                </a>
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1.5 text-xs"
              onClick={handleGenerateToken}
              disabled={updateProject.isPending}
            >
              <IconGlobe className="size-3" />
              {updateProject.isPending ? "Gerando..." : "Gerar link publico"}
            </Button>
          )}
        </div>
      </div>

      {/* Portal preview (embedded) */}
      <div className="border rounded-b-xl bg-zinc-50/50 overflow-hidden" style={{ height: "calc(100vh - 200px)" }}>
        <PortalLayout
          sidebarCollapsed={sidebarCollapsed}
          header={
            <PortalHeader
              projectName={projectName ?? "Projeto"}
              clientName={clientName}
              clientCompany={clientCompany}
              onNavChange={setActiveNav}
              activeNav={activeNav}
            />
          }
          sidebar={
            <PortalSidebar
              projectName={projectName ?? "Projeto"}
              clientCompany={clientCompany}
              activeItem={sidebarItem}
              onItemChange={setSidebarItem}
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
              documents={sidebarDocs}
            />
          }
          main={activeNav === "about" ? (
              <PortalAboutSection projectName={projectName ?? "AUMA"} clientCompany={clientCompany} />
            ) : (
              <div className="space-y-6">
              <PortalWelcomeBanner
                clientName={clientName}
                projectName={projectName ?? "Projeto"}
              />

              {/* Delivery preview */}
              {deliveryPreview && deliveryUrl && (
                <div className="rounded-xl border overflow-hidden">
                  {/* Header with cover */}
                  <div className="relative bg-zinc-900 p-5">
                    {deliveryPreview.cover_image_url && (
                      <>
                        <img
                          src={deliveryPreview.cover_image_url}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover opacity-30"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-900/80 to-transparent" />
                      </>
                    )}
                    <div className="relative z-10 flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <IconPackage className="h-4 w-4 text-orange-400" />
                          <span className="text-[10px] text-white/40 uppercase tracking-widest">
                            Entrega ativa
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-white">{deliveryPreview.title}</h3>
                        {deliveryPreview.hero_subtitle && (
                          <p className="text-xs text-white/40 mt-1">{deliveryPreview.hero_subtitle}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const url = `${window.location.origin}${deliveryUrl}`;
                            navigator.clipboard.writeText(url);
                          }}
                          className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white/60 hover:bg-white/20 hover:text-white transition-colors"
                        >
                          <IconLink className="h-3.5 w-3.5" />
                          Copiar link
                        </button>
                        <a
                          href={deliveryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-600 transition-colors"
                        >
                          <IconExternalLink className="h-3.5 w-3.5" />
                          Abrir
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Deliverables grid */}
                  <div className="p-4 bg-zinc-50">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                        {deliveryPreview.deliverables.length} entregaveis
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                        {deliveryPreview.access_count > 0 && (
                          <span>{deliveryPreview.access_count} acesso{deliveryPreview.access_count !== 1 ? "s" : ""}</span>
                        )}
                        {deliveryPreview.access_password && (
                          <span className="font-mono bg-white rounded px-1.5 py-0.5 border">
                            {deliveryPreview.access_password}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {deliveryPreview.deliverables.map((d, i) => (
                        <a
                          key={i}
                          href={d.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group rounded-lg bg-white border p-3 hover:shadow-sm hover:border-orange-200 transition-all"
                        >
                          <p className="text-sm font-medium text-zinc-900 truncate group-hover:text-orange-600 transition-colors">
                            {d.title}
                          </p>
                          <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">
                            {d.description}
                          </p>
                          <span className="inline-block mt-2 text-[10px] font-medium text-zinc-300 uppercase">
                            {d.type === "folder" ? "Pasta" : d.type === "link" ? "Link" : d.type.toUpperCase()}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <PortalMainTabs activeTab={activeTab} onTabChange={setActiveTab} />

              {activeTab === "tasks" && (
                <div className="space-y-6">
                  <PortalTrackStepper
                    phases={phases}
                    healthLabel={healthLabel}
                    healthColor={healthColor}
                    healthBg={healthBg}
                    dueDate={dueDate ?? null}
                  />

                  <div className="rounded-xl border bg-white">
                    <div className="flex items-center justify-between border-b px-5 py-3">
                      <h3 className="text-sm font-semibold text-zinc-900">Tarefas do Projeto</h3>
                      <Badge variant="secondary" className="text-xs">
                        {completedCount}/{totalCount} concluidas
                      </Badge>
                    </div>
                    <div className="divide-y">
                      {!hasPendingTasks && totalCount > 0 && (
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
                        <div key={task.id} className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-zinc-50">
                          <div className={cn(
                            "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2",
                            task.is_completed ? "border-green-500 bg-green-500" : task.status === "em_andamento" ? "border-blue-400" : "border-zinc-300"
                          )}>
                            {task.is_completed && <IconCheck className="h-3 w-3 text-white" />}
                          </div>
                          <p className={cn("min-w-0 flex-1 text-sm", task.is_completed ? "text-zinc-400 line-through" : "text-zinc-800")}>
                            {task.title}
                          </p>
                          {task.priority && task.priority !== "media" && !task.is_completed && (
                            <Badge variant="secondary" className={cn("text-[10px]", PRIORITY_COLORS[task.priority] ?? "")}>
                              {task.priority === "urgente" ? "Urgente" : task.priority === "alta" ? "Alta" : task.priority}
                            </Badge>
                          )}
                          {task.due_date && (
                            <span className="flex-shrink-0 text-xs text-zinc-400">{formatDate(task.due_date)}</span>
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

              {activeTab === "files" && <PortalFilesTab files={projectFiles} />}

              {activeTab === "reports" && (
                <PortalReportsTab
                  taskSummary={{ total: totalCount, completed: completedCount, inProgress: inProgressCount, overdue: overdueCount, pendingApprovals: 0 }}
                  progressPercent={progressPercent}
                  dueDate={dueDate ?? null}
                  projectStatus={clientInfo?.status ?? null}
                  latestUpdate={null}
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
      </div>
    </div>
  );
}
