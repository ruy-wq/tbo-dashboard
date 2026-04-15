import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { fmt } from "@/features/financeiro/lib/formatters";
import { IconArrowRight, IconTag } from "@tabler/icons-react";
import { ConfidenceBadge } from "./confidence-badge";
import type { AICategorySuggestion } from "@/features/financeiro/hooks/use-ai-reconciliation";
import type { BankTransaction } from "@/lib/supabase/types/bank-reconciliation";

export interface AICategoryRowProps {
  cat: AICategorySuggestion;
  bankTx: BankTransaction | undefined;
}

export const AICategoryRow = memo(function AICategoryRow({ cat, bankTx }: AICategoryRowProps) {
  if (!bankTx) return null;

  return (
    <div className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{bankTx.description}</p>
        <span className="text-xs text-muted-foreground">
          {bankTx.type === "credit" ? "+" : "-"}{fmt(bankTx.amount)}
        </span>
      </div>
      <IconArrowRight className="size-3.5 text-muted-foreground shrink-0" />
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant="outline" className="text-[10px]">
          <IconTag className="size-3 mr-1" />
          {cat.suggestedCategory}
        </Badge>
        {cat.suggestedCostCenter && (
          <Badge variant="secondary" className="text-[10px]">{cat.suggestedCostCenter}</Badge>
        )}
        <ConfidenceBadge confidence={cat.confidence} />
      </div>
    </div>
  );
});
