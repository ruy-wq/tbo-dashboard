"use client";

// Feature #89 — Página de segmentos de email marketing com filtro por etapa de funil

import { useState, useMemo } from "react";
import {
  IconPlus,
  IconSearch,
  IconUsersGroup,
  IconDots,
  IconEdit,
  IconTrash,
  IconRefresh,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { EmptyState, ErrorState } from "@/components/shared";
import { RequireRole } from "@/features/auth/components/require-role";
import {
  useEmailSegments,
  useDeleteEmailSegment,
  useRefreshSegmentCount,
} from "@/features/marketing/hooks/use-email-segments";
import { SegmentFormModal } from "@/features/marketing/components/email-studio/segment-form-modal";
import { DEAL_STAGES } from "@/lib/constants";
import type { EmailSegment, SegmentRule } from "@/features/marketing/types/marketing";

function formatRuleSummary(rule: SegmentRule): string {
  if (rule.field === "funnel_stage") {
    const stages = Array.isArray(rule.value)
      ? rule.value
          .map((v) => DEAL_STAGES[v as keyof typeof DEAL_STAGES]?.label ?? v)
          .join(", ")
      : DEAL_STAGES[rule.value as keyof typeof DEAL_STAGES]?.label ?? String(rule.value);
    const op = rule.operator === "in" ? "em" : rule.operator === "not_in" ? "fora de" : rule.operator === "equals" ? "=" : "≠";
    return `Funil ${op} ${stages}`;
  }
  if (rule.field === "deal_value_min") return `Valor ≥ R$${Number(rule.value).toLocaleString("pt-BR")}`;
  if (rule.field === "deal_value_max") return `Valor ≤ R$${Number(rule.value).toLocaleString("pt-BR")}`;
  if (rule.field === "deal_source") return `Origem: ${Array.isArray(rule.value) ? rule.value.join(", ") : rule.value}`;
  if (rule.field === "has_email") return "Possui email";
  if (rule.field === "created_after") return `Criado após ${rule.value}`;
  if (rule.field === "created_before") return `Criado antes de ${rule.value}`;
  return `${rule.field}: ${String(rule.value)}`;
}

function SegmentosContent() {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState<EmailSegment | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: segments, isLoading, error, refetch } = useEmailSegments();
  const deleteMutation = useDeleteEmailSegment();
  const refreshMutation = useRefreshSegmentCount();

  const filtered = useMemo(() => {
    if (!segments) return [];
    if (!search) return segments;
    const q = search.toLowerCase();
    return segments.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q),
    );
  }, [segments, search]);

  function handleEdit(segment: EmailSegment) {
    setEditingSegment(segment);
    setModalOpen(true);
  }

  function handleModalClose() {
    setModalOpen(false);
    setEditingSegment(null);
  }

  function confirmDelete() {
    if (!deletingId) return;
    deleteMutation.mutate(deletingId, {
      onSettled: () => setDeletingId(null),
    });
  }

  const deletingSegment = segments?.find((s) => s.id === deletingId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Segmentos</h1>
          <p className="text-sm text-muted-foreground">
            Segmente contatos por etapa de funil, origem e valor para campanhas direcionadas.
          </p>
        </div>
        <Button onClick={() => { setEditingSegment(null); setModalOpen(true); }}>
          <IconPlus className="mr-1 h-4 w-4" /> Novo Segmento
        </Button>
      </div>

      {/* Busca */}
      <div className="relative max-w-sm">
        <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar segmentos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {error ? (
        <ErrorState message="Erro ao carregar segmentos." onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={IconUsersGroup}
          title={search ? "Nenhum segmento encontrado" : "Nenhum segmento ainda"}
          description={
            search
              ? "Tente ajustar a busca."
              : "Crie seu primeiro segmento para campanhas de email direcionadas por etapa de funil."
          }
          cta={
            !search
              ? { label: "Criar Segmento", onClick: () => setModalOpen(true) }
              : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((segment) => (
            <div
              key={segment.id}
              className="group rounded-lg border bg-card p-4 space-y-3 transition-colors hover:border-primary/40 cursor-pointer"
              onClick={() => handleEdit(segment)}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{segment.name}</p>
                  {segment.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {segment.description}
                    </p>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <IconDots size={14} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem onClick={() => handleEdit(segment)}>
                      <IconEdit size={14} className="mr-2" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        refreshMutation.mutate({
                          segmentId: segment.id,
                          rules: segment.rules,
                        })
                      }
                    >
                      <IconRefresh size={14} className="mr-2" /> Atualizar Contagem
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setDeletingId(segment.id)}
                    >
                      <IconTrash size={14} className="mr-2" /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Contagem */}
              <div className="flex items-center gap-2">
                <IconUsersGroup size={14} className="text-muted-foreground" />
                <span className="text-sm font-medium">
                  {segment.estimated_count.toLocaleString("pt-BR")} contatos
                </span>
                {segment.last_counted_at && (
                  <span className="text-xs text-muted-foreground">
                    atualizado{" "}
                    {new Date(segment.last_counted_at).toLocaleDateString("pt-BR")}
                  </span>
                )}
              </div>

              {/* Rule summary badges */}
              <div className="flex flex-wrap gap-1">
                {segment.rules.rules.slice(0, 3).map((rule, i) => (
                  <Badge key={i} variant="secondary" className="text-xs font-normal">
                    {formatRuleSummary(rule)}
                  </Badge>
                ))}
                {segment.rules.rules.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{segment.rules.rules.length - 3}
                  </Badge>
                )}
              </div>

              {/* Type badge */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  {segment.segment_type === "dynamic" ? "Dinâmico" : "Estático"}
                </Badge>
                <span>
                  {segment.rules.match === "all" ? "Todas as regras" : "Qualquer regra"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal criar/editar */}
      <SegmentFormModal
        open={modalOpen}
        onClose={handleModalClose}
        segment={editingSegment}
      />

      {/* AlertDialog excluir */}
      <AlertDialog open={!!deletingId} onOpenChange={(v) => !v && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Segmento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir{" "}
              <strong>{deletingSegment?.name ?? "este segmento"}</strong>?
              Campanhas que usam este segmento perderão a referência.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function EmailStudioSegmentosPage() {
  return (
    <RequireRole module="marketing">
      <SegmentosContent />
    </RequireRole>
  );
}
