"use client";

import { useState, useCallback, useMemo } from "react";
import {
  IconShare,
  IconSparkles,
  IconAdjustments,
  IconLayoutDashboard,
  IconList,
  IconLayoutKanban,
  IconChartArrowsVertical,
  IconPaperclip,
  IconHistory,
  IconChartBar,
  IconGlobe,
  IconCalendar,
  IconSpeakerphone,
  IconAlertTriangle,
  IconSettings,
  IconClipboardList,
  IconPackage,
  IconPlus,
  IconEyeOff,
  IconEye,
  IconRotate,
} from "@tabler/icons-react";
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { InlineEditable } from "@/components/ui/inline-editable";
import { useProjectTabsStore, type ProjectTabKey as StoreTabKey } from "@/stores/project-tabs-store";
import { useUpdateProject, useDeleteProject } from "@/features/projects/hooks/use-projects";
import { useSaveProjectAsTemplate } from "@/features/projects/hooks/use-project-templates";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ProjectStatusBadge } from "./project-status-badge";
import { ProjectDetailsDialog } from "./project-details-dialog";
import { ProjectAiSheet } from "./project-ai-sheet";
import { MemberAvatarStack, type MemberInfo } from "./member-avatar-stack";
import { MembersDrawer } from "./members-drawer";
import { ProjectActionsMenu } from "./project-actions-menu";
import { ProjectDuplicateDialog } from "./project-duplicate-dialog";
import { ProjectShareSheet } from "./project-share-sheet";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";
import type { UserOption } from "@/components/ui/user-selector";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];

// ─── Tab config ──────────────────────────────────────────────────────────────

const TABS = [
  // ── Planejamento ──
  { key: "overview", label: "Visão Geral", icon: IconLayoutDashboard, group: "planejamento" },
  { key: "list", label: "Lista", icon: IconList, group: "planejamento" },
  { key: "board", label: "Board", icon: IconLayoutKanban, group: "planejamento" },
  { key: "gantt", label: "Gantt", icon: IconChartArrowsVertical, group: "planejamento" },
  { key: "calendar", label: "Calendário", icon: IconCalendar, group: "planejamento" },
  // ── Gestão ──
  { key: "files", label: "Arquivos", icon: IconPaperclip, group: "gestao" },
  { key: "updates", label: "Updates", icon: IconSpeakerphone, group: "gestao" },
  { key: "activity", label: "Atividade", icon: IconHistory, group: "gestao" },
  { key: "dashboard", label: "Dashboard", icon: IconChartBar, group: "gestao" },
  { key: "overdue", label: "Atrasadas", icon: IconAlertTriangle, group: "gestao" },
  // ── Admin ──
  { key: "intake", label: "Intake", icon: IconClipboardList, group: "admin" },
  { key: "settings", label: "Configurações", icon: IconSettings, group: "admin" },
  { key: "portal", label: "Portal do Cliente", icon: IconGlobe, group: "admin" },
  { key: "entregas", label: "Entregas", icon: IconPackage, group: "admin" },
] as const;

export type ProjectTabKey = (typeof TABS)[number]["key"];

// ─── Props ───────────────────────────────────────────────────────────────────

