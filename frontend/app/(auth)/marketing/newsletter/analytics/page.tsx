"use client";

// Feature #24 — KPI cards (open rate, click rate, bounce rate, unsubscribe rate) com benchmarks
// Feature #25 — Gráfico de barras de performance por campanha (top 5 por open rate)

import {
  IconChartBar,
  IconMail,
  IconEye,
  IconClick,
  IconAlertTriangle,
  IconUserMinus,
  IconArrowUp,
  IconArrowDown,
  IconMinus,
} from "@tabler/icons-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/shared";
import { RequireRole } from "@/features/auth/components/require-role";
import { useEmailAnalytics } from "@/features/marketing/hooks/use-email-studio";
import type { EmailAnalytics } from "@/features/marketing/types/marketing";

// Feature #24 — benchmarks de mercado para referência
const BENCHMARKS = {
  openRate: 21.5,     // % — média de mercado email marketing
  clickRate: 2.3,     // % — sobre abertos
  bounceRate: 0.8,    // % — taxa de bounce aceitável
  unsubscribeRate: 0.2, // % — taxa de descadastro aceitável
};

type BenchmarkStatus = "above" | "below" | "neutral";

function getBenchmarkStatus(
  value: number,
  benchmark: number,
  higherIsBetter: boolean,
): BenchmarkStatus {
  const diff = Math.abs(value - benchmark);
  if (diff < benchmark * 0.1) return "neutral"; // dentro de 10% = neutro
  return (value > benchmark) === higherIsBetter ? "above" : "below";
}

// Feature #24 — KPI card com benchmark indicator
function KPICard({
  label,
  value,
  icon: Icon,
  color,
  benchmark,
  benchmarkLabel,
  higherIsBetter = true,
  isLoading,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  benchmark: number;
  benchmarkLabel: string;
  higherIsBetter?: boolean;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-4 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-3 w-28" />
      </div>
    );
  }

  const status = getBenchmarkStatus(value, benchmark, higherIsBetter);
  const diff = value - benchmark;

  const StatusIcon =
    status === "above" ? IconArrowUp : status === "below" ? IconArrowDown : IconMinus;
  const statusColor =
    status === "above"
      ? higherIsBetter
        ? "text-emerald-500"
        : "text-red-500"
      : status === "below"
        ? higherIsBetter
          ? "text-red-500"
          : "text-emerald-500"
        : "text-muted-foreground";

  return (
    <div className="rounded-lg border bg-card p-4 space-y-1">
      <div className="flex items-center gap-2">
        <Icon className="size-4" style={{ color }} />
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="text-2xl font-bold">{value.toFixed(1)}%</p>
      {/* Feature #24 — indicador de benchmark */}
      <div className={`flex items-center gap-1 text-xs ${statusColor}`}>
        <StatusIcon size={10} />
        <span>
          {diff > 0 ? "+" : ""}
          {diff.toFixed(1)}% vs {benchmarkLabel} ({benchmark}%)
        </span>
      </div>
    </div>
  );
}

