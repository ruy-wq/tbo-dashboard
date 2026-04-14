"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  IconPlus,
  IconSearch,
  IconLayoutGrid,
  IconList,
  IconStarFilled,
  IconPhoto,
  IconFilter,
  IconX,
  IconLink,
  IconSquareCheck,
  IconSquare,
  IconCheck,
} from "@tabler/icons-react";
import { BU_LIST, BU_COLORS } from "@/lib/constants";
import {
  usePortfolio,
  useCreatePortfolioItem,
  useUpdatePortfolioItem,
  useDeletePortfolioItem,
  useToggleFeatured,
} from "@/features/portfolio/hooks/use-portfolio";
import { PORTFOLIO_CATEGORIES } from "@/features/portfolio/types/portfolio";
import type { PortfolioItem, PortfolioInsert } from "@/features/portfolio/types/portfolio";
import { PortfolioCard } from "@/features/portfolio/components/portfolio-card";
import { PortfolioFormDialog } from "@/features/portfolio/components/portfolio-form-dialog";
import { CreateShowcaseDialog } from "@/features/portfolio/components/create-showcase-dialog";
import { PortfolioDetailSheet } from "@/features/portfolio/components/portfolio-detail-sheet";
import { RequireRole } from "@/features/auth/components/require-role";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "list";

