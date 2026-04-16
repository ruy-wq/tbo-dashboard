"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconFlame, IconMail, IconAlertTriangle } from "@tabler/icons-react";
import { toast } from "sonner";
import { useEmailTemplates } from "@/features/marketing/hooks/use-email-studio";
import { scoreDeals } from "../lib/lead-scoring";
import type { Database } from "@/lib/supabase/types";

type DealRow = Database["public"]["Tables"]["crm_deals"]["Row"];

interface Props {
  open: boolean;
  onClose: () => void;
  deals: DealRow[];
}

interface ScoredWithFlags {
  deal: DealRow;
  score: number;
  hasEmail: boolean;
}

export function HotLeadsCampaignDialog({ open, onClose, deals }: Props) {
  const router = useRouter();
  const { data: templates = [], isLoading: templatesLoading } = useEmailTemplates();

  // Filtra apenas deals quentes ativos — inclui sem email pra mostrar problema
  const hotDeals: ScoredWithFlags[] = useMemo(() => {
    const scored = scoreDeals(deals);
    return scored
      .filter((s) => s.temperature === "hot")
      .map((s) => ({
        deal: s.deal,
        score: s.score,
        hasEmail: !!s.deal.contact_email && s.deal.contact_email.trim() !== "",
      }))
      .sort((a, b) => b.score - a.score);
  }, [deals]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [campaignName, setCampaignName] = useState<string>("");

  // Inicializa seleção + nome + template ao abrir
  useEffect(() => {
    if (!open) return;
    setSelectedIds(new Set(hotDeals.filter((h) => h.hasEmail).map((h) => h.deal.id)));
    const today = new Date().toLocaleDateString("pt-BR");
    setCampaignName(`Prospecção Quente — ${today}`);
    const prospTemplate = templates.find(
      (t) =>
        t.category === "Prospecção" ||
        t.name.toLowerCase().includes("prospecção") ||
        t.name.toLowerCase().includes("quente"),
    );
    if (prospTemplate) setSelectedTemplateId(prospTemplate.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
  const selectedCount = selectedIds.size;

  function toggleDeal(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    const allWithEmail = hotDeals.filter((h) => h.hasEmail).map((h) => h.deal.id);
    if (selectedIds.size === allWithEmail.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allWithEmail));
    }
  }

  const createCampaign = useMutation({
    mutationFn: async () => {
      if (!selectedTemplate) throw new Error("Selecione um template");
      if (selectedIds.size === 0) throw new Error("Selecione ao menos um lead");

      // Cast para SupabaseClient genérico — mesmo pattern usado em features/marketing
      // (tabelas email_* ainda não estão nos tipos gerados do Database)
      const supabase = createClient() as unknown as SupabaseClient;
      const dealIds = Array.from(selectedIds);

      // 1. Cria segmento estático com os deals selecionados
      const { data: segment, error: segmentError } = await supabase
        .from("email_segments")
        .insert({
          name: `${campaignName} — leads`,
          description: `Segmento estático gerado a partir do pipeline (${dealIds.length} leads quentes)`,
          segment_type: "static",
          static_deal_ids: dealIds,
          rules: { rules: [], match: "all" },
          tags: ["hot-leads", "auto-generated"],
          estimated_count: dealIds.length,
        } as never)
        .select()
        .single();

      if (segmentError) throw segmentError;
      const segmentRow = segment as { id: string } | null;
      if (!segmentRow) throw new Error("Falha ao criar segmento");

      // 2. Cria campanha draft ligada ao segmento + template
      const { data: campaign, error: campaignError } = await supabase
        .from("email_campaigns")
        .insert({
          name: campaignName,
          subject: selectedTemplate.subject,
          template_id: selectedTemplate.id,
          segment_id: segmentRow.id,
          segment_name: `${campaignName} — leads`,
          status: "draft",
        } as never)
        .select()
        .single();

      if (campaignError) throw campaignError;
      return campaign as { id: string };
    },
    onSuccess: (campaign) => {
      toast.success("Campanha criada como rascunho", {
        description: "Revise o conteúdo antes de disparar.",
      });
      onClose();
      router.push(`/marketing/email-studio/campanhas`);
      void campaign;
    },
    onError: (err) => {
      toast.error("Erro ao criar campanha", {
        description: err instanceof Error ? err.message : "Tente novamente.",
      });
    },
  });

  const withoutEmail = hotDeals.filter((h) => !h.hasEmail).length;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconFlame className="h-5 w-5 text-orange-500" />
            Campanha para Leads Quentes
          </DialogTitle>
          <DialogDescription>
            Curadoria manual dos leads com maior score. A campanha é criada como rascunho —
            você revisa e dispara no Email Studio.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4 py-2">
          {/* Config */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Nome da campanha</label>
              <Input
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="Prospecção Quente — dd/mm/aaaa"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Template</label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={templatesLoading ? "Carregando..." : "Selecione um template"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                      {t.category ? ` · ${t.category}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedTemplate && (
            <div className="rounded-md border border-border bg-muted/30 p-3 text-xs">
              <p className="font-medium mb-0.5">Assunto (após merge):</p>
              <p className="text-muted-foreground font-mono">{selectedTemplate.subject}</p>
            </div>
          )}

          {/* Avisos */}
          {hotDeals.length === 0 && (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800">
              Nenhum lead classificado como quente no momento.
            </div>
          )}

          {withoutEmail > 0 && (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800 flex items-start gap-2">
              <IconAlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                {withoutEmail} {withoutEmail === 1 ? "lead está" : "leads estão"} sem e-mail e{" "}
                {withoutEmail === 1 ? "não pode" : "não podem"} ser incluído
                {withoutEmail === 1 ? "" : "s"}. Atualize no CRM.
              </span>
            </div>
          )}

          {/* Lista */}
          {hotDeals.length > 0 && (
            <>
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-primary hover:underline"
                >
                  {selectedIds.size === hotDeals.filter((h) => h.hasEmail).length
                    ? "Desmarcar todos"
                    : "Selecionar todos com e-mail"}
                </button>
                <span className="text-muted-foreground">
                  {selectedCount} de {hotDeals.length} selecionado{selectedCount === 1 ? "" : "s"}
                </span>
              </div>

              <ScrollArea className="flex-1 min-h-[200px] max-h-[360px] border border-border rounded-md">
                <div className="divide-y divide-border">
                  {hotDeals.map(({ deal, score, hasEmail }) => (
                    <label
                      key={deal.id}
                      className={`flex items-center gap-3 p-3 text-sm transition-colors ${
                        hasEmail ? "hover:bg-muted/50 cursor-pointer" : "opacity-50 cursor-not-allowed"
                      }`}
                    >
                      <Checkbox
                        checked={selectedIds.has(deal.id)}
                        disabled={!hasEmail}
                        onCheckedChange={() => hasEmail && toggleDeal(deal.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{deal.name}</p>
                          <Badge variant="secondary" className="text-[10px] h-4 px-1.5 shrink-0">
                            score {score}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {deal.company || "—"}
                          {deal.contact ? ` · ${deal.contact}` : ""}
                          {hasEmail ? (
                            <>
                              {" · "}
                              <span className="font-mono">{deal.contact_email}</span>
                            </>
                          ) : (
                            <span className="text-amber-600"> · sem e-mail</span>
                          )}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => createCampaign.mutate()}
            disabled={
              createCampaign.isPending ||
              selectedIds.size === 0 ||
              !selectedTemplateId ||
              !campaignName.trim()
            }
          >
            <IconMail className="mr-2 h-4 w-4" />
            {createCampaign.isPending
              ? "Criando..."
              : `Criar campanha (${selectedCount})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
