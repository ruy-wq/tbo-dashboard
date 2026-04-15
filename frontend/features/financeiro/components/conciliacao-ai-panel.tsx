"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useApplyReconciliation } from "@/features/financeiro/hooks/use-reconciliation";
import {
  useAIAnalyze,
  useAICategorize,
  useAIAnomalies,
  useAISummary,
  type AIMatchSuggestion,
} from "@/features/financeiro/hooks/use-ai-reconciliation";
import type { BankTransaction } from "@/lib/supabase/types/bank-reconciliation";
import type { FinanceTransaction, FinanceCategory, FinanceCostCenter } from "@/features/financeiro/services/finance-types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconBrain,
  IconSparkles,
  IconTag,
  IconLoader2,
  IconInfoCircle,
  IconAlertTriangle,
  IconShieldCheck,
  IconFileText,
} from "@tabler/icons-react";
import { AIMatchRow } from "./ai-panel/ai-match-row";
import { AICategoryRow } from "./ai-panel/ai-category-row";
import { AnomalyRow } from "./ai-panel/anomaly-row";
import { HealthScoreGauge } from "./ai-panel/health-score-gauge";
import { AISummarySection } from "./ai-panel/ai-summary-section";

interface ConciliacaoAIPanelProps {
  unmatchedBankTxs: BankTransaction[];
  availableFinanceTxs: FinanceTransaction[];
  categories: FinanceCategory[];
  costCenters: FinanceCostCenter[];
}

