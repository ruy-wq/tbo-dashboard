"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  IconMailbox,
  IconExternalLink,
  IconChevronRight,
  IconArrowLeft,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useCadences, useCadenceDetail, groupCadencesByStage, type Cadence } from "@/features/comercial/hooks/use-cadences";
import { RequireRole } from "@/features/auth/components/require-role";

const STAGE_LABEL: Record<string, string> = {
  lead: "Lead / Prospecção",
  qualificacao: "Qualificação / Oportunidade",
  proposta: "Proposta em Aberto",
  negociacao: "Negociação",
  fechado_ganho: "Cliente (ganho)",
  fechado_perdido: "Lost / Reativação",
};

function CadenciasContent() {
  const { data: cadences = [], isLoading } = useCadences();
  const grouped = useMemo(() => groupCadencesByStage(cadences), [cadences]);
  const stageOrder = ["lead", "qualificacao", "proposta", "negociacao", "fechado_ganho", "fechado_perdido"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link href="/comercial" className="hover:text-foreground transition-colors inline-flex items-center gap-1">
              <IconArrowLeft className="size-3" />
              Voltar ao Comercial
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <IconMailbox className="size-6 text-violet-500" />
            Cadências de e-mail
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Templates de cadência por etapa do funil. Matricule um deal em uma cadência no detalhe do deal.
          </p>
        </div>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando cadências…</p>}

      {!isLoading && cadences.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-12 text-center">
          <IconMailbox className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium mb-1">Nenhuma cadência disponível</p>
          <p className="text-xs text-muted-foreground">
            As cadências do Notion são aplicadas automaticamente em todos os tenants.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {stageOrder.map((stage) => {
          const list = grouped[stage] ?? [];
          if (list.length === 0) return null;
          return (
            <div key={stage} className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {STAGE_LABEL[stage] ?? stage}
                </h2>
                <Badge variant="outline" className="text-[10px]">
                  {list.length} cadência{list.length === 1 ? "" : "s"}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {list.map((c) => <CadenceCard key={c.id} cadence={c} />)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CadenceCard({ cadence }: { cadence: Cadence }) {
  const [open, setOpen] = useState(false);
  const { data: detail } = useCadenceDetail(open ? cadence.id : null);

  return (
    <div className="rounded-lg border border-border bg-card">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="w-full text-left px-4 py-3 hover:bg-accent/30 transition-colors flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold">{cadence.name}</p>
              {cadence.bu && (
                <Badge variant="outline" className="text-[9px] h-3.5 px-1">{cadence.bu}</Badge>
              )}
              {cadence.is_system && (
                <Badge variant="outline" className="text-[9px] h-3.5 px-1 text-violet-600 border-violet-300">
                  Notion
                </Badge>
              )}
            </div>
            {cadence.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{cadence.description}</p>
            )}
            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
              <span>Intervalo ~{cadence.default_interval_days} dias</span>
              {cadence.source_url && (
                <a
                  href={cadence.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-0.5 text-violet-600 hover:underline"
                >
                  <IconExternalLink className="h-2.5 w-2.5" />
                  Notion
                </a>
              )}
            </div>
          </div>
          <IconChevronRight className={`h-4 w-4 shrink-0 mt-1 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t px-4 py-3 space-y-2">
            {!detail && <p className="text-xs text-muted-foreground">Carregando steps…</p>}
            {detail?.steps.map((step) => (
              <div key={step.id} className="border-l-2 border-violet-200 pl-3 py-1">
                <p className="text-xs font-medium">{step.name}</p>
                <p className="text-[11px] text-muted-foreground italic mt-0.5">
                  Assunto: {step.subject_template}
                </p>
                {step.objective && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">🎯 {step.objective}</p>
                )}
                <pre className="text-[10px] font-mono whitespace-pre-wrap text-muted-foreground mt-1.5 max-h-32 overflow-y-auto">
                  {step.body_template}
                </pre>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export default function CadenciasPage() {
  return (
    <RequireRole module="comercial">
      <CadenciasContent />
    </RequireRole>
  );
}