interface ProjectTopbarProps {
  project: ProjectRow;
  users?: UserOption[];
  members?: MemberInfo[];
  allProfiles?: MemberInfo[];
  activeTab: ProjectTabKey;
  onTabChange: (tab: ProjectTabKey) => void;
  onAddMember?: (member: MemberInfo) => void;
  onRemoveMember?: (memberId: string) => void;
  membersOpen?: boolean;
  onMembersOpenChange?: (open: boolean) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ProjectTopbar({
  project,
  users = [],
  members = [],
  allProfiles = [],
  activeTab,
  onTabChange,
  onAddMember,
  onRemoveMember,
  membersOpen: membersOpenProp,
  onMembersOpenChange,
}: ProjectTopbarProps) {
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const saveAsTemplate = useSaveProjectAsTemplate();
  const router = useRouter();
  const { toast } = useToast();
  const tenantId = useAuthStore((s) => s.tenantId);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [membersOpenLocal, setMembersOpenLocal] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [aiSheetOpen, setAiSheetOpen] = useState(false);

  const membersOpen = membersOpenProp ?? membersOpenLocal;
  const setMembersOpen = onMembersOpenChange ?? setMembersOpenLocal;

  const handleNameSave = (name: string) => {
    updateProject.mutate({ id: project.id, updates: { name } });
  };

  const handleStatusChange = (status: string) => {
    updateProject.mutate({ id: project.id, updates: { status } });
  };

  const handleSaveAsTemplate = () => {
    if (!tenantId) return;
    saveAsTemplate.mutate({
      projectId: project.id,
      tenantId,
      name: project.name,
      description: `Template criado a partir do projeto "${project.name}"`,
    });
  };

  const handleArchive = () => {
    updateProject.mutate(
      { id: project.id, updates: { status: "cancelado" } },
      {
        onSuccess: () => toast({ title: "Projeto cancelado" }),
        onError: () => toast({ title: "Erro ao cancelar projeto", variant: "destructive" }),
      }
    );
  };

  const handleDeleteConfirm = () => {
    deleteProject.mutate(project.id, {
      onSuccess: () => {
        toast({ title: "Projeto excluído" });
        router.push("/projetos");
      },
      onError: () =>
        toast({ title: "Erro ao excluir", variant: "destructive" }),
    });
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border/50 bg-background">
      {/* ── TOP BAR ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 pb-0 pt-3">
        {/* Left: title */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 pb-2.5">
            <div
              className="flex size-7 shrink-0 items-center justify-center rounded-md text-[13px] text-white"
              style={{ background: "linear-gradient(135deg, #e85102, #c44000)" }}
            >
              {project.name?.charAt(0)?.toUpperCase() ?? "P"}
            </div>
            <InlineEditable
              value={project.name}
              onSave={handleNameSave}
              className="text-base font-medium"
            />
            {project.code && (
              <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                {project.code}
              </span>
            )}
            <ProjectStatusBadge
              status={project.status ?? "em_andamento"}
              onChange={handleStatusChange}
            />
          </div>
        </div>

        {/* Right: members + action buttons */}
        <div className="flex shrink-0 items-center gap-2 pb-2.5">
          {members.length > 0 && (
            <button type="button" onClick={() => setMembersOpen(true)} className="focus:outline-none">
              <MemberAvatarStack members={members} />
            </button>
          )}

          <Button
            size="sm"
            className="gap-1.5 text-xs"
            style={{ backgroundColor: "#e85102", borderColor: "#e85102" }}
            onClick={() => setShareOpen(true)}
          >
            <IconShare className="size-3.5" />
            Compartilhar
          </Button>

          <ProjectActionsMenu
            onEditDetails={() => setDetailsOpen(true)}
            onDuplicate={() => setDuplicateDialogOpen(true)}
            onSaveAsTemplate={handleSaveAsTemplate}
            onArchive={handleArchive}
            onSettings={() => router.push("/projetos/configuracoes")}
            onDelete={() => setDeleteOpen(true)}
            onAskAi={() => setAiSheetOpen(true)}
            duplicating={false}
            savingTemplate={saveAsTemplate.isPending}
            archiving={updateProject.isPending}
          />
        </div>
      </div>

      {/* ── TABS BAR (D&D + context menu) ──────────────────────── */}
      <ProjectTabsBar activeTab={activeTab} onTabChange={onTabChange} />

      {/* ── DIALOGS & SHEETS ─────────────────────────────────── */}
      <ProjectDetailsDialog
        project={project}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir projeto"
        description={`Excluir "${project.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={handleDeleteConfirm}
      />

      <ProjectDuplicateDialog
        project={project}
        open={duplicateDialogOpen}
        onOpenChange={setDuplicateDialogOpen}
      />

      <ProjectShareSheet
        project={project}
        open={shareOpen}
        onOpenChange={setShareOpen}
      />

      <MembersDrawer
        open={membersOpen}
        onOpenChange={setMembersOpen}
        members={members}
        allProfiles={allProfiles}
        onAddMember={(m) => onAddMember?.(m)}
        onRemoveMember={(id) => onRemoveMember?.(id)}
      />

      <ProjectAiSheet
        open={aiSheetOpen}
        onOpenChange={setAiSheetOpen}
        projectId={project.id}
        projectName={project.name}
      />
    </div>
  );
}

// ─── Sortable Tab Item ──────────────────────────────────────────────────────

function SortableTab({
  tabKey,
  label,
  icon: Icon,
  isActive,
  onClick,
  onHide,
}: {
  tabKey: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  onClick: () => void;
  onHide: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tabKey });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <button
          ref={setNodeRef}
          type="button"
          style={style}
          {...attributes}
          {...listeners}
          onClick={onClick}
          className={cn(
            "flex items-center gap-1.5 border-b-2 px-3 py-2 text-[13px] transition-colors select-none whitespace-nowrap",
            isDragging && "cursor-grabbing",
            isActive
              ? "border-[#e85102] font-medium text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="size-3.5 opacity-65" />
          {label}
        </button>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onHide} className="gap-2 text-xs">
          <IconEyeOff className="size-3.5" />
          Ocultar tab
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

// ─── Tabs Bar with D&D + hide/show ──────────────────────────────────────────

function ProjectTabsBar({
  activeTab,
  onTabChange,
}: {
  activeTab: ProjectTabKey;
  onTabChange: (key: ProjectTabKey) => void;
}) {
  const { tabOrder, hiddenTabs, reorder, hideTab, showTab, resetTabs } =
    useProjectTabsStore();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const visibleTabs = useMemo(() => {
    // Use stored order, filter out hidden, reconcile with TABS definition
    const tabMap = new Map(TABS.map((t) => [t.key, t]));
    const ordered = tabOrder
      .filter((key) => !hiddenTabs.includes(key) && tabMap.has(key))
      .map((key) => tabMap.get(key)!);
    // Add any new tabs not yet in tabOrder
    for (const tab of TABS) {
      if (!tabOrder.includes(tab.key) && !hiddenTabs.includes(tab.key)) {
        ordered.push(tab);
      }
    }
    return ordered;
  }, [tabOrder, hiddenTabs]);

  const hiddenTabDefs = useMemo(() => {
    return TABS.filter((t) => hiddenTabs.includes(t.key));
  }, [hiddenTabs]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const keys = visibleTabs.map((t) => t.key as StoreTabKey);
      const oldIndex = keys.indexOf(active.id as StoreTabKey);
      const newIndex = keys.indexOf(over.id as StoreTabKey);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(keys, oldIndex, newIndex);
      // Preserve hidden tabs in their original positions for the full order
      const fullOrder = [
        ...reordered,
        ...hiddenTabs.filter((k) => !reordered.includes(k)),
      ];
      reorder(fullOrder);
    },
    [visibleTabs, hiddenTabs, reorder],
  );

  const handleHide = useCallback(
    (key: ProjectTabKey) => {
      hideTab(key as StoreTabKey);
      // If hiding the active tab, switch to first visible
      if (key === activeTab) {
        const next = visibleTabs.find((t) => t.key !== key);
        if (next) onTabChange(next.key);
      }
    },
    [hideTab, activeTab, visibleTabs, onTabChange],
  );

  return (
    <div
      className="flex items-center gap-0 overflow-x-auto border-b border-border/50 px-4"
      style={{ scrollbarWidth: "none" }}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={visibleTabs.map((t) => t.key)}
          strategy={horizontalListSortingStrategy}
        >
          {visibleTabs.map(({ key, label, icon, group }, idx) => {
            const prevGroup = idx > 0 ? visibleTabs[idx - 1].group : group;
            const showSep = idx > 0 && group !== prevGroup;
            return (
              <>
                {showSep && (
                  <div key={`sep-${key}`} className="mx-1 h-4 w-px bg-border/50 shrink-0" />
                )}
                <SortableTab
                  key={key}
                  tabKey={key}
                  label={label}
                  icon={icon}
                  isActive={activeTab === key}
                  onClick={() => onTabChange(key)}
                  onHide={() => handleHide(key)}
                />
              </>
            );
          })}
        </SortableContext>
      </DndContext>

      {/* Show hidden tabs menu */}
      {hiddenTabDefs.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="ml-1 flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <IconPlus className="size-3.5" />
              <span className="tabular-nums">{hiddenTabDefs.length}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {hiddenTabDefs.map(({ key, label, icon: Icon }) => (
              <DropdownMenuItem
                key={key}
                onClick={() => showTab(key as StoreTabKey)}
                className="gap-2 text-xs"
              >
                <Icon className="size-3.5" />
                {label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={resetTabs}
              className="gap-2 text-xs"
            >
              <IconRotate className="size-3.5" />
              Restaurar todas
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
