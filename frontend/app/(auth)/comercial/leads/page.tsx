"use client";

import { useState, useMemo } from "react";
import {
  CommercialPeriodFilter,
  filterByPeriod,
  type CommercialPeriodValue,
} from "@/features/comercial/components/period-filter-comercial";
import {
  useDeals,
  useUpdateDealStage,
  useBulkUpdateDealStage,
  useBulkUpdateDealOwner,
  useBulkUpdateDealPriority,
  useBulkDeleteDeals,
} from "@/features/comercial/hooks/use-commercial";
import { DealDetailDialog } from "@/features/comercial/components/deal-detail-dialog";
import { DealFormDialog } from "@/features/comercial/components/deal-form-dialog";
import { LeadsBulkActionBar } from "@/features/comercial/components/leads-bulk-action-bar";
import { formatCurrency } from "@/features/comercial/lib/format-currency";
import {
  scoreDeals,
  TEMPERATURE_CONFIG,
  type DealTemperature,
} from "@/features/comercial/lib/lead-scoring";
import { parseLeadNotes, inferUf } from "@/features/comercial/lib/parse-lead-notes";
// parseLeadNotes/inferUf agora são fallback para leads sem colunas backfilladas
import { exportLeadsToCsv } from "@/features/comercial/lib/export-leads-csv";
import {
  LeadsFiltersPanel,
  EMPTY_FILTERS,
  type LeadFiltersState,
} from "@/features/comercial/components/leads-filters-panel";
import { EmptyState, ErrorState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  IconPlus,
  IconSearch,
  IconUsers,
  IconArrowRight,
  IconDownload,
  IconFlame,
  IconArrowUp,
  IconArrowDown,
  IconArrowsSort,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from "@tabler/icons-react";
import { DEAL_STAGES, type DealStageKey } from "@/lib/constants";
import { toast } from "sonner";
import type { Database } from "@/lib/supabase/types";

type DealRow = Database["public"]["Tables"]["crm_deals"]["Row"];

const LEAD_STAGES: DealStageKey[] = ["lead", "qualificacao"];
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 250] as const;
const DEFAULT_PAGE_SIZE = 50;

type SortKey = "score" | "value" | "created_at" | "company";
type SortDir = "asc" | "desc";

function KPICard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function TempBadge({ temperature, score }: { temperature: DealTemperature; score: number }) {
  const cfg = TEMPERATURE_CONFIG[temperature];
  return (
    <Badge
      variant="secondary"
      className="gap-1 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
    >
      {temperature === "hot" && <IconFlame className="h-3 w-3" />}
      {score}
    </Badge>
  );
}

