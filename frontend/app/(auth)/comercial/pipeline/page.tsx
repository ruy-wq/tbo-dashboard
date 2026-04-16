"use client";

import { useState, useMemo, useCallback } from "react";
import {
  useDeals,
  useUpdateDealStage,
  useDeleteDeal,
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
import { ErrorState } from "@/components/shared";
import { usePipelineKeyboard } from "@/features/comercial/hooks/use-pipeline-keyboard";
import { mapStageToInternal } from "@/features/comercial/lib/stage-mapping";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { IconPlus, IconGitBranch, IconCheckbox, IconFlame } from "@tabler/icons-react";
import { toast } from "sonner";
import { DEAL_STAGES, type DealStageKey, type LossReasonValue } from "@/lib/constants";
import { LossReasonDialog } from "@/features/comercial/components/loss-reason-dialog";
import { ProposalConfirmDialog } from "@/features/comercial/components/proposal-confirm-dialog";
import { HotLeadsCampaignDialog } from "@/features/comercial/components/hot-leads-campaign-dialog";
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
  const [hotLeadsDialogOpen, setHotLeadsDialogOpen] = useState(false);
  const [pendingStageDeal, setPendingStageDeal] = useState<{ id: string; name: string; newStage: string } | null>(null);

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

  const handleNew = useCallback(() => { setEditingDeal(null); setFormOpen(true); }, []);

  usePipelineKeyboard(handleNew);

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
  const deleteDealMutation = useDeleteDeal();

  const selectedPipeline = useMemo(() => pipelines.find((p) => p.rd_pipeline_id === selectedPipelineId) ?? null, [pipelines, selectedPipelineId]);
  const pipelineStages = useMemo(() => selectedPipeline?.stages ?? [], [selectedPipeline]);
  const kpis = useMemo(() => computeDealKPIs(deals), [deals]);

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
  function handleDeleteDeal(deal: DealRow) { deleteDealMutation.mutate(deal.id, { onSuccess: () => setDetailOpen(false) }); }

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

    updateStage.mutate({ id: dealId, stage: newStage });
    toast("Deal movido", { description: "Ctrl+Z para desfazer", duration: 3000 });
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
    updateDeal.mutate({ id: dealId, updates: { rd_stage_id: newStageId, rd_stage_name: newStageName, stage: mappedStage } as never });
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

  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  const showPipelineView = selectedPipelineId !== "all" && selectedPipeline;

  return (
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
            <Button variant="outline" size="sm" onClick={() => setHotLeadsDialogOpen(true)} className="gap-1.5">
              <IconFlame className="h-4 w-4 text-orange-500" />
              Campanha p/ leads quentes
            </Button>
            <Button onClick={handleNew}><IconPlus className="mr-2 h-4 w-4" />Novo Deal</Button>
          </div>
        </div>

        <DealKPICards kpis={kpis} distribution={stageDistribution} />

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
        <DealDetailDialog deal={selectedDeal} open={detailOpen} onOpenChange={setDetailOpen} onEdit={handleEdit} onDelete={handleDeleteDeal} />
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
        <HotLeadsCampaignDialog
          open={hotLeadsDialogOpen}
          onClose={() => setHotLeadsDialogOpen(false)}
          deals={allDeals}
        />
      </div>
  );
}
