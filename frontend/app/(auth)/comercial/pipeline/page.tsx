"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  useDeals,
  useUpdateDealStage,
  useRdPipelines,
  useDealOwners,
  useUpdateDeal,
  useCrmStages,
} from "@/features/comercial/hooks/use-commercial";
import { DealKPICards } from "@/features/comercial/components/deal-kpis";
import { RdPipelineKanban } from "@/features/comercial/components/rd-pipeline-kanban";
import { DealPipeline } from "@/features/comercial/components/deal-pipeline";
import { PipelineFilters } from "@/features/comercial/components/pipeline-filters";
import { DealDetailDialog } from "@/features/comercial/components/deal-detail-dialog";
import { DealFormDialog } from "@/features/comercial/components/deal-form-dialog";
import { BulkActionBar } from "@/features/comercial/components/bulk-action-bar";
import { computeDealKPIs } from "@/features/comercial/services/commercial";
import { RequireRole } from "@/features/auth/components/require-role";
import { ErrorState } from "@/components/shared";
import { useGlobalShortcuts } from "@/hooks/use-global-shortcuts";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { IconPlus, IconGitBranch, IconCheckbox, IconSparkles, IconInfoCircle } from "@tabler/icons-react";
import { toast } from "sonner";
import { DEAL_STAGES, type DealStageKey, type LossReasonValue } from "@/lib/constants";
import { LossReasonDialog } from "@/features/comercial/components/loss-reason-dialog";
import { ProposalConfirmDialog } from "@/features/comercial/components/proposal-confirm-dialog";
import { StageBatchEmailsDialog } from "@/features/comercial/components/stage-batch-emails-dialog";
import { WinCelebrationDialog } from "@/features/comercial/components/win-celebration-dialog";
import { ForecastChart } from "@/features/comercial/components/forecast-chart";
import { computeForecast } from "@/features/comercial/lib/forecast";
import { useCreateProject } from "@/features/projects/hooks/use-projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { IconChevronDown, IconTrendingUp } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import {
  CommercialPeriodFilter,
  filterByPeriod,
  type CommercialPeriodValue,
} from "@/features/comercial/components/period-filter-comercial";
import type { Database } from "@/lib/supabase/types";

type DealRow = Database["public"]["Tables"]["crm_deals"]["Row"];

