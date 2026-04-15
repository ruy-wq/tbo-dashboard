import { cn } from "@/lib/utils";
import { IconShieldCheck } from "@tabler/icons-react";

export function HealthScoreGauge({ score }: { score: number }) {
  const color = score >= 80 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-red-600";
  const bgColor = score >= 80 ? "bg-emerald-100 dark:bg-emerald-900/30" : score >= 50 ? "bg-amber-100 dark:bg-amber-900/30" : "bg-red-100 dark:bg-red-900/30";
  const label = score >= 80 ? "Saudavel" : score >= 50 ? "Atencao" : "Critico";

  return (
    <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full", bgColor)}>
      <IconShieldCheck className={cn("size-4", color)} />
      <span className={cn("text-sm font-bold", color)}>{score}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
