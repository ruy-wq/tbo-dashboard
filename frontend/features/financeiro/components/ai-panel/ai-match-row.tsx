import { memo } from "react";
import { Button } from "@/components/ui/button";
import { fmt } from "@/features/financeiro/lib/formatters";
import {
  IconCheck,
  IconX,
  IconArrowRight,
  IconInfoCircle,
  IconBuildingBank,
} from "@tabler/icons-react";
import { ConfidenceBadge } from "./confidence-badge";
import type { AIMatchSuggestion } from "@/features/financeiro/hooks/use-ai-reconciliation";
import type { BankTransaction } from "@/lib/supabase/types/bank-reconciliation";
import type { FinanceTransaction } from "@/features/financeiro/services/finance-types";

export interface AIMatchRowProps {
  match: AIMatchSuggestion;
  bankTx: BankTransaction | undefined;
  financeTx: FinanceTransaction | undefined;
  onApprove: (match: AIMatchSuggestion) => void;
  onReject: (match: AIMatchSuggestion) => void;
  isApproving: boolean;
}

export const AIMatchRow = memo(function AIMatchRow({
  match,
  bankTx,
  financeTx,
  onApprove,
  onReject,
  isApproving,
}: AIMatchRowProps) {
  if (!bankTx || !financeTx) return null;

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
      {/* Bank tx */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <IconBuildingBank className="size-3.5 text-muted-foreground shrink-0" />
          <p className="text-xs font-medium truncate">{bankTx.description}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className={bankTx.type === "credit" ? "text-emerald-600 font-semibold" : "text-red-600 font-semibold"}>
            {bankTx.type === "credit" ? "+" : "-"}{fmt(bankTx.amount)}
          </span>
          <span>{new Date(bankTx.transaction_date + "T12:00:00").toLocaleDateString("pt-BR")}</span>
        </div>
      </div>

      {/* Arrow + confidence */}
      <div className="flex flex-col items-center gap-1 shrink-0 pt-1">
        <ConfidenceBadge confidence={match.confidence} />
        <IconArrowRight className="size-3.5 text-muted-foreground" />
      </div>

      {/* Finance tx */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate mb-1">{financeTx.description}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className={financeTx.type === "receita" ? "text-emerald-600 font-semibold" : "text-red-600 font-semibold"}>
            {fmt(financeTx.amount)}
          </span>
          <span>{new Date(financeTx.date + "T12:00:00").toLocaleDateString("pt-BR")}</span>
          {financeTx.counterpart && <span>. {financeTx.counterpart}</span>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1 shrink-0 pt-1">
        <Button
          size="icon"
          variant="ghost"
          className="size-7 rounded-full text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
          title="Aprovar match AI"
          disabled={isApproving}
          onClick={() => onApprove(match)}
        >
          <IconCheck className="size-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-7 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
          title="Rejeitar match AI"
          disabled={isApproving}
          onClick={() => onReject(match)}
        >
          <IconX className="size-3.5" />
        </Button>
      </div>

      {/* Reasoning tooltip */}
      <div className="shrink-0 pt-1" title={match.reasoning}>
        <IconInfoCircle className="size-3.5 text-muted-foreground cursor-help" />
      </div>
    </div>
  );
});
