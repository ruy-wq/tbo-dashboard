"use client";

// Feature #19 — Modal criar campanha de email (nome, assunto, template, lista, agendamento)
// Feature #20 — Badge de status com cores por estado (draft/scheduled/sending/sent)

import { useState } from "react";
import {
  IconPlus,
  IconSearch,
  IconSpeakerphone,
  IconPlayerStop,
  IconX,
  IconSend,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useEmailCampaigns, useUpdateEmailCampaign, useSendEmailCampaign } from "@/features/marketing/hooks/use-email-studio";
import { EmailCampaignFormModal } from "@/features/marketing/components/email-studio/email-campaign-form-modal";
import { EMAIL_CAMPAIGN_STATUS } from "@/lib/constants";
import type { EmailCampaign, EmailCampaignStatus } from "@/features/marketing/types/marketing";

// Feature #21 preview — action type for cancel/pause/send confirmation
type ActionType = "cancel" | "pause" | "send";

function CampanhasContent() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EmailCampaignStatus | "all">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [actionTarget, setActionTarget] = useState<{ campaign: EmailCampaign; type: ActionType } | null>(null);

  const { data: campaigns, isLoading, error, refetch } = useEmailCampaigns();
  const updateMutation = useUpdateEmailCampaign();
  const sendMutation = useSendEmailCampaign();

  const filtered = (campaigns ?? []).filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.subject.toLowerCase().includes(q);
  });

  function confirmAction() {
    if (!actionTarget) return;
    if (actionTarget.type === "send") {
      sendMutation.mutate(actionTarget.campaign.id, {
        onSettled: () => setActionTarget(null),
      });
      return;
    }
    const newStatus: EmailCampaignStatus =
      actionTarget.type === "cancel" ? "cancelled" : "paused";
    updateMutation.mutate(
      { id: actionTarget.campaign.id, data: { status: newStatus } },
      { onSettled: () => setActionTarget(null) },
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campanhas de Email</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie campanhas de email marketing.
          </p>
        </div>
        {/* Feature #19 — botão Nova Campanha abre modal */}
        <Button onClick={() => setModalOpen(true)}>
          <IconPlus className="mr-1 h-4 w-4" /> Nova Campanha
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Feature #20 — Tabs de status com cores */}
        <Tabs
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as EmailCampaignStatus | "all")}
        >
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            {Object.entries(EMAIL_CAMPAIGN_STATUS).map(([key, def]) => (
              <TabsTrigger key={key} value={key}>{def.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative max-w-sm flex-1">
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar campanhas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {error ? (
        <ErrorState message="Erro ao carregar campanhas." onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={IconSpeakerphone}
          title={search || statusFilter !== "all" ? "Nenhuma campanha encontrada" : "Nenhuma campanha ainda"}
          description={
            search || statusFilter !== "all"
              ? "Tente ajustar os filtros."
              : "Crie sua primeira campanha de email."
          }
          cta={
            !search && statusFilter === "all"
              ? { label: "Nova Campanha", onClick: () => setModalOpen(true) }
              : undefined
          }
        />
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Campanha</th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">Assunto</th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">Segmento</th>
                {/* Feature #20 — coluna Status */}
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">Agendado</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((campaign) => {
                // Feature #20 — badge com cores por status
                const statusDef = EMAIL_CAMPAIGN_STATUS[campaign.status as keyof typeof EMAIL_CAMPAIGN_STATUS];
                const canSend = campaign.status === "draft" || campaign.status === "scheduled";
                const canPause = campaign.status === "sending";
                const canCancel = campaign.status === "draft" || campaign.status === "scheduled";

                return (
                  <tr key={campaign.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{campaign.name}</td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell truncate max-w-xs">
                      {campaign.subject}
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      {campaign.segment_name ? (
                        <Badge variant="outline" className="text-xs font-normal">
                          {campaign.segment_name}
                        </Badge>
                      ) : campaign.list_name ? (
                        <span className="text-xs text-muted-foreground">{campaign.list_name}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {/* Feature #20 — Badge de status com cores */}
                      {statusDef ? (
                        <Badge
                          variant="secondary"
                          style={{ backgroundColor: statusDef.bg, color: statusDef.color }}
                        >
                          {statusDef.label}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">{campaign.status}</span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                      {campaign.scheduled_at
                        ? new Date(campaign.scheduled_at).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "--"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canSend && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-emerald-600 hover:text-emerald-700"
                            onClick={() => setActionTarget({ campaign, type: "send" })}
                          >
                            <IconSend size={12} className="mr-1" /> Enviar
                          </Button>
                        )}
                        {canPause && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => setActionTarget({ campaign, type: "pause" })}
                          >
                            <IconPlayerStop size={12} className="mr-1" /> Pausar
                          </Button>
                        )}
                        {canCancel && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-destructive hover:text-destructive"
                            onClick={() => setActionTarget({ campaign, type: "cancel" })}
                          >
                            <IconX size={12} className="mr-1" /> Cancelar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="border-t bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "campanha" : "campanhas"}
          </div>
        </div>
      )}

      {/* Modal criar campanha — Feature #19 */}
      <EmailCampaignFormModal open={modalOpen} onClose={() => setModalOpen(false)} />

      {/* Confirmação pausar/cancelar */}
      <AlertDialog open={!!actionTarget} onOpenChange={(v) => !v && setActionTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionTarget?.type === "send"
                ? "Enviar Campanha"
                : actionTarget?.type === "cancel"
                  ? "Cancelar Campanha"
                  : "Pausar Campanha"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionTarget?.type === "send"
                ? `Confirma o envio de "${actionTarget.campaign.name}" para todos os contatos do segmento? Os emails serão disparados imediatamente via Resend.`
                : actionTarget?.type === "cancel"
                  ? `Tem certeza que deseja cancelar "${actionTarget.campaign.name}"? Esta ação não pode ser desfeita.`
                  : `Deseja pausar o envio de "${actionTarget?.campaign.name}"? Você poderá retomar depois.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              className={
                actionTarget?.type === "cancel"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : actionTarget?.type === "send"
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : ""
              }
              onClick={confirmAction}
              disabled={updateMutation.isPending || sendMutation.isPending}
            >
              {updateMutation.isPending || sendMutation.isPending
                ? "Processando..."
                : actionTarget?.type === "send"
                  ? "Confirmar Envio"
                  : actionTarget?.type === "cancel"
                    ? "Cancelar Campanha"
                    : "Pausar Envio"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function EmailStudioCampanhasPage() {
  return (
    <RequireRole module="marketing">
      <CampanhasContent />
    </RequireRole>
  );
}
