"use client";

import { useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconSparkles,
  IconAlertTriangle,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { generateAiEmailDrafts } from "../services/ai-email-drafts";
import { useQueryClient } from "@tanstack/react-query";
import { DEAL_STAGES, type DealStageKey } from "@/lib/constants";
import type { Database } from "@/lib/supabase/types";

type DealRow = Database["public"]["Tables"]["crm_deals"]["Row"];

interface Props {
  open: boolean;
  onClose: () => void;
  /** Todos os deals carregados no pipeline atual */
  allDeals: DealRow[];
  /** Stage pré-selecionada (se user clicou em "gerar emails" de uma coluna específica) */
  initialStage?: string;
}

interface DealStatus {
  deal_id: string;
  status: "pending" | "processing" | "done" | "error";
  error?: string;
}

const CONCURRENCY = 3;

export function StageBatchEmailsDialog({
  open,
  onClose,
  allDeals,
  initialStage,
}: Props) {
  const qc = useQueryClient();

  // Stages disponíveis no pipeline atual (só as que têm deals ativos)
  const availableStages = useMemo(() => {
    const stageKeys = new Set<string>();
    for (const d of allDeals) {
      if (d.stage && d.stage !== "fechado_ganho" && d.stage !== "fechado_perdido") {
        stageKeys.add(d.stage);
      }
    }
    return Array.from(stageKeys);
  }, [allDeals]);

  const [selectedStage, setSelectedStage] = useState<string>("");

  // Deals da stage selecionada
  const stageDeals = useMemo(
    () => (selectedStage ? allDeals.filter((d) => d.stage === selectedStage) : []),
    [allDeals, selectedStage],
  );

  // Filtra deals com e-mail e deduplica por email
  const withEmail = useMemo(() => {
    const seen = new Set<string>();
    return stageDeals.filter((d) => {
      if (!d.contact_email || !d.contact_email.trim()) return false;
      const key = d.contact_email.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [stageDeals]);

  const withoutEmail = stageDeals.length - withEmail.length;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statusMap, setStatusMap] = useState<Record<string, DealStatus>>({});
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);

  function stageDisplayLabel(key: string): string {
    return DEAL_STAGES[key as DealStageKey]?.label ?? key;
  }

  useEffect(() => {
    if (open) {
      setSelectedStage(initialStage || availableStages[0] || "");
      setStatusMap({});
      setRunning(false);
      setFinished(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialStage]);

  useEffect(() => {
    // Quando troca de stage, re-seleciona todos os deals da stage
    if (!running) {
      setSelectedIds(new Set(withEmail.map((d) => d.id)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStage]);

  function toggleDeal(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds(
      selectedIds.size === withEmail.length
        ? new Set()
        : new Set(withEmail.map((d) => d.id)),
    );
  }

  const selectedCount = selectedIds.size;
  const processedCount = Object.values(statusMap).filter(
    (s) => s.status === "done" || s.status === "error",
  ).length;
  const doneCount = Object.values(statusMap).filter((s) => s.status === "done").length;
  const errorCount = Object.values(statusMap).filter((s) => s.status === "error").length;
  const progressPct =
    selectedCount === 0 ? 0 : Math.round((processedCount / selectedCount) * 100);

  async function processBatch() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setRunning(true);
    setFinished(false);
    const initialStatus: Record<string, DealStatus> = {};
    for (const id of ids) initialStatus[id] = { deal_id: id, status: "pending" };
    setStatusMap(initialStatus);

    const supabase = createClient() as unknown as SupabaseClient;
    const queue = [...ids];
    const workers: Promise<void>[] = [];

    for (let i = 0; i < Math.min(CONCURRENCY, queue.length); i++) {
      workers.push(
        (async () => {
          while (queue.length > 0) {
            const id = queue.shift();
            if (!id) break;
            setStatusMap((prev) => ({
              ...prev,
              [id]: { deal_id: id, status: "processing" },
            }));
            try {
              await generateAiEmailDrafts(supabase, id);
              setStatusMap((prev) => ({
                ...prev,
                [id]: { deal_id: id, status: "done" },
              }));
            } catch (err) {
              setStatusMap((prev) => ({
                ...prev,
                [id]: {
                  deal_id: id,
                  status: "error",
                  error: err instanceof Error ? err.message : "erro desconhecido",
                },
              }));
            }
          }
        })(),
      );
    }

    await Promise.all(workers);
    // Invalida cache de todos os deals processados
    for (const id of ids) {
      qc.invalidateQueries({ queryKey: ["ai-email-drafts", id] });
    }
    setRunning(false);
    setFinished(true);

    const successes = ids.filter((id) => statusMap[id]?.status === "done").length;
    const failures = ids.length - successes;
    if (failures === 0) {
      toast.success(`${ids.length} rascunhos gerados`, {
        description: "Abra cada deal no pipeline pra revisar.",
      });
    } else {
      toast.warning(`${successes} OK, ${failures} com erro`, {
        description: "Veja o detalhe na lista e tente novamente se necessário.",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !running && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <IconSparkles className="h-4 w-4 text-violet-500" />
            Gerar rascunhos IA por etapa
          </DialogTitle>
          <DialogDescription className="text-xs">
            A IA gera 3 variações de e-mail personalizadas pra cada lead da etapa
            selecionada. Usa o nome do deal como escopo do projeto e contextualiza
            com dados da empresa.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-3 py-2">
          {/* Seletor de etapa */}
          {!running && !finished && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Etapa do funil</label>
              <Select value={selectedStage} onValueChange={setSelectedStage}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma etapa..." />
                </SelectTrigger>
                <SelectContent>
                  {availableStages.map((key) => {
                    const count = allDeals.filter((d) => d.stage === key).length;
                    return (
                      <SelectItem key={key} value={key}>
                        {stageDisplayLabel(key)} ({count})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {withoutEmail > 0 && !running && !finished && (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800 flex items-start gap-2">
              <IconAlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                {withoutEmail} {withoutEmail === 1 ? "lead sem" : "leads sem"} e-mail{" "}
                {withoutEmail === 1 ? "foi" : "foram"} ignorado
                {withoutEmail === 1 ? "" : "s"}. O rascunho ainda pode ser gerado mas não poderá ser enviado.
              </span>
            </div>
          )}

          {selectedStage && withEmail.length === 0 && !running && !finished && (
            <div className="rounded-md border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              Nenhum lead com e-mail válido nesta etapa.
            </div>
          )}

          {withEmail.length > 0 && !running && !finished && (
            <>
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-primary hover:underline"
                >
                  {selectedIds.size === withEmail.length
                    ? "Desmarcar todos"
                    : "Selecionar todos"}
                </button>
                <span className="text-muted-foreground">
                  {selectedCount} de {withEmail.length} selecionado{selectedCount === 1 ? "" : "s"}
                </span>
              </div>

              <ScrollArea className="flex-1 min-h-[200px] max-h-[380px] border border-border rounded-md">
                <div className="divide-y divide-border">
                  {withEmail.map((deal) => (
                    <label
                      key={deal.id}
                      className="flex items-center gap-3 p-3 text-sm hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedIds.has(deal.id)}
                        onCheckedChange={() => toggleDeal(deal.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{deal.name}</p>
                          {deal.value != null && Number(deal.value) > 0 && (
                            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 shrink-0">
                              R$ {Number(deal.value).toLocaleString("pt-BR")}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {deal.company || "—"}
                          {deal.contact ? ` · ${deal.contact}` : ""}
                          {" · "}
                          <span className="font-mono">{deal.contact_email}</span>
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}

          {(running || finished) && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">
                    {running
                      ? `Processando ${processedCount} de ${selectedCount}...`
                      : `Concluído: ${doneCount} OK${errorCount > 0 ? `, ${errorCount} com erro` : ""}`}
                  </span>
                  <span className="text-muted-foreground">{progressPct}%</span>
                </div>
                <Progress value={progressPct} className="h-2" />
              </div>

              <ScrollArea className="flex-1 min-h-[200px] max-h-[340px] border border-border rounded-md">
                <div className="divide-y divide-border">
                  {Array.from(selectedIds).map((id) => {
                    const deal = withEmail.find((d) => d.id === id);
                    if (!deal) return null;
                    const s = statusMap[id];
                    return (
                      <div
                        key={id}
                        className="flex items-center gap-3 p-2.5 text-xs"
                      >
                        <div className="w-5 shrink-0">
                          {s?.status === "done" && (
                            <IconCheck className="h-4 w-4 text-emerald-600" />
                          )}
                          {s?.status === "error" && (
                            <IconX className="h-4 w-4 text-destructive" />
                          )}
                          {s?.status === "processing" && (
                            <IconSparkles className="h-4 w-4 text-violet-500 animate-pulse" />
                          )}
                          {(!s || s.status === "pending") && (
                            <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/40" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{deal.name}</p>
                          {s?.status === "error" && s.error && (
                            <p className="text-[10px] text-destructive truncate">{s.error}</p>
                          )}
                          {s?.status !== "error" && (
                            <p className="text-[11px] text-muted-foreground truncate">
                              {deal.company || "—"}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          {!running && !finished && (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                onClick={processBatch}
                disabled={selectedCount === 0}
                className="gap-1.5"
              >
                <IconSparkles className="h-4 w-4" />
                Gerar rascunhos ({selectedCount})
              </Button>
            </>
          )}
          {running && (
            <Button disabled variant="outline">
              Processando...
            </Button>
          )}
          {finished && (
            <Button onClick={onClose}>
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
