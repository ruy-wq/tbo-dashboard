"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconGitBranch,
  IconPlus,
  IconChevronDown,
  IconChevronRight,
  IconArrowUp,
  IconArrowDown,
  IconMinus,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useProposalVersions, useCreateProposalVersion } from "@/features/comercial/hooks/use-proposals-enhanced";
import type { ProposalVersion } from "@/features/comercial/services/proposal-versions";
import type { ProposalStatus } from "@/features/comercial/services/proposals";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<ProposalStatus, string> = {
  draft: "Rascunho",
  sent: "Enviada",
  approved: "Aprovada",
  rejected: "Rejeitada",
  expired: "Expirada",
  enviada: "Enviada",
  aprovada: "Aprovada",
  recusada: "Recusada",
  rascunho: "Rascunho",
};

const STATUS_VARIANTS: Record<ProposalStatus, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "secondary",
  sent: "outline",
  approved: "default",
  rejected: "destructive",
  expired: "secondary",
  enviada: "outline",
  aprovada: "default",
  recusada: "destructive",
  rascunho: "secondary",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

// ─── Diff Row ─────────────────────────────────────────────────────────────────

interface DiffRowProps {
  version: ProposalVersion;
  previous: ProposalVersion | null;
}

function DiffRow({ version, previous }: DiffRowProps) {
  const [expanded, setExpanded] = useState(false);

  const valueChange = previous ? version.value - previous.value : null;
  const pct = previous && previous.value !== 0 ? (valueChange! / previous.value) * 100 : null;

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center gap-3 p-4 hover:bg-zinc-50 transition-colors text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="font-semibold text-zinc-900">v{version.version}</span>
          <Badge variant={STATUS_VARIANTS[version.status]}>{STATUS_LABELS[version.status]}</Badge>
          {version.ref_code && (
            <span className="text-xs text-zinc-400 font-mono">{version.ref_code}</span>
          )}
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <span className="text-sm font-medium text-zinc-700">{formatCurrency(version.value)}</span>

          {valueChange !== null && pct !== null && (
            <span
              className={`flex items-center gap-1 text-xs font-medium ${
                valueChange > 0 ? "text-emerald-600" : valueChange < 0 ? "text-red-500" : "text-zinc-400"
              }`}
            >
              {valueChange > 0 ? (
                <IconArrowUp size={12} />
              ) : valueChange < 0 ? (
                <IconArrowDown size={12} />
              ) : (
                <IconMinus size={12} />
              )}
              {Math.abs(pct).toFixed(1)}%
            </span>
          )}

          <span className="text-xs text-zinc-400">
            {format(new Date(version.created_at), "dd/MM/yyyy", { locale: ptBR })}
          </span>

          {expanded ? (
            <IconChevronDown size={16} className="text-zinc-400" />
          ) : (
            <IconChevronRight size={16} className="text-zinc-400" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Separator />
            <div className="p-4 bg-zinc-50 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-zinc-500">Subtotal</span>
                <p className="font-medium">{formatCurrency(version.subtotal)}</p>
              </div>
              <div>
                <span className="text-zinc-500">Desconto</span>
                <p className="font-medium text-red-500">- {formatCurrency(version.discount_amount)}</p>
              </div>
              <div>
                <span className="text-zinc-500">Urgência</span>
                <p className="font-medium">{version.urgency_flag ? "Sim" : "Não"}</p>
              </div>
              <div>
                <span className="text-zinc-500">Pacote</span>
                <p className="font-medium">{version.package_discount_flag ? "Sim" : "Não"}</p>
              </div>
              {version.notes && (
                <div className="col-span-2">
                  <span className="text-zinc-500">Notas</span>
                  <p className="text-zinc-700 mt-1">{version.notes}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface ProposalVersionHistoryProps {
  proposalId: string;
  onVersionSelect?: (version: ProposalVersion) => void;
}

export function ProposalVersionHistory({ proposalId, onVersionSelect }: ProposalVersionHistoryProps) {
  const { data: versions, isLoading } = useProposalVersions(proposalId);
  const createVersion = useCreateProposalVersion();

  const sorted = [...(versions ?? [])].sort((a, b) => b.version - a.version);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <IconGitBranch size={18} className="text-zinc-500" />
          <CardTitle className="text-base">Histórico de Versões</CardTitle>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1.5">
              <IconPlus size={14} />
              Nova versão
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Criar nova versão?</AlertDialogTitle>
              <AlertDialogDescription>
                Isso criará uma cópia desta proposta com todos os itens. A versão atual não será alterada.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => createVersion.mutate(proposalId)}
                disabled={createVersion.isPending}
              >
                {createVersion.isPending ? "Criando..." : "Criar versão"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardHeader>

      <CardContent className="space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-8 text-zinc-400">
            <IconGitBranch size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">Nenhuma versão registrada</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((version, i) => (
              <div
                key={version.id}
                onClick={() => onVersionSelect?.(version)}
                className={onVersionSelect ? "cursor-pointer" : undefined}
              >
                <DiffRow
                  version={version}
                  previous={sorted[i + 1] ?? null}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