export default function PipelinePage() {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [selectedDeal, setSelectedDeal] = useState<DealRow | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<DealRow | null>(null);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>("all");

  const [period, setPeriod] = useState<CommercialPeriodValue>({ preset: "all" });

  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Automation dialogs
  const [lossDialogOpen, setLossDialogOpen] = useState(false);
  const [proposalDialogOpen, setProposalDialogOpen] = useState(false);
  const [batchEmailsOpen, setBatchEmailsOpen] = useState(false);
  const [winDialogOpen, setWinDialogOpen] = useState(false);
  const [forecastOpen, setForecastOpen] = useState(false);
  const [pendingStageDeal, setPendingStageDeal] = useState<{ id: string; name: string; newStage: string } | null>(null);

  const router = useRouter();
  const createProject = useCreateProject();

  const handleBulkToggle = useCallback((dealId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(dealId);
      else next.delete(dealId);
      return next;
    });
  }, []);

  const handleBulkClear = useCallback(() => {
    setSelectedIds(new Set());
    setBulkMode(false);
  }, []);

  useGlobalShortcuts();

  useEffect(() => {
    function onOpenSearch() {
      const input = document.querySelector<HTMLInputElement>('input[placeholder*="Buscar"]');
      input?.focus();
    }
    window.addEventListener("tbo:open-search", onOpenSearch);
    return () => window.removeEventListener("tbo:open-search", onOpenSearch);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "n" || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.target as HTMLElement)?.isContentEditable) return;
      handleNew();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: pipelines = [], isLoading: pipelinesLoading } = useRdPipelines();
  const { data: owners = [] } = useDealOwners(selectedPipelineId !== "all" ? selectedPipelineId : undefined);
  const { data: crmStages } = useCrmStages();

  const isPipelineView = selectedPipelineId !== "all" && pipelines.some((p) => p.rd_pipeline_id === selectedPipelineId);

  const activeFilters = useMemo(() => ({
    stage: !isPipelineView && stageFilter ? stageFilter : undefined,
    rd_stage_id: isPipelineView && stageFilter ? stageFilter : undefined,
    search: search || undefined,
    pipeline: selectedPipelineId !== "all" ? selectedPipelineId : undefined,
    owner_name: ownerFilter || undefined,
  }), [stageFilter, search, selectedPipelineId, ownerFilter, isPipelineView]);

  const { data: allDeals = [], isLoading, error, refetch } = useDeals(activeFilters);
  const deals = filterByPeriod(allDeals, period);
  const updateStage = useUpdateDealStage();
  const updateDeal = useUpdateDeal();

  const selectedPipeline = useMemo(() => pipelines.find((p) => p.rd_pipeline_id === selectedPipelineId) ?? null, [pipelines, selectedPipelineId]);
  const pipelineStages = useMemo(() => selectedPipeline?.stages ?? [], [selectedPipeline]);
  const kpis = useMemo(() => computeDealKPIs(deals), [deals]);
  const forecast = useMemo(() => computeForecast(deals), [deals]);
  const pendingDealFull = useMemo(
    () => (pendingStageDeal ? deals.find((d) => d.id === pendingStageDeal.id) ?? null : null),
    [pendingStageDeal, deals],
  );

  const stageDistribution = useMemo(() => {
    const stages = Object.keys(DEAL_STAGES) as DealStageKey[];
    return stages.map((stage) => {
      const stageDeals = deals.filter((d) => d.stage === stage);
      return { stage, count: stageDeals.length, value: stageDeals.reduce((s, d) => s + (d.value ?? 0), 0) };
    });
  }, [deals]);

  function handleQuickUpdate(dealId: string, field: string, value: unknown) {
    if (field === "stage") updateStage.mutate({ id: dealId, stage: value as string });
    else updateDeal.mutate({ id: dealId, updates: { [field]: value } as never });
  }

  function handleSelect(deal: DealRow) {
    if (bulkMode) { handleBulkToggle(deal.id, !selectedIds.has(deal.id)); return; }
    setSelectedDeal(deal);
    setDetailOpen(true);
  }

  function handleEdit(deal: DealRow) { setDetailOpen(false); setEditingDeal(deal); setFormOpen(true); }
  function handleNew() { setEditingDeal(null); setFormOpen(true); }

  function handleStageDrop(dealId: string, newStage: string) {
    const deal = deals.find((d) => d.id === dealId);
    const dealName = deal?.name ?? "Deal";

    // Confirmation: loss reason required
    if (newStage === "fechado_perdido") {
      setPendingStageDeal({ id: dealId, name: dealName, newStage });
      setLossDialogOpen(true);
      return;
    }

    // Confirmation: propose creation on "proposta" stage
    if (newStage === "proposta" && deal?.stage !== "proposta") {
      setPendingStageDeal({ id: dealId, name: dealName, newStage });
      setProposalDialogOpen(true);
      return;
    }

    // Celebration: won!
    if (newStage === "fechado_ganho" && deal?.stage !== "fechado_ganho") {
      updateStage.mutate({ id: dealId, stage: newStage });
      setPendingStageDeal({ id: dealId, name: dealName, newStage });
      setWinDialogOpen(true);
      return;
    }

    updateStage.mutate({ id: dealId, stage: newStage });
    toast("Deal movido", { description: "Ctrl+Z para desfazer", duration: 3000 });
  }

  function handleWinCreateProject() {
    if (!pendingDealFull) return;
    createProject.mutate(
      {
        name: pendingDealFull.name,
        client: pendingDealFull.contact ?? undefined,
        client_company: pendingDealFull.company ?? undefined,
        construtora: pendingDealFull.company ?? undefined,
        value: pendingDealFull.value ?? undefined,
        services: pendingDealFull.services ?? undefined,
        owner_name: pendingDealFull.owner_name ?? undefined,
        source: "comercial",
        status: "backlog",
        notes: `Gerado a partir do deal "${pendingDealFull.name}"${pendingDealFull.notes ? `\n\n${pendingDealFull.notes}` : ""}`,
      } as never,
      {
        onSuccess: (project) => {
          setWinDialogOpen(false);
          setPendingStageDeal(null);
          toast.success("Projeto criado", {
            description: `${(project as { code?: string })?.code ?? "Sem código"} · redirecionando...`,
          });
          const projectId = (project as { id?: string })?.id;
          if (projectId) router.push(`/projetos/${projectId}`);
        },
        onError: (err) => {
          toast.error("Erro ao criar projeto", { description: err.message });
        },
      },
    );
  }

  function handleWinSkip() {
    setWinDialogOpen(false);
    setPendingStageDeal(null);
    toast("Deal marcado como ganho", { description: "Ctrl+Z para desfazer", duration: 3000 });
  }

  function handleLossConfirm(reason: LossReasonValue, details: string) {
    if (!pendingStageDeal) return;
    updateDeal.mutate({
      id: pendingStageDeal.id,
      updates: { loss_reason: reason, notes: details ? `[Motivo perda] ${details}` : undefined } as never,
    });
    updateStage.mutate({ id: pendingStageDeal.id, stage: "fechado_perdido" });
    setLossDialogOpen(false);
    setPendingStageDeal(null);
    toast("Deal marcado como perdido", { description: `Motivo: ${reason}` });
  }

  function handleProposalConfirmCreate() {
    if (!pendingStageDeal) return;
    updateStage.mutate({ id: pendingStageDeal.id, stage: pendingStageDeal.newStage });
    setProposalDialogOpen(false);
    // Navigate to proposal creation with deal context
    const deal = deals.find((d) => d.id === pendingStageDeal.id);
    setPendingStageDeal(null);
    if (deal) {
      setEditingDeal(null);
      setFormOpen(false);
      // Open proposal form pre-filled — using URL with deal_id param
      window.location.href = `/comercial/propostas?deal_id=${deal.id}&auto=1`;
    }
  }

  function handleProposalSkip() {
    if (!pendingStageDeal) return;
    updateStage.mutate({ id: pendingStageDeal.id, stage: pendingStageDeal.newStage });
    setProposalDialogOpen(false);
    setPendingStageDeal(null);
    toast("Deal movido", { description: "Ctrl+Z para desfazer", duration: 3000 });
  }

  function handlePipelineStageDrop(dealId: string, newStageId: string, newStageName: string) {
    const mappedStage = mapStageToInternal(newStageName);
    const deal = deals.find((d) => d.id === dealId);
    updateDeal.mutate({ id: dealId, updates: { rd_stage_id: newStageId, rd_stage_name: newStageName, stage: mappedStage } as never });

    if (mappedStage === "fechado_ganho" && deal?.stage !== "fechado_ganho") {
      setPendingStageDeal({ id: dealId, name: deal?.name ?? "Deal", newStage: mappedStage });
      setWinDialogOpen(true);
      return;
    }
    toast("Deal movido", { description: "Ctrl+Z para desfazer", duration: 3000 });
  }

  function handlePipelineChange(pipelineId: string) { setSelectedPipelineId(pipelineId); setStageFilter(""); setOwnerFilter(""); }

  function handleBulkMoveToStage(stage: DealStageKey) {
    const ids = Array.from(selectedIds);
    for (const id of ids) updateStage.mutate({ id, stage });
    toast.success(`${ids.length} deal${ids.length > 1 ? "s" : ""} movido${ids.length > 1 ? "s" : ""}`);
    handleBulkClear();
  }

  function handleBulkAssignOwner(ownerName: string) {
    const ids = Array.from(selectedIds);
    for (const id of ids) updateDeal.mutate({ id, updates: { owner_name: ownerName } as never });
    toast.success(`${ids.length} deal${ids.length > 1 ? "s" : ""} atribuído${ids.length > 1 ? "s" : ""}`);
    handleBulkClear();
  }

  if (error) return <RequireRole module="comercial"><ErrorState message={error.message} onRetry={() => refetch()} /></RequireRole>;

  const showPipelineView = selectedPipelineId !== "all" && selectedPipeline;

  return (
    <RequireRole module="comercial">
      <div className="space-y-6 min-w-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pipeline CRM</h1>
            <p className="text-sm text-gray-500">Kanban de deals e funis comerciais.</p>
          </div>
          <div className="flex items-center gap-2">
            <CommercialPeriodFilter value={period} onChange={setPeriod} />
            <Button variant={bulkMode ? "secondary" : "ghost"} size="sm" onClick={() => { setBulkMode(!bulkMode); setSelectedIds(new Set()); }} className="gap-1.5">
              <IconCheckbox className="h-4 w-4" />
              {bulkMode ? "Cancelar seleção" : "Selecionar"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setBatchEmailsOpen(true)} className="gap-1.5">
              <IconSparkles className="h-4 w-4 text-violet-500" />
              Gerar emails IA
            </Button>
            <Button onClick={handleNew}><IconPlus className="mr-2 h-4 w-4" />Novo Deal</Button>
          </div>
        </div>

        <DealKPICards kpis={kpis} distribution={stageDistribution} />

        <TooltipProvider delayDuration={200}>
          <Collapsible open={forecastOpen} onOpenChange={setForecastOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer select-none pb-3 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <IconTrendingUp className="h-4 w-4 text-blue-500" />
                      Forecast ponderado
                      {forecast.currentMonth && (
                        <Badge variant="secondary" className="ml-1 font-normal">
                          Mês: R$ {Math.round(forecast.currentMonth.realista).toLocaleString("pt-BR")}
                        </Badge>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={(e) => e.stopPropagation()}
                            className="text-gray-300 hover:text-gray-500 transition-colors shrink-0"
                            aria-label="O que é forecast ponderado?"
                          >
                            <IconInfoCircle className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" align="start" className="max-w-xs text-xs leading-relaxed">
                          Projeção de receita nos próximos meses. Cada deal em aberto é distribuído pela data prevista de fechamento e multiplicado pela probabilidade da sua etapa. Gráfico mostra 3 cenários (pessimista, realista, otimista) pra ancorar planejamento de caixa.
                        </TooltipContent>
                      </Tooltip>
                    </CardTitle>
                    <IconChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform ${forecastOpen ? "rotate-180" : ""}`}
                    />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <ForecastChart data={forecast} />
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </TooltipProvider>

        {pipelines.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1"><IconGitBranch className="h-3.5 w-3.5" /><span>Funis</span></div>
            <Tabs value={selectedPipelineId} onValueChange={handlePipelineChange}>
              <TabsList>
                <TabsTrigger value="all">Todos os Funis<Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px]">{deals.length}</Badge></TabsTrigger>
                {pipelines.map((p) => (
                  <TabsTrigger key={p.rd_pipeline_id} value={p.rd_pipeline_id}>{p.name}<Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px]">{p.deal_count}</Badge></TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}

        <PipelineFilters search={search} onSearchChange={setSearch} stageFilter={stageFilter} onStageChange={setStageFilter} ownerFilter={ownerFilter} onOwnerChange={setOwnerFilter} stages={showPipelineView ? pipelineStages : []} owners={owners} />

        {showPipelineView ? (
          <RdPipelineKanban deals={deals} stages={pipelineStages} isLoading={isLoading || pipelinesLoading} onSelect={handleSelect} onStageDrop={handlePipelineStageDrop} bulkMode={bulkMode} selectedIds={selectedIds} onBulkToggle={handleBulkToggle} onQuickUpdate={handleQuickUpdate} onCreateDeal={handleNew} />
        ) : (
          <DealPipeline deals={deals} isLoading={isLoading} onSelect={handleSelect} onStageDrop={handleStageDrop} bulkMode={bulkMode} selectedIds={selectedIds} onBulkToggle={handleBulkToggle} onQuickUpdate={handleQuickUpdate} customStages={crmStages} onCreateDeal={handleNew} />
        )}

        <BulkActionBar selectedCount={selectedIds.size} onMoveToStage={handleBulkMoveToStage} onAssignOwner={handleBulkAssignOwner} onClear={handleBulkClear} owners={owners} />
        <DealDetailDialog deal={selectedDeal} open={detailOpen} onOpenChange={setDetailOpen} onEdit={handleEdit} />
        <DealFormDialog open={formOpen} onOpenChange={setFormOpen} deal={editingDeal} />

        {/* Automation dialogs */}
        <LossReasonDialog
          open={lossDialogOpen}
          onOpenChange={(open) => { setLossDialogOpen(open); if (!open) setPendingStageDeal(null); }}
          dealName={pendingStageDeal?.name ?? ""}
          onConfirm={handleLossConfirm}
        />
        <ProposalConfirmDialog
          open={proposalDialogOpen}
          onOpenChange={(open) => { setProposalDialogOpen(open); if (!open) setPendingStageDeal(null); }}
          dealName={pendingStageDeal?.name ?? ""}
          onCreateProposal={handleProposalConfirmCreate}
          onSkip={handleProposalSkip}
        />
        <StageBatchEmailsDialog
          open={batchEmailsOpen}
          onClose={() => setBatchEmailsOpen(false)}
          allDeals={allDeals}
          groupBy={showPipelineView ? "rd" : "internal"}
          pipelineStages={pipelineStages}
        />
        <WinCelebrationDialog
          open={winDialogOpen}
          onOpenChange={(open) => { setWinDialogOpen(open); if (!open) setPendingStageDeal(null); }}
          dealName={pendingDealFull?.name ?? pendingStageDeal?.name ?? ""}
          dealValue={pendingDealFull?.value ?? null}
          dealCompany={pendingDealFull?.company ?? null}
          onCreateProject={handleWinCreateProject}
          onSkip={handleWinSkip}
          isCreatingProject={createProject.isPending}
        />
      </div>
    </RequireRole>
  );
}

function mapStageToInternal(stageName: string): string {
  const normalized = stageName.toLowerCase().trim();
  const map: Record<string, string> = {
    qualificação: "qualificacao", qualificacao: "qualificacao", proposta: "proposta",
    negociação: "negociacao", negociacao: "negociacao", fechamento: "negociacao",
    ganho: "fechado_ganho", "fechado ganho": "fechado_ganho",
    perdido: "fechado_perdido", "fechado perdido": "fechado_perdido",
    prospecção: "lead", prospeccao: "lead", "contato inicial": "lead",
  };
  for (const [key, value] of Object.entries(map)) {
    if (normalized.includes(key)) return value;
  }
  return "lead";
}
