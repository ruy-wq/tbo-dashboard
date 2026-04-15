import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  IconFileText,
  IconTrendingUp,
  IconTrendingDown,
  IconAlertTriangle,
} from "@tabler/icons-react";

interface SummaryResultData {
  diagnostico: string;
  destaques: Array<{ tipo: string; texto: string }>;
  acoes: string[];
  metricas: {
    margemPct: number;
    conciliacaoPct: number;
    inadimplenciaPct: number;
  };
  meta?: {
    model: string;
    tokensUsed: number;
    latencyMs: number;
  };
}

interface AISummarySectionProps {
  summaryResult: SummaryResultData;
}

export function AISummarySection({ summaryResult }: AISummarySectionProps) {
  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-3">
        <IconFileText className="size-3.5 text-violet-500" />
        <span className="text-xs font-semibold">Diagnostico Financeiro</span>
      </div>

      {/* Narrative */}
      <div className="rounded-lg border bg-card/50 p-4">
        <p className="text-sm leading-relaxed">{summaryResult.diagnostico}</p>
      </div>

      {/* Highlights */}
      {summaryResult.destaques.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {summaryResult.destaques.map((d, i) => {
            const destaqueIcon = d.tipo === "positivo" ? IconTrendingUp : d.tipo === "risco" ? IconTrendingDown : IconAlertTriangle;
            const DestaqueIcon = destaqueIcon;
            const destaqueColor = d.tipo === "positivo" ? "text-emerald-600" : d.tipo === "risco" ? "text-red-600" : "text-amber-600";
            return (
              <div key={i} className="flex items-start gap-2 text-xs">
                <DestaqueIcon className={cn("size-3.5 shrink-0 mt-0.5", destaqueColor)} />
                <span>{d.texto}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Actions */}
      {summaryResult.acoes.length > 0 && (
        <div className="mt-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Acoes Recomendadas</span>
          <ul className="mt-1.5 space-y-1">
            {summaryResult.acoes.map((acao, i) => (
              <li key={i} className="text-xs flex items-start gap-2">
                <span className="text-violet-500 font-bold shrink-0">{i + 1}.</span>
                {acao}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* KPI strip */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
        <span>Margem: <strong className={summaryResult.metricas.margemPct >= 0 ? "text-emerald-600" : "text-red-600"}>{summaryResult.metricas.margemPct.toFixed(1)}%</strong></span>
        <span>Conciliacao: <strong>{summaryResult.metricas.conciliacaoPct.toFixed(0)}%</strong></span>
        <span>Inadimplencia: <strong className={summaryResult.metricas.inadimplenciaPct > 10 ? "text-red-600" : ""}>{summaryResult.metricas.inadimplenciaPct.toFixed(1)}%</strong></span>
      </div>
    </div>
  );
}
