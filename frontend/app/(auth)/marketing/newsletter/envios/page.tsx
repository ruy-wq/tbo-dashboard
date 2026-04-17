"use client";

// Feature #22 — Tabela de histórico de envios com métricas (enviados, entregues, abertos, clicados)
// Feature #23 — Barra de progresso de envio em tempo real para campanhas "sending"

import {
  IconSend,
  IconCheck,
  IconClock,
  IconAlertTriangle,
  IconRefresh,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { EmptyState, ErrorState } from "@/components/shared";
import { RequireRole } from "@/features/auth/components/require-role";
import { useEmailSendsWithPolling } from "@/features/marketing/hooks/use-email-studio";
import type { EmailSend } from "@/features/marketing/types/marketing";

const SEND_STATUS_MAP: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  queued: { label: "Na fila", color: "#6b7280", bg: "rgba(107,114,128,0.12)", icon: IconClock },
  sending: { label: "Enviando", color: "#3b82f6", bg: "rgba(59,130,246,0.12)", icon: IconSend },
  completed: { label: "Concluído", color: "#22c55e", bg: "rgba(34,197,94,0.12)", icon: IconCheck },
  failed: { label: "Falhou", color: "#ef4444", bg: "rgba(239,68,68,0.12)", icon: IconAlertTriangle },
};

function calcRate(num: number, denom: number): string {
  if (denom === 0) return "—";
  return `${((num / denom) * 100).toFixed(1)}%`;
}

// Feature #23 — barra de progresso embutida para envios "sending"
function SendProgressBar({ send }: { send: EmailSend }) {
  const progress =
    send.recipient_count > 0
      ? Math.min(100, Math.round((send.delivered / send.recipient_count) * 100))
      : 0;

  return (
    <tr className="bg-blue-50/40 dark:bg-blue-950/20">
      <td colSpan={7} className="px-4 pb-2 pt-0">
        <div className="flex items-center gap-3">
          <Progress value={progress} className="h-1.5 flex-1 max-w-sm" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {send.delivered.toLocaleString("pt-BR")} /{" "}
            {send.recipient_count.toLocaleString("pt-BR")} entregues ({progress}%)
          </span>
        </div>
      </td>
    </tr>
  );
}

function EnviosContent() {
  // Feature #23 — polling a cada 10s se houver envios "sending"
  const { data: sends, isLoading, error, refetch } = useEmailSendsWithPolling();

  const hasSending = (sends ?? []).some((s) => s.status === "sending");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Envios</h1>
          <p className="text-sm text-muted-foreground">
            Histórico de envios e status em tempo real.
          </p>
        </div>
        {/* Feature #23 — indicador de polling ativo */}
        {hasSending && (
          <div className="flex items-center gap-1.5 text-xs text-blue-500">
            <IconRefresh size={12} className="animate-spin" />
            Atualizando a cada 10s
          </div>
        )}
      </div>

      {error ? (
        <ErrorState message="Erro ao carregar envios." onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : !sends || sends.length === 0 ? (
        <EmptyState
          icon={IconSend}
          title="Nenhum envio registrado"
          description="Os envios aparecerão aqui quando você disparar campanhas de email."
        />
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Campanha</th>
                {/* Feature #22 — colunas de métricas completas */}
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Enviados</th>
                <th className="hidden px-4 py-3 text-right font-medium text-muted-foreground md:table-cell">Entregues</th>
                <th className="hidden px-4 py-3 text-right font-medium text-muted-foreground md:table-cell">Abertos</th>
                <th className="hidden px-4 py-3 text-right font-medium text-muted-foreground lg:table-cell">Clicados</th>
                <th className="hidden px-4 py-3 text-right font-medium text-muted-foreground lg:table-cell">Open Rate</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sends.map((send) => {
                const statusDef = SEND_STATUS_MAP[send.status];
                const StatusIcon = statusDef?.icon ?? IconSend;

                return (
                  <>
                    <tr key={send.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">
                        <div>{send.campaign_name}</div>
                        {send.sent_at && (
                          <div className="text-xs text-muted-foreground">
                            {new Date(send.sent_at).toLocaleDateString("pt-BR")}
                          </div>
                        )}
                      </td>
                      {/* Feature #22 — métricas: enviados, entregues, abertos, clicados, open rate */}
                      <td className="px-4 py-3 text-right">
                        {send.recipient_count.toLocaleString("pt-BR")}
                      </td>
                      <td className="hidden px-4 py-3 text-right md:table-cell">
                        {send.delivered.toLocaleString("pt-BR")}
                      </td>
                      <td className="hidden px-4 py-3 text-right md:table-cell">
                        {send.opened.toLocaleString("pt-BR")}
                      </td>
                      <td className="hidden px-4 py-3 text-right lg:table-cell">
                        {send.clicked.toLocaleString("pt-BR")}
                      </td>
                      <td className="hidden px-4 py-3 text-right lg:table-cell text-muted-foreground">
                        {calcRate(send.opened, send.delivered)}
                      </td>
                      <td className="px-4 py-3">
                        {statusDef ? (
                          <Badge
                            variant="secondary"
                            style={{ backgroundColor: statusDef.bg, color: statusDef.color }}
                            className="gap-1"
                          >
                            <StatusIcon size={10} />
                            {statusDef.label}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">{send.status}</span>
                        )}
                      </td>
                    </tr>
                    {/* Feature #23 — barra de progresso para campanhas em andamento */}
                    {send.status === "sending" && <SendProgressBar key={`${send.id}-bar`} send={send} />}
                  </>
                );
              })}
            </tbody>
          </table>
          <div className="border-t bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
            {sends.length} {sends.length === 1 ? "envio" : "envios"}
          </div>
        </div>
      )}
    </div>
  );
}

export default function EmailStudioEnviosPage() {
  return (
    <RequireRole module="marketing">
      <EnviosContent />
    </RequireRole>
  );
}
