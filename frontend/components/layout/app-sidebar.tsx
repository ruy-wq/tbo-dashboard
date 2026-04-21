"use client";

import { useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { IconSearch } from "@tabler/icons-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis, restrictToWindowEdges } from "@dnd-kit/modifiers";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useChatStore } from "@/features/chat/stores/chat-store";
import { useAuthStore } from "@/stores/auth-store";
import { useSidebarStore, undoSidebarReorder } from "@/stores/sidebar-store";
import { useSidebarSearch } from "@/hooks/use-sidebar-search";
import { useSidebarDnd } from "@/hooks/use-sidebar-dnd";
import { useSidebarPreferences } from "@/hooks/use-sidebar-preferences";
import { getIcon } from "@/lib/icons";
import { SIDEBAR_NAV_GROUPS, PINNED_NAV_ITEMS } from "@/lib/navigation";
import { SortableNavGroup } from "@/components/layout/sidebar/sortable-nav-group";
import { SortableNavItem } from "@/components/layout/sidebar/sortable-nav-item";
import { SidebarUserFooter } from "@/components/layout/sidebar/sidebar-user-footer";
import { WorkspaceSwitcher } from "@/components/layout/workspace-switcher";
import { cn } from "@/lib/utils";
import type { NavGroupItem } from "@/lib/navigation";

export function AppSidebar() {
  const pathname = usePathname();
  const modules = useAuthStore((s) => s.modules);
  const { query, setQuery, filteredGroups } = useSidebarSearch(SIDEBAR_NAV_GROUPS);
  const chatUnreadCounts = useChatStore((s) => s.unreadCounts);
  const chatTotalUnread = useMemo(
    () => Object.values(chatUnreadCounts).reduce((sum, n) => sum + n, 0),
    [chatUnreadCounts],
  );

  // Initialize sidebar store with default nav groups
  const initFromDefaults = useSidebarStore((s) => s.initFromDefaults);
  const groupOrder = useSidebarStore((s) => s.groupOrder);

  useEffect(() => {
    initFromDefaults(SIDEBAR_NAV_GROUPS);
  }, [initFromDefaults]);

  // Sync sidebar preferences with Supabase (debounced auto-save)
  useSidebarPreferences();

  const canSee = useCallback(
    (module: string) => modules.includes("*") || modules.includes(module),
    [modules],
  );

  // D&D setup
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const {
    activeDrag,
    overGroupLabel,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  } = useSidebarDnd();

  // ── Hub-scoped sidebar filtering ──────────────────────────────────
  // When inside a hub route, show only that hub's nav group
  const HUB_SCOPE: Record<string, string[]> = useMemo(() => ({
    "/projetos": ["TBO Projects"],
    "/tarefas": ["TBO Projects"],
    "/cultura": ["TBO Culture"],
    "/pessoas": ["Pessoas"],
    "/financeiro": ["Receita & Caixa"],
    "/comercial": ["Receita & Caixa"],
    "/contratos": ["Receita & Caixa"],
    "/clientes": ["Receita & Caixa"],
    "/rewards": ["TBO Rewards"],
    "/marketing": ["Estratégia"],
    "/relatorios": ["Estratégia"],
  }), []);

  const activeHubGroups = useMemo(() => {
    for (const [prefix, groups] of Object.entries(HUB_SCOPE)) {
      if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
        return groups;
      }
    }
    return null; // No hub scope → show all
  }, [pathname, HUB_SCOPE]);

  // Ordered groups (respecting saved order)
  const displayGroups = useMemo(() => {
    let groups: typeof SIDEBAR_NAV_GROUPS extends readonly (infer T)[] ? T[] : never;

    if (query.trim()) {
      groups = [...filteredGroups];
    } else if (groupOrder.length === 0) {
      groups = [...SIDEBAR_NAV_GROUPS];
    } else {
      const groupMap = new Map(SIDEBAR_NAV_GROUPS.map((g) => [g.label, g]));
      const ordered = groupOrder.flatMap((label) => {
        const g = groupMap.get(label);
        if (g) { groupMap.delete(label); return [g]; }
        return [];
      });
      groups = [...ordered, ...groupMap.values()];
    }

    // Apply hub-scoped filtering
    if (activeHubGroups && !query.trim()) {
      groups = groups.filter((g) => activeHubGroups.includes(g.label));
    }

    return groups;
  }, [query, filteredGroups, groupOrder, activeHubGroups]);

  const groupIds = useMemo(
    () => displayGroups.map((g) => `group::${g.label}`),
    [displayGroups],
  );

  // Ctrl+Z undo
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        const undone = undoSidebarReorder();
        if (undone) {
          e.preventDefault();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleItemAction = useCallback(
    (action: string, item: NavGroupItem, _groupLabel: string) => {
      switch (action) {
        case "open-new-tab":
          window.open(item.href, "_blank");
          break;
        case "copy-link": {
          const url = `${window.location.origin}${item.href}`;
          navigator.clipboard.writeText(url).then(() => {
            toast.success("Link copiado!");
          });
          break;
        }
        case "hide":
          toast.info(`"${item.label}" oculto da sidebar`);
          break;
      }
    },
    [],
  );

  const isSearching = query.trim().length > 0;

  return (
    <Sidebar variant="inset" data-tour="sidebar">
      {/* ── Header: Workspace Branding ── */}
      <SidebarHeader className="px-1 pb-0 pt-1">
        <WorkspaceSwitcher />
        {/* Gradient separator */}
        <div className="mx-3 h-px bg-gradient-to-r from-transparent via-sidebar-border to-transparent" />
      </SidebarHeader>

      <SidebarContent>
        {/* ── Search ── */}
        <SidebarGroup className="px-3 py-2.5">
          <SidebarGroupContent>
            <div className="relative">
              <IconSearch className="text-muted-foreground/60 absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 transition-colors duration-150 peer-focus:text-foreground" />
              <input
                type="text"
                placeholder="Buscar..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="peer h-8 w-full rounded-lg border-0 bg-sidebar-accent/50 pl-8 pr-10 text-sm text-sidebar-foreground placeholder:text-muted-foreground/50 outline-none ring-1 ring-sidebar-border/50 transition-all duration-200 focus:bg-sidebar-accent/80 focus:ring-sidebar-ring/30"
              />
              {/* Keyboard shortcut hint */}
              <kbd className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 select-none rounded border border-sidebar-border/60 bg-sidebar/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/50">
                ⌘K
              </kbd>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ── Pinned items ── */}
        <SidebarGroup className="px-3 pb-1 pt-0" data-tour="pinned-items">
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {PINNED_NAV_ITEMS.filter((item) => {
                if (!canSee(item.module)) return false;
                // In hub scope: show only Hub de Servicos + Dashboard
                if (activeHubGroups) {
                  return item.href === "/servicos" || item.href === "/dashboard";
                }
                return true;
              }).map((item) => {
                const Icon = getIcon(item.icon);
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const badge = item.href === "/chat" && chatTotalUnread > 0 ? chatTotalUnread : 0;
                return (
                  <SidebarMenuItem key={item.href} data-tour={item.href === "/projetos" ? "nav-projetos" : undefined}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        "relative rounded-lg transition-all duration-150",
                        isActive && "bg-sidebar-accent font-medium shadow-sm shadow-black/[0.03]",
                      )}
                    >
                      <Link href={item.href}>
                        {/* Active indicator bar */}
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-sidebar-indicator" />
                        )}
                        <Icon className={cn(
                          "size-[18px] transition-colors duration-150",
                          isActive ? "text-sidebar-primary" : "text-muted-foreground/70",
                        )} />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                    {badge > 0 && (
                      <SidebarMenuBadge className="animate-badge-pulse bg-destructive text-destructive-foreground text-[10px] font-semibold min-w-5 h-5 flex items-center justify-center rounded-full shadow-sm shadow-destructive/30">
                        {badge > 99 ? "99+" : badge}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ── Gradient separator ── */}
        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-sidebar-border/60 to-transparent" />

        {/* ── Hub-scoped: flat list (no collapse, no children) ── */}
        {activeHubGroups && !isSearching ? (
          displayGroups.map((group) => (
            <SidebarGroup key={group.label} className="px-3 py-1">
              <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/50 px-2 mb-1">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5">
                  {group.items.filter((i) => canSee(i.module)).map((item) => {
                    const Icon = getIcon(item.icon);
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          className={cn(
                            "relative rounded-lg transition-all duration-150",
                            isActive && "bg-sidebar-accent font-medium shadow-sm shadow-black/[0.03]",
                          )}
                        >
                          <Link href={item.href}>
                            {isActive && (
                              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-sidebar-indicator" />
                            )}
                            <Icon className={cn(
                              "size-[18px] transition-colors duration-150",
                              isActive ? "text-sidebar-primary" : "text-muted-foreground/70",
                            )} />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))
        ) : isSearching ? (
          displayGroups.map((group) => (
            <SortableNavGroup
              key={group.label}
              group={group}
              canSee={canSee}
              isDragOverlay
              onItemAction={handleItemAction}
            />
          ))
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext
              items={groupIds}
              strategy={verticalListSortingStrategy}
            >
              {displayGroups.map((group) => (
                <SortableNavGroup
                  key={group.label}
                  group={group}
                  canSee={canSee}
                  isDropTarget={overGroupLabel === group.label}
                  onItemAction={handleItemAction}
                />
              ))}
            </SortableContext>

            <DragOverlay dropAnimation={null}>
              {activeDrag?.type === "group" && activeDrag.group ? (
                <SortableNavGroup
                  group={activeDrag.group}
                  canSee={canSee}
                  isDragOverlay
                />
              ) : null}
              {activeDrag?.type === "item" && activeDrag.item && activeDrag.groupLabel ? (
                <SortableNavItem
                  item={activeDrag.item}
                  groupLabel={activeDrag.groupLabel}
                  isDragOverlay
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </SidebarContent>

      {/* ── Footer: User profile ── */}
      <SidebarFooter className="border-t border-sidebar-border/40 p-2">
        <SidebarUserFooter />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
