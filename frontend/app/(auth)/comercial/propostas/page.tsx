"use client";

import { useState, useMemo } from "react";
import {
  CommercialPeriodFilter,
  filterByPeriod,
  type CommercialPeriodValue,
} from "@/features/comercial/components/period-filter-comercial";
import { useProposals, useProposal, useDeleteProposal, useUpdateProposal } from "@/features/comercial/hooks/use-proposals";
import type { ProposalStatus } from "@/features/comercial/services/proposals";
import { ProposalEditorDialog } from "@/features/comercial/components/proposal-editor-dialog";
import { ProposalScopeDialog } from "@/features/comercial/components/proposal-scope-dialog";
import { EmptyState, ErrorState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
  IconPlus,
  IconSearch,
  IconFileDescription,
  IconDots,
  IconEdit,
  IconTrash,
  IconCheck,
  IconX,
  IconSend,
  IconEye,
  IconSparkles,
} from "@tabler/icons-react";
import Link from "next/link";
import type { ProposalRow } from "@/features/comercial/services/proposals";

function formatBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  // EN keys (code/type)
  draft: { label: "Rascunho", color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
  sent: { label: "Enviada", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  approved: { label: "Aprovada", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  rejected: { label: "Recusada", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  expired: { label: "Expirada", color: "#9ca3af", bg: "rgba(156,163,175,0.12)" },
  // PT keys (actual DB values)
  rascunho: { label: "Rascunho", color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
  enviada: { label: "Enviada", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  aprovada: { label: "Aprovada", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  recusada: { label: "Recusada", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  expirada: { label: "Expirada", color: "#9ca3af", bg: "rgba(156,163,175,0.12)" },
};

const FALLBACK_STATUS = { label: "Desconhecido", color: "#9ca3af", bg: "rgba(156,163,175,0.12)" };

/** All status tab values — includes both EN and PT variants */
const ALL_STATUS_TABS = [
  { value: "draft", label: "Rascunho", match: ["draft", "rascunho"] },
  { value: "sent", label: "Enviada", match: ["sent", "enviada"] },
  { value: "approved", label: "Aprovada", match: ["approved", "aprovada"] },
  { value: "rejected", label: "Recusada", match: ["rejected", "recusada"] },
  { value: "expired", label: "Expirada", match: ["expired", "expirada"] },
];

function matchesStatusTab(proposalStatus: string, tab: string): boolean {
  const entry = ALL_STATUS_TABS.find((t) => t.value === tab);
  return entry ? entry.match.includes(proposalStatus) : proposalStatus === tab;
}

function isOpenStatus(status: string): boolean {
  return ["draft", "rascunho", "sent", "enviada"].includes(status);
}

function isApprovedStatus(status: string): boolean {
  return ["approved", "aprovada"].includes(status);
}

function KPICard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function ProposalRow_({ proposal, onEdit, onDelete, onStatusChange }: {
  proposal: ProposalRow;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: ProposalStatus) => void;
}) {
  const status = STATUS_CONFIG[proposal.status] ?? FALLBACK_STATUS;
  const expiresAt = proposal.created_at
    ? new Date(new Date(proposal.created_at).getTime() + proposal.valid_days * 86400000)
    : null;
  const isExpired = expiresAt ? expiresAt < new Date() : false;

  return (
    <tr className="hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3">
        <Link href={`/comercial/propostas/${proposal.id}`} className="hover:underline">
          <div className="font-medium">{proposal.name}</div>
        </Link>
        {proposal.ref_code && (
          <div className="text-xs text-muted-foreground font-mono">{proposal.ref_code}</div>
        )}
      </td>
      <td className="hidden px-4 py-3 md:table-cell text-sm text-muted-foreground">
        <div>{proposal.company ?? "—"}</div>
        {proposal.contact_name && (
          <div className="text-xs">{proposal.contact_name}</div>
        )}
      </td>
      <td className="hidden px-4 py-3 sm:table-cell text-sm text-muted-foreground">
        {proposal.project_type ?? "—"}
      </td>
      <td className="px-4 py-3 font-semibold text-sm">
        {proposal.value > 0 ? formatBRL(proposal.value) : <span className="text-muted-foreground">—</span>}
      </td>
      <td className="hidden px-4 py-3 lg:table-cell text-xs text-muted-foreground">
        {expiresAt ? (
          <span className={isExpired ? "text-red-500" : ""}>
            {expiresAt.toLocaleDateString("pt-BR")}
          </span>
        ) : "—"}
      </td>
      <td className="px-4 py-3">
        <Badge
          variant="secondary"
          className="text-xs"
          style={{ backgroundColor: status.bg, color: status.color }}
        >
          {status.label}
        </Badge>
      </td>
      <td className="px-4 py-3 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <IconDots className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem asChild>
              <Link href={`/comercial/propostas/${proposal.id}`}>
                <IconEye className="h-3.5 w-3.5 mr-2" /> Visualizar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>
              <IconEdit className="h-3.5 w-3.5 mr-2" /> Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {["draft", "rascunho"].includes(proposal.status) && (
              <DropdownMenuItem onClick={() => onStatusChange("enviada")}>
                <IconSend className="h-3.5 w-3.5 mr-2" /> Marcar como Enviada
              </DropdownMenuItem>
            )}
            {["sent", "enviada"].includes(proposal.status) && (
              <>
                <DropdownMenuItem
                  onClick={() => onStatusChange("aprovada")}
                  className="text-emerald-600"
                >
                  <IconCheck className="h-3.5 w-3.5 mr-2" /> Aprovada
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onStatusChange("recusada")}
                  className="text-red-500"
                >
                  <IconX className="h-3.5 w-3.5 mr-2" /> Recusada
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <IconTrash className="h-3.5 w-3.5 mr-2" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

export default function ComercialPropostas() {
  const [statusTab, setStatusTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<CommercialPeriodValue>({ preset: "all" });
  const [editorOpen, setEditorOpen] = useState(false);
  const [scopeDialogOpen, setScopeDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProposalRow | null>(null);

  const { data: rawProposals = [], isLoading, error, refetch } = useProposals();
  const allProposals = filterByPeriod(rawProposals, period);
  const { data: editingProposal } = useProposal(editingId);
  const deleteMutation = useDeleteProposal();
  const updateMutation = useUpdateProposal();

  const filtered = useMemo(() => {
    let list = allProposals;
    if (statusTab !== "all") list = list.filter((p) => matchesStatusTab(p.status, statusTab));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.company?.toLowerCase().includes(q) ||
          p.contact_name?.toLowerCase().includes(q) ||
          p.ref_code?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [allProposals, statusTab, search]);

  const kpis = useMemo(() => {
    const total = allProposals.length;
    const open = allProposals.filter((p) => isOpenStatus(p.status));
    const openValue = open.reduce((s, p) => s + (p.value ?? 0), 0);
    const approved = allProposals.filter((p) => isApprovedStatus(p.status));
    const approvedValue = approved.reduce((s, p) => s + (p.value ?? 0), 0);
    return { total, openValue, approvedValue };
  }, [allProposals]);

  function handleEdit(id: string) {
    setEditingId(id);
    setEditorOpen(true);
  }

  function handleNew() {
    setEditingId(null);
    setEditorOpen(true);
  }

  function handleEditorClose(open: boolean) {
    setEditorOpen(open);
    if (!open) setEditingId(null);
  }

  function handleStatusChange(id: string, status: ProposalStatus) {
    updateMutation.mutate({ id, updates: { status } });
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Propostas</h1>
          <p className="text-sm text-muted-foreground">
            Geração e acompanhamento de propostas comerciais.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CommercialPeriodFilter value={period} onChange={setPeriod} />
          <Button variant="outline" onClick={() => setScopeDialogOpen(true)}>
            <IconSparkles className="h-4 w-4 mr-1" /> Gerar do Escopo
          </Button>
          <Button onClick={handleNew}>
            <IconPlus className="h-4 w-4 mr-1" /> Nova Proposta
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KPICard label="Total de propostas" value={String(kpis.total)} />
        <KPICard label="Em aberto (draft + enviada)" value={formatBRL(kpis.openValue)} />
        <KPICard label="Aprovadas" value={formatBRL(kpis.approvedValue)} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={statusTab} onValueChange={setStatusTab}>
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            {ALL_STATUS_TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative max-w-sm flex-1">
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, empresa, ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Content */}
      {error ? (
        <ErrorState message="Não foi possível carregar as propostas." onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={IconFileDescription}
          title={search || statusTab !== "all" ? "Nenhuma proposta encontrada" : "Nenhuma proposta ainda"}
          description={
            search || statusTab !== "all"
              ? "Tente ajustar os filtros."
              : "Crie sua primeira proposta comercial com serviços do catálogo."
          }
          cta={!search && statusTab === "all" ? { label: "Nova Proposta", onClick: handleNew } : undefined}
        />
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Proposta</th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">Cliente</th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">Tipologia</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Valor</th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">Validade</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((proposal) => (
                <ProposalRow_
                  key={proposal.id}
                  proposal={proposal}
                  onEdit={() => handleEdit(proposal.id)}
                  onDelete={() => setDeleteTarget(proposal)}
                  onStatusChange={(status) => handleStatusChange(proposal.id, status)}
                />
              ))}
            </tbody>
          </table>
          <div className="border-t bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "proposta" : "propostas"}
            {" — "}valor total:{" "}
            <strong>{formatBRL(filtered.reduce((s, p) => s + (p.value ?? 0), 0))}</strong>
          </div>
        </div>
      )}

      {/* Editor dialog */}
      <ProposalEditorDialog
        open={editorOpen}
        onOpenChange={handleEditorClose}
        proposal={editingId && editingProposal ? editingProposal : null}
      />

      {/* Scope generator dialog */}
      <ProposalScopeDialog
        open={scopeDialogOpen}
        onOpenChange={setScopeDialogOpen}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir proposta?</AlertDialogTitle>
            <AlertDialogDescription>
              A proposta <strong>"{deleteTarget?.name}"</strong> e todos os seus itens serão
              excluídos permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
