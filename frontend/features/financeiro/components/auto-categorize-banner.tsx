"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sparkles, Check, X } from "lucide-react";
import type { AutoCategorizeResult } from "@/features/financeiro/services/auto-categorize";

interface AutoCategorizeBannerProps {
  suggestion: AutoCategorizeResult;
  dismissed: boolean;
  onAccept: () => void;
  onDismiss: () => void;
  categoryValue: string | null | undefined;
  costCenterValue: string | null | undefined;
}

export function AutoCategorizeBanner({
  suggestion,
  dismissed,
  onAccept,
  onDismiss,
  categoryValue,
  costCenterValue,
}: AutoCategorizeBannerProps) {
  if (dismissed) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 dark:border-purple-800 dark:bg-purple-950/30">
      <Sparkles className="h-4 w-4 shrink-0 text-purple-600" />
      <div className="flex-1 min-w-0 text-sm">
        <span className="font-medium text-purple-700 dark:text-purple-300">
          Sugestao automatica
        </span>
        <span className="text-purple-600 dark:text-purple-400">
          {suggestion.category_name && !categoryValue && (
            <> &middot; Categoria: <strong>{suggestion.category_name}</strong></>
          )}
          {suggestion.cost_center_name && !costCenterValue && (
            <> &middot; CC: <strong>{suggestion.cost_center_name}</strong></>
          )}
        </span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className="ml-2 text-[10px] border-purple-300 text-purple-600"
              >
                {suggestion.confidence === "high" ? "alta" : suggestion.confidence === "medium" ? "media" : "baixa"}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Regra: {suggestion.matched_rule}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-purple-700 hover:bg-purple-100"
        onClick={onAccept}
      >
        <Check className="h-3.5 w-3.5 mr-1" />
        Aplicar
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 text-purple-400 hover:bg-purple-100"
        onClick={onDismiss}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