// Feature #24 — KPI simples sem benchmark (totais absolutos)
function TotalCard({
  label,
  value,
  icon: Icon,
  color,
  isLoading,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-4 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-16" />
      </div>
    );
  }
  return (
    <div className="rounded-lg border bg-card p-4 space-y-1">
      <div className="flex items-center gap-2">
        <Icon className="size-4" style={{ color }} />
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

// Feature #25 — top 5 por open rate para o gráfico
function getTop5ByOpenRate(analytics: EmailAnalytics[]) {
  return [...analytics]
    .sort((a, b) => b.open_rate - a.open_rate)
    .slice(0, 5)
    .map((a) => ({
      name: a.campaign_name.length > 18 ? `${a.campaign_name.slice(0, 18)}…` : a.campaign_name,
      "Open Rate": parseFloat(a.open_rate.toFixed(1)),
      "Click Rate": parseFloat(a.click_rate.toFixed(1)),
      Benchmark: BENCHMARKS.openRate,
    }));
}

function EmailAnalyticsContent() {
  const { data: analytics, isLoading, error, refetch } = useEmailAnalytics();

  const totals = (analytics ?? []).reduce(
    (acc, a) => ({
      sent: acc.sent + a.total_sent,
      delivered: acc.delivered + a.total_delivered,
      opened: acc.opened + a.total_opened,
      clicked: acc.clicked + a.total_clicked,
      bounced: acc.bounced + a.total_bounced,
      unsubscribed: acc.unsubscribed + a.total_unsubscribed,
    }),
    { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0 },
  );

  // Feature #24 — taxas calculadas
  const avgOpenRate = totals.delivered > 0 ? (totals.opened / totals.delivered) * 100 : 0;
  const avgClickRate = totals.opened > 0 ? (totals.clicked / totals.opened) * 100 : 0;
  const avgBounceRate = totals.sent > 0 ? (totals.bounced / totals.sent) * 100 : 0;
  const avgUnsubRate = totals.delivered > 0 ? (totals.unsubscribed / totals.delivered) * 100 : 0;

  // Feature #25 — top 5 para o gráfico
  const top5 = analytics ? getTop5ByOpenRate(analytics) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics de Email</h1>
        <p className="text-sm text-muted-foreground">
          Métricas consolidadas de todas as campanhas de email.
        </p>
      </div>

      {error ? (
        <ErrorState message="Erro ao carregar analytics." onRetry={() => refetch()} />
      ) : (
        <>
          {/* Feature #24 — totais absolutos */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <TotalCard
              label="Emails enviados"
              value={totals.sent.toLocaleString("pt-BR")}
              icon={IconMail}
              color="#3b82f6"
              isLoading={isLoading}
            />
            <TotalCard
              label="Entregues"
              value={totals.delivered.toLocaleString("pt-BR")}
              icon={IconMail}
              color="#22c55e"
              isLoading={isLoading}
            />
            <TotalCard
              label="Abertos"
              value={totals.opened.toLocaleString("pt-BR")}
              icon={IconEye}
              color="#f59e0b"
              isLoading={isLoading}
            />
            <TotalCard
              label="Clicados"
              value={totals.clicked.toLocaleString("pt-BR")}
              icon={IconClick}
              color="#8b5cf6"
              isLoading={isLoading}
            />
          </div>

          {/* Feature #24 — KPI cards com benchmarks */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <KPICard
              label="Open Rate"
              value={avgOpenRate}
              icon={IconEye}
              color="#f59e0b"
              benchmark={BENCHMARKS.openRate}
              benchmarkLabel="mercado"
              higherIsBetter={true}
              isLoading={isLoading}
            />
            <KPICard
              label="Click Rate"
              value={avgClickRate}
              icon={IconClick}
              color="#8b5cf6"
              benchmark={BENCHMARKS.clickRate}
              benchmarkLabel="mercado"
              higherIsBetter={true}
              isLoading={isLoading}
            />
            <KPICard
              label="Bounce Rate"
              value={avgBounceRate}
              icon={IconAlertTriangle}
              color="#ef4444"
              benchmark={BENCHMARKS.bounceRate}
              benchmarkLabel="ideal"
              higherIsBetter={false}
              isLoading={isLoading}
            />
            <KPICard
              label="Unsubscribe Rate"
              value={avgUnsubRate}
              icon={IconUserMinus}
              color="#6b7280"
              benchmark={BENCHMARKS.unsubscribeRate}
              benchmarkLabel="ideal"
              higherIsBetter={false}
              isLoading={isLoading}
            />
          </div>

          {!isLoading && analytics && analytics.length > 0 ? (
            <>
              {/* Feature #25 — gráfico de barras top 5 por open rate */}
              {top5.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">
                      Top 5 Campanhas por Open Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={top5} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11 }}
                          className="fill-muted-foreground"
                        />
                        <YAxis
                          tick={{ fontSize: 11 }}
                          unit="%"
                          className="fill-muted-foreground"
                        />
                        <Tooltip
                          formatter={(value: number | undefined, name: string | undefined) => [
                            value !== undefined ? `${value}%` : "—",
                            name ?? "",
                          ]}
                          contentStyle={{ fontSize: 12 }}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="Open Rate" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="Click Rate" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                        {/* Feature #24 — linha de benchmark de mercado como barra de referência */}
                        <Bar
                          dataKey="Benchmark"
                          fill="rgba(107,114,128,0.25)"
                          radius={[3, 3, 0, 0]}
                          name="Benchmark mercado"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Tabela detalhada por campanha */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">
                    Performance por Campanha
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Campanha</th>
                          <th className="px-4 py-3 text-right font-medium text-muted-foreground">Enviados</th>
                          <th className="hidden px-4 py-3 text-right font-medium text-muted-foreground md:table-cell">Abertos</th>
                          <th className="px-4 py-3 text-right font-medium text-muted-foreground">Open Rate</th>
                          <th className="hidden px-4 py-3 text-right font-medium text-muted-foreground lg:table-cell">Click Rate</th>
                          <th className="hidden px-4 py-3 text-right font-medium text-muted-foreground lg:table-cell">Bounce</th>
                          <th className="hidden px-4 py-3 text-right font-medium text-muted-foreground lg:table-cell">Unsub.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {analytics.map((a) => (
                          <tr key={a.campaign_id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 font-medium">{a.campaign_name}</td>
                            <td className="px-4 py-3 text-right">{a.total_sent.toLocaleString("pt-BR")}</td>
                            <td className="hidden px-4 py-3 text-right md:table-cell">{a.total_opened.toLocaleString("pt-BR")}</td>
                            <td className="px-4 py-3 text-right">{a.open_rate.toFixed(1)}%</td>
                            <td className="hidden px-4 py-3 text-right lg:table-cell">{a.click_rate.toFixed(1)}%</td>
                            <td className="hidden px-4 py-3 text-right lg:table-cell text-red-500/80">{a.bounce_rate.toFixed(1)}%</td>
                            <td className="hidden px-4 py-3 text-right lg:table-cell text-muted-foreground">{a.unsubscribe_rate.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : !isLoading ? (
            <EmptyState
              icon={IconChartBar}
              title="Sem dados de analytics"
              description="Envie sua primeira campanha para ver métricas aqui."
            />
          ) : null}
        </>
      )}
    </div>
  );
}

export default function EmailStudioAnalyticsPage() {
  return (
    <RequireRole module="marketing">
      <EmailAnalyticsContent />
    </RequireRole>
  );
}