export default function PortfolioPage() {
  useUser();

  const { data: items, isLoading, error, refetch } = usePortfolio();
  const createMut = useCreatePortfolioItem();
  const updateMut = useUpdatePortfolioItem();
  const deleteMut = useDeletePortfolioItem();
  const toggleFeatured = useToggleFeatured();

  // ── Filters ─────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [buFilter, setBuFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // ── Dialog state ────────────────────────────────────────────────────────
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<PortfolioItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // ── Detail sheet ────────────────────────────────────────────────────────
  const [detailItem, setDetailItem] = useState<PortfolioItem | null>(null);

  // ── Selection for showcase ──────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [showcaseOpen, setShowcaseOpen] = useState(false);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(filtered.map((i) => i.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
    setSelectMode(false);
  }

  // ── Available categories based on BU filter ─────────────────────────────
  const availableCategories = useMemo(() => {
    if (buFilter === "all") {
      return Object.values(PORTFOLIO_CATEGORIES).flat();
    }
    return PORTFOLIO_CATEGORIES[buFilter] ?? [];
  }, [buFilter]);

  // ── Filtered items ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!items) return [];
    const q = search.toLowerCase();
    return items.filter((item) => {
      if (buFilter !== "all" && item.bu !== buFilter) return false;
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      if (featuredOnly && !item.is_featured) return false;
      if (q) {
        const haystack = [
          item.title,
          item.client_company,
          item.project_name,
          item.description,
          ...item.tags,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [items, search, buFilter, categoryFilter, featuredOnly]);

  // ── Stats ───────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (!items) return { total: 0, featured: 0, byBu: {} as Record<string, number> };
    const byBu: Record<string, number> = {};
    let featured = 0;
    for (const item of items) {
      byBu[item.bu] = (byBu[item.bu] || 0) + 1;
      if (item.is_featured) featured++;
    }
    return { total: items.length, featured, byBu };
  }, [items]);

  // ── Handlers ────────────────────────────────────────────────────────────
  function handleCreate(data: Omit<PortfolioInsert, "tenant_id" | "created_by">) {
    createMut.mutate(data);
  }

  function handleEdit(item: PortfolioItem) {
    setEditItem(item);
    setFormOpen(true);
  }

  function handleUpdate(data: Omit<PortfolioInsert, "tenant_id" | "created_by">) {
    if (!editItem) return;
    updateMut.mutate({ id: editItem.id, updates: data });
    setEditItem(null);
  }

  function confirmDelete() {
    if (!deleteId) return;
    deleteMut.mutate(deleteId);
    setDeleteId(null);
  }

  function clearFilters() {
    setSearch("");
    setBuFilter("all");
    setCategoryFilter("all");
    setFeaturedOnly(false);
  }

  const hasActiveFilters = search || buFilter !== "all" || categoryFilter !== "all" || featuredOnly;

  if (error) {
    return <ErrorState message={error.message} onRetry={() => refetch()} />;
  }

  return (
    <RequireRole module="comercial">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Portfolio de Cases</h1>
            <p className="text-muted-foreground text-sm">
              Centralizador de entregas finais por BU e categoria para o comercial.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={selectMode ? "default" : "outline"}
              onClick={() => {
                if (selectMode) clearSelection();
                else setSelectMode(true);
              }}
            >
              {selectMode ? <IconX className="size-4 mr-2" /> : <IconSquareCheck className="size-4 mr-2" />}
              {selectMode ? "Cancelar" : "Selecionar"}
            </Button>
            <Button onClick={() => { setEditItem(null); setFormOpen(true); }}>
              <IconPlus className="size-4 mr-2" />
              Novo Case
            </Button>
          </div>
        </div>

        {/* BU quick-filter chips */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => { setBuFilter("all"); setCategoryFilter("all"); }}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors border",
              buFilter === "all"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/50 text-muted-foreground border-border hover:bg-muted",
            )}
          >
            Todos ({stats.total})
          </button>
          {BU_LIST.map((bu) => {
            const count = stats.byBu[bu] ?? 0;
            const buColor = BU_COLORS[bu];
            const isActive = buFilter === bu;
            return (
              <button
                key={bu}
                type="button"
                onClick={() => {
                  setBuFilter(isActive ? "all" : bu);
                  setCategoryFilter("all");
                }}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors border",
                  isActive
                    ? "border-transparent"
                    : "bg-muted/50 text-muted-foreground border-border hover:bg-muted",
                )}
                style={
                  isActive && buColor
                    ? { backgroundColor: buColor.bg, color: buColor.color, borderColor: buColor.color }
                    : undefined
                }
              >
                {bu} ({count})
              </button>
            );
          })}
          {stats.featured > 0 && (
            <button
              type="button"
              onClick={() => setFeaturedOnly(!featuredOnly)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors border flex items-center gap-1",
                featuredOnly
                  ? "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700"
                  : "bg-muted/50 text-muted-foreground border-border hover:bg-muted",
              )}
            >
              <IconStarFilled className="size-3" />
              Destaques ({stats.featured})
            </button>
          )}
        </div>

        {/* Category sub-filter + search + view toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cases..."
              className="pl-9 h-9"
            />
          </div>

          {buFilter !== "all" && availableCategories.length > 0 && (
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px] h-9 text-xs">
                <SelectValue placeholder="Todas categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {availableCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-xs">
              <IconX className="size-3.5 mr-1" />
              Limpar filtros
            </Button>
          )}

          <div className="ml-auto flex items-center border rounded-md">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="size-9 rounded-r-none"
              onClick={() => setViewMode("grid")}
            >
              <IconLayoutGrid className="size-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="size-9 rounded-l-none"
              onClick={() => setViewMode("list")}
            >
              <IconList className="size-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[16/10] w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <IconPhoto className="size-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium">
              {hasActiveFilters ? "Nenhum case encontrado" : "Portfolio vazio"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              {hasActiveFilters
                ? "Tente ajustar os filtros ou buscar com outros termos."
                : "Adicione cases de entregas finais para o comercial ter acesso rapido ao portfolio da TBO."}
            </p>
            {!hasActiveFilters && (
              <Button
                className="mt-4"
                onClick={() => { setEditItem(null); setFormOpen(true); }}
              >
                <IconPlus className="size-4 mr-2" />
                Adicionar primeiro case
              </Button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((item) => (
              <div key={item.id} className="relative">
                {selectMode && (
                  <button
                    type="button"
                    onClick={() => toggleSelect(item.id)}
                    className={cn(
                      "absolute top-2 left-2 z-10 size-6 rounded-md border-2 flex items-center justify-center transition-colors",
                      selectedIds.has(item.id)
                        ? "bg-primary border-primary text-primary-foreground"
                        : "bg-background/80 border-border hover:border-primary/50",
                    )}
                  >
                    {selectedIds.has(item.id) && <IconCheck className="size-3.5" />}
                  </button>
                )}
                <div
                  onClick={selectMode ? () => toggleSelect(item.id) : () => setDetailItem(item)}
                  className={cn(
                    "cursor-pointer",
                    selectMode && selectedIds.has(item.id) && "ring-2 ring-primary ring-offset-2 rounded-lg",
                  )}
                >
                  <PortfolioCard
                    item={item}
                    onToggleFeatured={selectMode ? () => toggleSelect(item.id) : toggleFeatured}
                    onEdit={selectMode ? () => toggleSelect(item.id) : handleEdit}
                    onDelete={selectMode ? () => toggleSelect(item.id) : setDeleteId}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List view */
          <div className="rounded-lg border">
            <div className="grid grid-cols-[1fr_100px_120px_100px_60px] gap-2 border-b bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground">
              <span>Case</span>
              <span>BU</span>
              <span>Categoria</span>
              <span>Ano</span>
              <span />
            </div>
            {filtered.map((item) => (
              <PortfolioListRow
                key={item.id}
                item={item}
                onToggleFeatured={toggleFeatured}
                onEdit={(i) => setDetailItem(i)}
                onDelete={setDeleteId}
              />
            ))}
          </div>
        )}

        {/* Results count */}
        {!isLoading && filtered.length > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            {filtered.length} case{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Form Dialog */}
      <PortfolioFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditItem(null);
        }}
        item={editItem}
        onSubmit={editItem ? handleUpdate : handleCreate}
        isPending={createMut.isPending || updateMut.isPending}
      />

      {/* Selection action bar */}
      {selectMode && selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl border bg-background/95 backdrop-blur-sm shadow-lg px-4 py-3">
          <span className="text-sm font-medium">
            {selectedIds.size} case{selectedIds.size !== 1 ? "s" : ""}
          </span>
          <Button variant="outline" size="sm" onClick={selectAll}>
            <IconCheck className="size-3.5 mr-1.5" />
            Selecionar todos ({filtered.length})
          </Button>
          <Button
            size="sm"
            onClick={() => setShowcaseOpen(true)}
          >
            <IconLink className="size-3.5 mr-1.5" />
            Gerar Link
          </Button>
          <Button variant="ghost" size="sm" onClick={clearSelection}>
            <IconX className="size-3.5" />
          </Button>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover case do portfolio?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa acao remove o case do centralizador. Nao afeta os arquivos originais do projeto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Detail sheet */}
      <PortfolioDetailSheet
        item={detailItem}
        open={!!detailItem}
        onOpenChange={(open) => { if (!open) setDetailItem(null); }}
        onEdit={handleEdit}
        onDelete={setDeleteId}
        onToggleFeatured={toggleFeatured}
      />

      {/* Showcase dialog */}
      <CreateShowcaseDialog
        open={showcaseOpen}
        onOpenChange={setShowcaseOpen}
        selectedIds={Array.from(selectedIds)}
        defaultTitle={buFilter !== "all" ? `Cases ${buFilter}` : "Cases TBO"}
      />
    </RequireRole>
  );
}

