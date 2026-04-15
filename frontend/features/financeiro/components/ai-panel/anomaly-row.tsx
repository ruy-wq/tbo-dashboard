import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { IconInfoCircle, IconAlertTriangle } from "@tabler/icons-react";
import type { AIAnomaly } from "@/features/financeiro/hooks/use-ai-reconciliation";

export const AnomalyRow = memo(function AnomalyRow({ anomaly }: { anomaly: AIAnomaly }) {
  const severityConfig = {
    info: { icon: IconInfoCircle, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-800" },
    alerta: { icon: IconAlertTriangle, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800" },
    critico: { icon: IconAlertTriangle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-200 dark:border-red-800" },
  };
  const cfg = severityConfig[anomaly.severity];
  const SeverityIcon = cfg.icon;

  return (
    <div className={cn("flex items-start gap-3 p-3 rounded-lg border", cfg.bg, cfg.border)}>
      <SeverityIcon className={cn("size-4 shrink-0 mt-0.5", cfg.color)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-semibold">{anomaly.title}</span>
          <Badge variant="outline" className="text-[10px] uppercase">{anomaly.severity}</Badge>
          <Badge variant="secondary" className="text-[10px]">{anomaly.type}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">{anomaly.description}</p>
        <p className="text-xs text-muted-foreground mt-1 italic">
          Acao sugerida: {anomaly.suggestedAction}
        </p>
      </div>
    </div>
  );
});
