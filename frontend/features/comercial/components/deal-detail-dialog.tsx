"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  IconCalendar,
  IconEdit,
  IconPercentage,
  IconSparkles,
  IconTrash,
} from "@tabler/icons-react";
import { DEAL_STAGES, type DealStageKey } from "@/lib/constants";
import type { Database } from "@/lib/supabase/types";
import {
  formatCurrency,
  getProbabilityColor,
  getDaysInStage,
  getStageTimeColor,
  getTemperature,
} from "./deal-detail-helpers";
import { DealDetailBody } from "./deal-detail-sections";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { AiEmailDraftsDrawer } from "./ai-email-drafts-drawer";

type DealRow = Database["public"]["Tables"]["crm_deals"]["Row"];

interface DealDetailDialogProps {
  deal: DealRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (deal: DealRow) => void;
  onDelete?: (deal: DealRow) => void;
}

// ── Main Component ───────────────────────────────────────

export function DealDetailDialog({
  deal,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: DealDetailDialogProps) {
  const [aiDraftsOpen, setAiDraftsOpen] = useState(false);

  if (!deal) return null;

  const stageConfig =
    DEAL_STAGES[deal.stage as DealStageKey] ?? {
      label: deal.stage,
      color: "#6b7280",
      bg: "rgba(107,114,128,0.12)",
    };

  const probability = deal.probability ?? 0;
  const value = Number(deal.value) || 0;

  // ── Time in stage ──────────────────────────────────
  const daysInStage = getDaysInStage(deal.updated_at);
  const stageTimeColor = getStageTimeColor(daysInStage);

  // ── Temperature ────────────────────────────────────
  const temp = getTemperature(deal);
  const TempIcon = temp.icon;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="p-0 sm:max-w-[480px] flex flex-col h-full max-h-screen">
        {/* ── Header ──────────────────────────────────── */}
        <div className="border-b bg-muted/30 px-6 pt-6 pb-5 shrink-0">
          <SheetHeader className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <SheetTitle className="text-lg font-bold leading-tight text-left">
                  {deal.name}
                </SheetTitle>
                <SheetDescription className="sr-only">Detalhes do deal</SheetDescription>
              </div>
              {onEdit && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0"
                      onClick={() => onEdit(deal)}
                    >
                      <IconEdit className="h-4 w-4" strokeWidth={1.5} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Editar deal</TooltipContent>
                </Tooltip>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="secondary"
                className="font-semibold"
                style={{
                  backgroundColor: stageConfig.bg,
                  color: stageConfig.color,
                }}
              >
                {stageConfig.label}
              </Badge>
              {/* Time in stage */}
              <Badge variant="outline" className={`text-[10px] font-semibold ${stageTimeColor}`}>
                {daysInStage}d neste stage
              </Badge>
              {/* Temperature */}
              <Badge variant="outline" className={`text-[10px] font-semibold gap-1 ${temp.bg}`}>
                <TempIcon className="h-3 w-3" strokeWidth={2} />
                {temp.label}
              </Badge>
              {deal.priority && (
                <Badge variant="outline" className="capitalize text-xs">
                  {deal.priority}
                </Badge>
              )}
              {deal.source && deal.source !== "manual" && (
                <Badge variant="outline" className="text-xs">
                  {deal.source}
                </Badge>
              )}
            </div>
          </SheetHeader>

          {/* ── Value + Probability hero ─────────────── */}
          {value > 0 && (
            <div className="mt-4 rounded-xl border bg-background p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold tracking-tight text-foreground">
                  {formatCurrency(value)}
                </span>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <IconPercentage className="h-3.5 w-3.5" strokeWidth={1.5} />
                  <span className="font-semibold">{probability}%</span>
                </div>
              </div>
              {/* Probability bar */}
              <div className="mt-2.5 h-1.5 w-full rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getProbabilityColor(probability)}`}
                  style={{ width: `${Math.min(probability, 100)}%` }}
                />
              </div>
              {deal.expected_close && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <IconCalendar className="h-3 w-3" strokeWidth={1.5} />
                  Previsão: {new Date(deal.expected_close).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Scrollable body ─────────────────────────── */}
        <ScrollArea className="flex-1 min-h-0">
          <DealDetailBody deal={deal} />
        </ScrollArea>

        {/* ── Footer ──────────────────────────────────── */}
        <div className="border-t px-6 py-4 flex gap-2 shrink-0">
          {onDelete && (
            <ConfirmDialog
              title="Excluir deal?"
              description={`O deal "${deal.name}" e todo seu histórico de atividades serão excluídos permanentemente. Esta ação não pode ser desfeita.`}
              confirmLabel="Excluir"
              variant="destructive"
              onConfirm={() => onDelete(deal)}
              trigger={
                <Button variant="outline" size="icon" className="shrink-0 text-destructive hover:text-destructive">
                  <IconTrash className="h-4 w-4" strokeWidth={1.5} />
                </Button>
              }
            />
          )}
          <Button
            variant="outline"
            className="flex-1 font-medium gap-1.5"
            onClick={() => setAiDraftsOpen(true)}
          >
            <IconSparkles className="h-4 w-4 text-violet-500" />
            Rascunhos IA
          </Button>
          {onEdit && (
            <Button
              className="flex-1 font-semibold"
              onClick={() => onEdit(deal)}
            >
              <IconEdit className="mr-2 h-4 w-4" strokeWidth={1.5} />
              Editar
            </Button>
          )}
        </div>
      </SheetContent>

      <AiEmailDraftsDrawer
        deal={deal}
        open={aiDraftsOpen}
        onOpenChange={setAiDraftsOpen}
      />
    </Sheet>
  );
}