// ─── List Row ─────────────────────────────────────────────────────────────────

function PortfolioListRow({
  item,
  onToggleFeatured,
  onEdit,
  onDelete,
}: {
  item: PortfolioItem;
  onToggleFeatured: (item: PortfolioItem) => void;
  onEdit: (item: PortfolioItem) => void;
  onDelete: (id: string) => void;
}) {
  const buColor = BU_COLORS[item.bu];

  return (
    <button
      type="button"
      onClick={() => onEdit(item)}
      className="grid w-full grid-cols-[1fr_100px_120px_100px_60px] items-center gap-2 border-b px-4 py-3 text-left text-sm transition-colors hover:bg-muted/30 last:border-b-0"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative size-10 shrink-0 rounded overflow-hidden bg-muted">
          {item.thumbnail_url ? (
            <img src={item.thumbnail_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <IconPhoto className="size-4 text-muted-foreground/40" />
            </div>
          )}
          {item.is_featured && (
            <div className="absolute -top-0.5 -right-0.5 rounded-full bg-amber-500 p-0.5">
              <IconStarFilled className="size-2 text-white" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <div className="truncate font-medium">{item.title}</div>
          {item.client_company && (
            <div className="truncate text-xs text-muted-foreground">{item.client_company}</div>
          )}
        </div>
      </div>

      <Badge
        variant="outline"
        className="text-[10px] w-fit"
        style={buColor ? { backgroundColor: buColor.bg, color: buColor.color, borderColor: "transparent" } : undefined}
      >
        {item.bu}
      </Badge>

      <span className="text-xs text-muted-foreground">{item.category}</span>
      <span className="text-xs text-muted-foreground">{item.year ?? "—"}</span>

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onToggleFeatured(item); }}
        className="flex items-center justify-center"
      >
        {item.is_featured ? (
          <IconStarFilled className="size-4 text-amber-500" />
        ) : (
          <IconStarFilled className="size-4 text-muted-foreground/20 hover:text-amber-400 transition-colors" />
        )}
      </button>
    </button>
  );
}