export function ConciliacaoAIPanel({
  unmatchedBankTxs,
  availableFinanceTxs,
  categories,
  costCenters,
}: ConciliacaoAIPanelProps) {
  const { toast } = useToast();
  const analyzeMutation = useAIAnalyze();
  const categorizeMutation = useAICategorize();
  const anomalyMutation = useAIAnomalies();
  const summaryMutation = useAISummary();
  const applyMutation = useApplyReconciliation();
  const [rejectedMatches, setRejectedMatches] = useState<Set<string>>(new Set());

  const matchResult = analyzeMutation.data;
  const catResult = categorizeMutation.data;
  const anomalyResult = anomalyMutation.data;
  const summaryResult = summaryMutation.data;
  const isAnalyzing = analyzeMutation.isPending;
  const isCategorizing = categorizeMutation.isPending;
  const isDetectingAnomalies = anomalyMutation.isPending;
  const isSummarizing = summaryMutation.isPending;

  const bankTxMap = new Map(unmatchedBankTxs.map((tx) => [tx.id, tx]));
  const financeTxMap = new Map(availableFinanceTxs.map((tx) => [tx.id, tx]));

  function handleAnalyze() {
    analyzeMutation.mutate(
      { unmatchedBankTxs, availableFinanceTxs },
      { onError: (err) => toast({ title: "Erro na analise AI", description: err.message, variant: "destructive" }) }
    );
  }

  function handleCategorize() {
    categorizeMutation.mutate(
      { bankTxs: unmatchedBankTxs, categories, costCenters },
      { onError: (err) => toast({ title: "Erro na categorizacao AI", description: err.message, variant: "destructive" }) }
    );
  }

  function handleApproveMatch(match: AIMatchSuggestion) {
    applyMutation.mutate(
      { bankTxId: match.bankTxId, financeTxId: match.financeTxId, score: match.confidence, method: "manual" },
      {
        onSuccess: () => {
          toast({ title: "Conciliado via AI!", description: match.reasoning });
          setRejectedMatches((prev) => new Set([...prev, match.bankTxId]));
        },
        onError: (err) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
      }
    );
  }

  function handleRejectMatch(match: AIMatchSuggestion) {
    setRejectedMatches((prev) => new Set([...prev, match.bankTxId]));
    toast({ title: "Match AI rejeitado" });
  }

  function handleAnomalies() {
    const totalCredit = unmatchedBankTxs.filter((t) => t.type === "credit").reduce((s, t) => s + t.amount, 0);
    const totalDebit = unmatchedBankTxs.filter((t) => t.type === "debit").reduce((s, t) => s + t.amount, 0);
    anomalyMutation.mutate(
      { bankTxs: unmatchedBankTxs, financeTxs: availableFinanceTxs, reconciledCount: 0, pendingCount: unmatchedBankTxs.length, totalCredit, totalDebit },
      { onError: (err) => toast({ title: "Erro na deteccao de anomalias", description: err.message, variant: "destructive" }) }
    );
  }

  function handleSummary() {
    const totalReceitas = availableFinanceTxs.filter((t) => t.type === "receita").reduce((s, t) => s + t.amount, 0);
    const totalDespesas = availableFinanceTxs.filter((t) => t.type === "despesa").reduce((s, t) => s + t.amount, 0);
    const overdueList = availableFinanceTxs.filter((t) => t.status === "atrasado");
    const catTotals = new Map<string, number>();
    for (const tx of availableFinanceTxs.filter((t) => t.type === "despesa")) {
      const key = tx.category_id ?? "Sem categoria";
      catTotals.set(key, (catTotals.get(key) ?? 0) + tx.amount);
    }
    const topCategories = [...catTotals.entries()].map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total).slice(0, 5);
    const cpTotals = new Map<string, number>();
    for (const tx of availableFinanceTxs.filter((t) => t.counterpart)) {
      const key = tx.counterpart!;
      cpTotals.set(key, (cpTotals.get(key) ?? 0) + tx.amount);
    }
    const topCounterparts = [...cpTotals.entries()].map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total).slice(0, 5);
    const now = new Date();
    const periodLabel = `${now.toLocaleString("pt-BR", { month: "long", year: "numeric" })}`;
    summaryMutation.mutate(
      {
        periodLabel, totalReceitas, totalDespesas, saldo: totalReceitas - totalDespesas,
        reconciledPct: 0, pendingCount: unmatchedBankTxs.length,
        overdueCount: overdueList.length, overdueAmount: overdueList.reduce((s, t) => s + t.amount, 0),
        topCategories, topCounterparts,
        recentTxs: availableFinanceTxs.slice(0, 10).map((t) => ({ description: t.description, amount: t.amount, type: t.type, date: t.date })),
      },
      { onError: (err) => toast({ title: "Erro no resumo AI", description: err.message, variant: "destructive" }) }
    );
  }

  const visibleMatches = matchResult?.matches.filter((m) => !rejectedMatches.has(m.bankTxId)) ?? [];

  if (unmatchedBankTxs.length === 0) return null;

  return (
    <Card className="border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-50/50 to-background dark:from-violet-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <IconBrain className="size-4 text-violet-600" />
            Agente AI -- Analista Financeiro
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5 border-violet-300 hover:bg-violet-50 dark:border-violet-700 dark:hover:bg-violet-950/30" onClick={handleSummary} disabled={isSummarizing || availableFinanceTxs.length === 0}>
              {isSummarizing ? <IconLoader2 className="size-3.5 animate-spin" /> : <IconFileText className="size-3.5" />} Resumo
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5 border-violet-300 hover:bg-violet-50 dark:border-violet-700 dark:hover:bg-violet-950/30" onClick={handleAnomalies} disabled={isDetectingAnomalies || unmatchedBankTxs.length === 0}>
              {isDetectingAnomalies ? <IconLoader2 className="size-3.5 animate-spin" /> : <IconAlertTriangle className="size-3.5" />} Anomalias
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5 border-violet-300 hover:bg-violet-50 dark:border-violet-700 dark:hover:bg-violet-950/30" onClick={handleCategorize} disabled={isCategorizing || unmatchedBankTxs.length === 0}>
              {isCategorizing ? <IconLoader2 className="size-3.5 animate-spin" /> : <IconTag className="size-3.5" />} Categorizar
            </Button>
            <Button size="sm" className="h-7 text-xs gap-1.5 bg-violet-600 hover:bg-violet-700 text-white" onClick={handleAnalyze} disabled={isAnalyzing || unmatchedBankTxs.length === 0}>
              {isAnalyzing ? <IconLoader2 className="size-3.5 animate-spin" /> : <IconSparkles className="size-3.5" />}
              {isAnalyzing ? "Analisando..." : `Analisar ${unmatchedBankTxs.length}`}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Analise semantica de transacoes sem correspondencia usando inteligencia artificial.</p>
      </CardHeader>

      <CardContent className="pt-0">
        {(isAnalyzing || isCategorizing) && (
          <div className="space-y-2 py-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex gap-3 items-center">
                <Skeleton className="flex-1 h-12 rounded-lg" />
                <Skeleton className="w-12 h-6 rounded-full" />
                <Skeleton className="flex-1 h-12 rounded-lg" />
              </div>
            ))}
            <p className="text-xs text-center text-muted-foreground animate-pulse mt-2">
              {isAnalyzing ? "Buscando correspondencias inteligentes..." : "Categorizando transacoes..."}
            </p>
          </div>
        )}

        {analyzeMutation.isError && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/30 p-3 text-sm">
            <IconInfoCircle className="size-4 text-red-500 shrink-0" />
            <p className="text-xs text-red-700 dark:text-red-300">{analyzeMutation.error.message}</p>
            <Button size="sm" variant="ghost" className="h-6 text-xs ml-auto" onClick={handleAnalyze}>Tentar novamente</Button>
          </div>
        )}

        {visibleMatches.length > 0 && (
          <div className="mt-2">
            <div className="flex items-center gap-2 mb-2">
              <IconSparkles className="size-3.5 text-violet-500" />
              <span className="text-xs font-semibold">Matches Encontrados pela AI</span>
              <Badge variant="secondary" className="text-[10px]">{visibleMatches.length}</Badge>
              {matchResult?.cached && <Badge variant="outline" className="text-[10px] text-muted-foreground">cache</Badge>}
            </div>
            <div className="rounded-lg border bg-card/50 px-3">
              {visibleMatches.map((match) => (
                <AIMatchRow key={`${match.bankTxId}-${match.financeTxId}`} match={match} bankTx={bankTxMap.get(match.bankTxId)} financeTx={financeTxMap.get(match.financeTxId)} onApprove={handleApproveMatch} onReject={handleRejectMatch} isApproving={applyMutation.isPending} />
              ))}
            </div>
            {matchResult?.insights && (
              <p className="text-xs text-muted-foreground mt-2 italic"><IconBrain className="size-3 inline mr-1" />{matchResult.insights}</p>
            )}
          </div>
        )}

        {matchResult && visibleMatches.length === 0 && !isAnalyzing && (
          <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
            <IconInfoCircle className="size-3.5" />
            {matchResult.insights ?? "Nenhum match adicional encontrado pela AI."}
          </div>
        )}

        {catResult && catResult.categorizations.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <IconTag className="size-3.5 text-violet-500" />
              <span className="text-xs font-semibold">Categorizacao AI</span>
              <Badge variant="secondary" className="text-[10px]">{catResult.categorizations.length}</Badge>
            </div>
            <div className="rounded-lg border bg-card/50 px-3">
              {catResult.categorizations.map((cat) => (
                <AICategoryRow key={cat.bankTxId} cat={cat} bankTx={bankTxMap.get(cat.bankTxId)} />
              ))}
            </div>
          </div>
        )}

        {anomalyResult && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <IconAlertTriangle className="size-3.5 text-violet-500" />
                <span className="text-xs font-semibold">Deteccao de Anomalias</span>
                <Badge variant="secondary" className="text-[10px]">{anomalyResult.anomalies.length}</Badge>
              </div>
              <HealthScoreGauge score={anomalyResult.healthScore} />
            </div>
            {anomalyResult.anomalies.length > 0 ? (
              <div className="space-y-2">
                {anomalyResult.anomalies.map((anomaly) => (<AnomalyRow key={anomaly.id} anomaly={anomaly} />))}
              </div>
            ) : (
              <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
                <IconShieldCheck className="size-3.5 text-emerald-500" /> Nenhuma anomalia detectada. Transacoes parecem consistentes.
              </div>
            )}
            {anomalyResult.summary && (
              <p className="text-xs text-muted-foreground mt-2 italic"><IconBrain className="size-3 inline mr-1" />{anomalyResult.summary}</p>
            )}
          </div>
        )}

        {summaryResult && <AISummarySection summaryResult={summaryResult} />}

        {(isDetectingAnomalies || isSummarizing) && (
          <div className="space-y-2 py-4 mt-2">
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
            <p className="text-xs text-center text-muted-foreground animate-pulse">
              {isDetectingAnomalies ? "Detectando anomalias financeiras..." : "Gerando diagnostico financeiro..."}
            </p>
          </div>
        )}

        {(matchResult?.meta ?? anomalyResult?.meta ?? summaryResult?.meta) && (
          <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground">
            {(() => {
              const meta = matchResult?.meta ?? anomalyResult?.meta ?? summaryResult?.meta;
              if (!meta) return null;
              return (<><span>Modelo: {meta.model}</span><span>.</span><span>Tokens: {meta.tokensUsed}</span><span>.</span><span>Latencia: {meta.latencyMs}ms</span></>);
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
