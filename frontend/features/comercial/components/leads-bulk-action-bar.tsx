"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  IconArrowRight,
  IconUser,
  IconFlame,
  IconTrash,
  IconX,
  IconChevronDown,
  IconDownload,
} from "@tabler/icons-react";
import { DEAL_STAGES, type DealStageKey } from "@/lib/constants";

const STAGE_OPTIONS: DealStageKey[] = ["lead", "qualificacao", "proposta", "negociacao", "fechado_ganho", "fechado_perdido"];
const PRIORITY_OPTIONS: { value: string; label: string }[] = [
  { value: "alta", label: "🔥 Alta" },
  { value: "media", label: "Média" },
  { value: "baixa", label: "Baixa" },
];

export interface BulkActions {
  onMoveStage: (stage: string) => Promise<void>;
  onSetOwner: (ownerName: string | null) => Promise<void>;
  onSetPriority: (priority: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onExportCsv: () => void;
  onClear: () => void;
}

interface Props extends BulkActions {
  selectedCount: number;
  ownerOptions: string[];
  isPending: boolean;
}

export function LeadsBulkActionBar({
  selectedCount,
  ownerOptions,
  isPending,
  onMoveStage,
  onSetOwner,
  onSetPriority,
  onDelete,
  onExportCsv,
  onClear,
}: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="sticky top-2 z-20 flex flex-wrap items-center gap-2 rounded-lg border bg-card/95 px-3 py-2 shadow-md backdrop-blur">
        <Badge variant="secondary" className="px-2 py-1">
          {selectedCount} {selectedCount === 1 ? "selecionado" : "selecionados"}
        </Badge>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isPending} className="gap-1.5">
              <IconArrowRight className="h-3.5 w-3.5" /> Mover etapa
              <IconChevronDown className="h-3 w-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Mover {selectedCount} para…</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {STAGE_OPTIONS.map((s) => (
              <DropdownMenuItem key={s} onClick={() => onMoveStage(s)}>
                <span
                  className="mr-2 inline-block h-2 w-2 rounded-full"
                  style={{ background: DEAL_STAGES[s].color }}
                />
                {DEAL_STAGES[s].label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isPending} className="gap-1.5">
              <IconUser className="h-3.5 w-3.5" /> Owner
              <IconChevronDown className="h-3 w-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto">
            <DropdownMenuLabel>Atribuir a…</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onSetOwner(null)}>
              <span className="text-muted-foreground">Sem responsável</span>
            </DropdownMenuItem>
            {ownerOptions.map((name) => (
              <DropdownMenuItem key={name} onClick={() => onSetOwner(name)}>
                {name}
              </DropdownMenuItem>
            ))}
            {ownerOptions.length === 0 && (
              <DropdownMenuItem disabled>
                <span className="text-muted-foreground">Sem owners cadastrados</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isPending} className="gap-1.5">
              <IconFlame className="h-3.5 w-3.5" /> Prioridade
              <IconChevronDown className="h-3 w-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Definir prioridade…</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {PRIORITY_OPTIONS.map((p) => (
              <DropdownMenuItem key={p.value} onClick={() => onSetPriority(p.value)}>
                {p.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" size="sm" disabled={isPending} className="gap-1.5" onClick={onExportCsv}>
          <IconDownload className="h-3.5 w-3.5" /> Exportar
        </Button>

        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setConfirmDelete(true)}
        >
          <IconTrash className="h-3.5 w-3.5" /> Deletar
        </Button>

        <div className="ml-auto">
          <Button variant="ghost" size="sm" onClick={onClear} className="gap-1 text-xs">
            <IconX className="h-3.5 w-3.5" /> Limpar
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar {selectedCount} leads?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Os leads selecionados serão removidos
              permanentemente, junto com qualquer atividade vinculada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setConfirmDelete(false);
                await onDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deletar {selectedCount}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