function SortHeader({
  label,
  sortKey,
  current,
  dir,
  onClick,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onClick: (key: SortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <button
      type="button"
      onClick={() => onClick(sortKey)}
      className={`group inline-flex items-center gap-1 font-medium transition-colors hover:text-foreground ${
        active ? "text-foreground" : "text-muted-foreground"
      }`}
    >
      {label}
      {active ? (
        dir === "asc" ? (
          <IconArrowUp className="h-3 w-3" />
        ) : (
          <IconArrowDown className="h-3 w-3" />
        )
      ) : (
        <IconArrowsSort className="h-3 w-3 opacity-0 group-hover:opacity-50" />
      )}
    </button>
  );
}

export default function ComercialLeads() {
  const [stageTab, setStageTab] = useState<DealStageKey | "all">("all");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<LeadFiltersState>(EMPTY_FILTERS);
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [page, setPage] = useState<number>(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [selectedDeal, setSelectedDeal] = useState<DealRow | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<DealRow | null>(null);
  const [period, setPeriod] = useState<CommercialPeriodValue>({ preset: "all" });

  const updateStage = useUpdateDealStage();
  const bulkStage = useBulkUpdateDealStage();
  const bulkOwner = useBulkUpdateDealOwner();
  const bulkPriority = useBulkUpdateDealPriority();
  const bulkDelete = useBulkDeleteDeals();
  const isBulkPending = bulkStage.isPending || bulkOwner.isPending || bulkPriority.isPending || bulkDelete.isPending;

  const { data: rawLeads = [], isLoading, error, refetch } = useDeals();
  const allLeads = filterByPeriod(rawLeads, period);

  const enriched = useMemo(() => {
    const baseLeads = allLeads.filter((d) => LEAD_STAGES.includes(d.stage as DealStageKey));
    const scored = scoreDeals(baseLeads);
    const scoreMap = new Map(scored.map((s) => [s.deal.id, s]));
    return baseLeads.map((deal) => {
      // Prefere colunas DB (backfill 2026-04). Fallback para parser apenas se vazio.
      const fallback = deal.bu || deal.porte || deal.uf ? null : parseLeadNotes(deal.notes);
      const s = scoreMap.get(deal.id);
      return {
        deal,
        bu: deal.bu ?? fallback?.bu ?? null,
        porte: deal.porte ?? fallback?.porte ?? null,
        padrao: deal.padrao ?? fallback?.padrao ?? null,
        cargo: deal.cargo ?? fallback?.cargo ?? null,
        statusFunil: deal.status_funil ?? fallback?.status_funil ?? null,
        radarScore: deal.radar_score ?? fallback?.score_radar ?? null,
        isRadar: deal.is_radar || (fallback?.is_radar ?? false),
        uf: deal.uf ?? inferUf({ contact_phone: deal.contact_phone, notes: deal.notes }),
        score: s?.score ?? 0,
        temperature: s?.temperature ?? ("cold" as DealTemperature),
      };
    });
  }, [allLeads]);

  const filterOptions = useMemo(() => {
    const ufCounts = new Map<string, number>();
    const porteCounts = new Map<string, number>();
    const buCounts = new Map<string, number>();
    const origemCounts = new Map<string, number>();
    for (const e of enriched) {
      if (e.uf) ufCounts.set(e.uf, (ufCounts.get(e.uf) ?? 0) + 1);
      if (e.porte) porteCounts.set(e.porte, (porteCounts.get(e.porte) ?? 0) + 1);
      if (e.bu) buCounts.set(e.bu, (buCounts.get(e.bu) ?? 0) + 1);
      const src = e.deal.source ?? "—";
      origemCounts.set(src, (origemCounts.get(src) ?? 0) + 1);
    }
    const toSorted = (m: Map<string, number>) =>
      [...m.entries()]
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count);
    return {
      ufs: toSorted(ufCounts),
      portes: toSorted(porteCounts),
      bus: toSorted(buCounts),
      origens: toSorted(origemCounts),
    };
  }, [enriched]);

  const ownerOptions = useMemo(() => {
    const set = new Set<string>();
    for (const d of rawLeads) {
      if (d.owner_name) set.add(d.owner_name);
    }
    return [...set].sort();
  }, [rawLeads]);

  const filtered = useMemo(() => {
    let list = enriched;
    if (stageTab !== "all") list = list.filter((e) => e.deal.stage === stageTab);
    if (filters.ufs.length > 0) list = list.filter((e) => e.uf && filters.ufs.includes(e.uf));
    if (filters.portes.length > 0) list = list.filter((e) => e.porte && filters.portes.includes(e.porte));
    if (filters.bus.length > 0) list = list.filter((e) => e.bu && filters.bus.includes(e.bu));
    if (filters.origens.length > 0) list = list.filter((e) => filters.origens.includes(e.deal.source ?? "—"));
    if (filters.scoreMin != null) list = list.filter((e) => (e.radarScore ?? 0) >= filters.scoreMin!);
    if (filters.onlyRadarHot) list = list.filter((e) => e.isRadar && (e.radarScore ?? 0) >= 8);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.deal.name?.toLowerCase().includes(q) ||
          e.deal.company?.toLowerCase().includes(q) ||
          e.deal.contact?.toLowerCase().includes(q) ||
          e.deal.contact_email?.toLowerCase().includes(q) ||
          e.deal.owner_name?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [enriched, stageTab, filters, search]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    const cmp = (a: typeof list[0], b: typeof list[0]) => {
      let av: number | string;
      let bv: number | string;
      switch (sortKey) {
        case "score":
          av = a.score;
          bv = b.score;
          break;
        case "value":
          av = a.deal.value ?? 0;
          bv = b.deal.value ?? 0;
          break;
        case "created_at":
          av = a.deal.created_at ? new Date(a.deal.created_at).getTime() : 0;
          bv = b.deal.created_at ? new Date(b.deal.created_at).getTime() : 0;
          break;
        case "company":
          av = (a.deal.company || a.deal.name || "").toLowerCase();
          bv = (b.deal.company || b.deal.name || "").toLowerCase();
          break;
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    };
    return list.sort(cmp);
  }, [filtered, sortKey, sortDir]);

  // Paginação
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const visibleLeads = sorted.slice(startIdx, startIdx + pageSize);

  const totalFilters =
    filters.ufs.length +
    filters.portes.length +
    filters.bus.length +
    filters.origens.length +
    (filters.scoreMin != null ? 1 : 0) +
    (filters.onlyRadarHot ? 1 : 0);

  const kpis = useMemo(() => {
    const total = enriched.length;
    const totalValue = enriched.reduce((s, e) => s + (e.deal.value ?? 0), 0);
    const avgValue = total > 0 ? totalValue / total : 0;
    const radarHot = enriched.filter((e) => e.isRadar && (e.radarScore ?? 0) >= 8).length;
    return { total, totalValue, avgValue, radarHot };
  }, [enriched]);

  // Selection helpers
  const visibleIds = visibleLeads.map((e) => e.deal.id);
  const visibleAllSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const visibleSomeSelected = visibleIds.some((id) => selectedIds.has(id));

  function toggleVisibleAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (visibleAllSelected) {
        for (const id of visibleIds) next.delete(id);
      } else {
        for (const id of visibleIds) next.add(id);
      }
      return next;
    });
  }
  function toggleOne(id: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function selectAllFiltered() {
    setSelectedIds(new Set(sorted.map((e) => e.deal.id)));
    toast.info(`${sorted.length} leads selecionados (todos os filtrados)`);
  }
  function clearSelection() {
    setSelectedIds(new Set());
  }

  // Reset paginação ao mudar filtros
  function setStage(v: DealStageKey | "all") {
    setStageTab(v);
    setPage(1);
  }
  function handleFiltersChange(f: LeadFiltersState) {
    setFilters(f);
    setPage(1);
  }
  function handleSearch(v: string) {
    setSearch(v);
    setPage(1);
  }
  function handlePageSize(s: number) {
    setPageSize(s);
    setPage(1);
  }

  function handleSelect(deal: DealRow) {
    setSelectedDeal(deal);
    setDetailOpen(true);
  }
  function handleEdit(deal: DealRow) {
    setDetailOpen(false);
    setEditingDeal(deal);
    setFormOpen(true);
  }
  function handleNewLead() {
    setEditingDeal(null);
    setFormOpen(true);
  }
  function handleAdvanceStage(deal: DealRow, e: React.MouseEvent) {
    e.stopPropagation();
    const nextStage = deal.stage === "lead" ? "qualificacao" : "proposta";
    const nextLabel = DEAL_STAGES[nextStage as DealStageKey]?.label ?? nextStage;
    updateStage.mutate(
      { id: deal.id, stage: nextStage },
      { onSuccess: () => toast.success(`"${deal.name}" movido para ${nextLabel}`) },
    );
  }
  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "company" ? "asc" : "desc");
    }
  }
  function handleExport() {
    if (sorted.length === 0) {
      toast.error("Nenhum lead para exportar.");
      return;
    }
    exportLeadsToCsv(sorted.map((e) => e.deal));
    toast.success(`${sorted.length} leads exportados.`);
  }

  // Bulk handlers
  const selectedIdsArray = [...selectedIds];

  async function handleBulkMoveStage(stage: string) {
    const ids = selectedIdsArray;
    const label = DEAL_STAGES[stage as DealStageKey]?.label ?? stage;
    try {
      await bulkStage.mutateAsync({ ids, stage });
      toast.success(`${ids.length} leads movidos para ${label}`);
      clearSelection();
    } catch {
      // erro já tratado no hook
    }
  }
  async function handleBulkSetOwner(ownerName: string | null) {
    const ids = selectedIdsArray;
    try {
      await bulkOwner.mutateAsync({ ids, ownerName });
      toast.success(`${ids.length} leads ${ownerName ? `atribuídos a ${ownerName}` : "sem owner"}`);
      clearSelection();
    } catch {}
  }
  async function handleBulkSetPriority(priority: string) {
    const ids = selectedIdsArray;
    try {
      await bulkPriority.mutateAsync({ ids, priority });
      toast.success(`Prioridade atualizada em ${ids.length} leads`);
      clearSelection();
    } catch {}
  }
  async function handleBulkDelete() {
    const ids = selectedIdsArray;
    try {
      await bulkDelete.mutateAsync(ids);
      toast.success(`${ids.length} leads deletados`);
      clearSelection();
    } catch {}
  }
  function handleBulkExport() {
    const ids = new Set(selectedIdsArray);
    const subset = sorted.filter((e) => ids.has(e.deal.id)).map((e) => e.deal);
    exportLeadsToCsv(subset, `leads-selecionados-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success(`${subset.length} leads exportados`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground text-sm">Gestão e qualificação de leads comerciais.</p>
        </div>
        <div className="flex items-center gap-2">
          <CommercialPeriodFilter value={period} onChange={setPeriod} />
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
            <IconDownload className="h-4 w-4" /> Exportar CSV
          </Button>
          <Button onClick={handleNewLead}>
            <IconPlus className="mr-1 h-4 w-4" /> Novo Lead
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KPICard label="Total de leads" value={String(kpis.total)} />
        <KPICard label="Valor em pipeline" value={formatCurrency(kpis.totalValue)} />
        <KPICard label="Ticket médio" value={formatCurrency(kpis.avgValue)} />
        <KPICard label="🔥 Radar Hot (≥8)" value={String(kpis.radarHot)} sub="Score Radar prioritário" />
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={stageTab} onValueChange={(v) => setStage(v as DealStageKey | "all")}>
            <TabsList>
              <TabsTrigger value="all">Todos</TabsTrigger>
              {LEAD_STAGES.map((s) => (
                <TabsTrigger key={s} value={s}>
                  {DEAL_STAGES[s].label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="relative max-w-sm flex-1">
            <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar nome, empresa, email..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <LeadsFiltersPanel
          filters={filters}
          onChange={handleFiltersChange}
          options={filterOptions}
          totalActive={totalFilters}
        />
      </div>

      <LeadsBulkActionBar
        selectedCount={selectedIds.size}
        ownerOptions={ownerOptions}
        isPending={isBulkPending}
        onMoveStage={handleBulkMoveStage}
        onSetOwner={handleBulkSetOwner}
        onSetPriority={handleBulkSetPriority}
        onDelete={handleBulkDelete}
        onExportCsv={handleBulkExport}
        onClear={clearSelection}
      />

      {error ? (
        <ErrorState message="Não foi possível carregar os leads." onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={IconUsers}
          title={search || totalFilters > 0 || stageTab !== "all" ? "Nenhum lead encontrado" : "Nenhum lead ainda"}
          description={
            search || totalFilters > 0 || stageTab !== "all"
              ? "Tente ajustar os filtros."
              : "Clique em 'Novo Lead' para começar o pipeline comercial."
          }
          cta={
            !search && totalFilters === 0 && stageTab === "all"
              ? { label: "Novo Lead", onClick: handleNewLead }
              : undefined
          }
        />
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="w-10 px-3 py-3">
                  <Checkbox
                    checked={visibleAllSelected ? true : visibleSomeSelected ? "indeterminate" : false}
                    onCheckedChange={toggleVisibleAll}
                    aria-label="Selecionar todos da página"
                  />
                </th>
                <th className="px-3 py-3 text-left">
                  <SortHeader label="Score" sortKey="score" current={sortKey} dir={sortDir} onClick={handleSort} />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader label="Lead" sortKey="company" current={sortKey} dir={sortDir} onClick={handleSort} />
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">
                  Localização
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">
                  BU / Porte
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader label="Valor" sortKey="value" current={sortKey} dir={sortDir} onClick={handleSort} />
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Etapa</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {visibleLeads.map((e) => {
                const stage = DEAL_STAGES[e.deal.stage as DealStageKey];
                const canAdvance = e.deal.stage !== "qualificacao";
                const isRadarHot = e.isRadar && (e.radarScore ?? 0) >= 8;
                const isSelected = selectedIds.has(e.deal.id);
                return (
                  <tr
                    key={e.deal.id}
                    data-selected={isSelected}
                    className="cursor-pointer transition-colors hover:bg-muted/30 data-[selected=true]:bg-primary/5"
                    style={isRadarHot && !isSelected ? { background: "rgba(239,68,68,0.04)" } : undefined}
                    onClick={() => handleSelect(e.deal)}
                  >
                    <td className="px-3 py-3" onClick={(ev) => ev.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleOne(e.deal.id)}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <TempBadge temperature={e.temperature} score={e.score} />
                        {e.radarScore != null && (
                          <Badge
                            variant="outline"
                            className="px-1.5 py-0 text-[10px] tabular-nums"
                            title={`Score Radar v2: ${e.radarScore}`}
                          >
                            ⭐{e.radarScore}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">{e.deal.company || e.deal.name}</span>
                        {isRadarHot && (
                          <span title="Radar Hot — score ≥ 8">
                            <IconFlame className="h-3.5 w-3.5 text-red-500" />
                          </span>
                        )}
                      </div>
                      {e.deal.contact && (
                        <div className="text-xs text-muted-foreground">
                          {e.deal.contact}
                          {e.cargo && <span className="opacity-60"> · {e.cargo}</span>}
                        </div>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {e.uf && (
                          <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                            {e.uf}
                          </Badge>
                        )}
                        {e.deal.contact_phone && <span className="truncate">{e.deal.contact_phone}</span>}
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {e.bu && (
                          <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-normal">
                            {e.bu}
                          </Badge>
                        )}
                        {e.porte && (
                          <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-normal">
                            {e.porte}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium tabular-nums">
                      {e.deal.value != null ? formatCurrency(e.deal.value) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {stage ? (
                        <Badge
                          variant="secondary"
                          style={{ backgroundColor: stage.bg, color: stage.color }}
                        >
                          {stage.label}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">{e.deal.stage}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(ev) => ev.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 text-xs"
                        onClick={(ev) => handleAdvanceStage(e.deal, ev)}
                        disabled={updateStage.isPending}
                      >
                        {canAdvance ? "Qualificar" : "Proposta"}
                        <IconArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Paginator */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span>
                {sorted.length === 0
                  ? "Nenhum resultado"
                  : `${startIdx + 1}–${Math.min(startIdx + pageSize, sorted.length)} de ${sorted.length.toLocaleString("pt-BR")}`}
              </span>
              {selectedIds.size > 0 && (
                <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={selectAllFiltered}>
                  Selecionar todos os {sorted.length.toLocaleString("pt-BR")} filtrados
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span>Por página:</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSize(Number(e.target.value))}
                className="h-7 rounded border bg-background px-1.5 text-xs"
              >
                {PAGE_SIZE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={safePage === 1}
                  onClick={() => setPage(1)}
                  aria-label="Primeira página"
                >
                  <IconChevronsLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={safePage === 1}
                  onClick={() => setPage(safePage - 1)}
                  aria-label="Página anterior"
                >
                  <IconChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="px-2 tabular-nums">
                  {safePage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={safePage === totalPages}
                  onClick={() => setPage(safePage + 1)}
                  aria-label="Próxima página"
                >
                  <IconChevronRight className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={safePage === totalPages}
                  onClick={() => setPage(totalPages)}
                  aria-label="Última página"
                >
                  <IconChevronsRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <DealDetailDialog
        deal={selectedDeal}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setSelectedDeal(null);
        }}
        onEdit={handleEdit}
      />

      <DealFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingDeal(null);
        }}
        deal={editingDeal}
      />
    </div>
  );
}
