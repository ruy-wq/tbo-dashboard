import { cn } from "@/lib/utils";

export function ConfidenceBadge({ confidence }: { confidence: number }) {
  const tier = confidence >= 85 ? "alta" : confidence >= 50 ? "media" : "baixa";
  const colorMap = {
    alta: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    media: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    baixa: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
  const labelMap = { alta: "Alta", media: "Media", baixa: "Baixa" };

  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-full", colorMap[tier])}>
      {confidence}% . {labelMap[tier]}
    </span>
  );
}
