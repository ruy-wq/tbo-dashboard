"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { IconChartBar } from "@tabler/icons-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { RevenueConcentrationData, ClientConcentration } from "@/features/financeiro/services";

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);
}

function alertColor(level: ClientConcentration["alertLevel"]): string {
  if (level === "critico") return "#ef4444"; // red-500
  if (level === "alta") return "#f59e0b";    // amber-500
  return "#8b5cf6";                          // violet-500 (normal)
}

// ── Custom tooltip ────────────────────────────────────────────────────────────

function ConcentrationTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ClientConcentration }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md space-y-1">
      <p className="text-xs font-semibold text-foreground truncate max-w-[200px]">{d.client}</p>
      <div className="flex gap-3 text-xs">
        <span className="text-muted-foreground">Receita:</span>
        <span className="font-medium">{fmt(d.revenue)}</span>
      </div>
      <div className="flex gap-3 text-xs">
        <span className="text-muted-foreground">Participação:</span>
        <span
          className={
            d.alertLevel === "critico"
              ? "text-red-500 font-semibold"
              : d.alertLevel === "alta"
                ? "text-amber-500 font-semibold"
                : "font-medium"
          }
        >
          {d.pct.toFixed(1)}%
        </span>
      </div>
      <div className="flex gap-3 text-xs">
        <span className="text-muted-foreground">Transações:</span>
        <span className="font-medium">{d.txCount}</span>
      </div>
    </div>
  );
}

// ── Alert badge ───────────────────────────────────────────────────────────────

function AlertBadge({ level }: { level: ClientConcentration["alertLevel"] }) {
  if (level === "normal") return null;
  return (
    <span
      className={
        level === "critico"
          ? "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
          : "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
      }
    >
      {level === "critico" ? "Risco crítico" : "Alta concentração"}
    </span>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-48 w-full rounded-lg" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex justify-between">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface RevenueConcentrationChartProps {
  data?: RevenueConcentrationData;
  isLoading?: boolean;
  /** How many top clients to show in bar chart (rest collapsed to legend) */
  topN?: number;
  className?: string;
}

export function RevenueConcentrationChart({
  data,
  isLoading = false,
  topN = 5,
  className = "",
}: RevenueConcentrationChartProps) {
  if (isLoading) return <LoadingSkeleton />;

  const isEmpty = !data || data.clients.length === 0;

  const chartData = data?.clients.slice(0, topN) ?? [];

  return (
    <div className={`rounded-lg border border-border bg-card p-4 space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Concentração de Receita — Top Clientes
          </h3>
          {!isEmpty && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Top 5 clientes representam{" "}
              <span className="font-medium text-foreground">
                {data!.top5Pct.toFixed(1)}%
              </span>{" "}
              da receita total
            </p>
          )}
        </div>
        {!isEmpty && chartData.some((c) => c.alertLevel !== "normal") && (
          <AlertBadge level={chartData.find((c) => c.alertLevel === "critico") ? "critico" : "alta"} />
        )}
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <IconChartBar className="size-8 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">Nenhuma receita paga registrada no período</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Ajuste o período ou aguarde o próximo ciclo de sincronização</p>
        </div>
      ) : (
        <>
          {/* Horizontal bar chart */}
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis
                  type="number"
                  tickFormatter={(v: number) => `${v.toFixed(0)}%`}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  domain={[0, 100]}
                />
                <YAxis
                  type="category"
                  dataKey="client"
                  width={100}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v: string) => v.length > 14 ? v.slice(0, 12) + "…" : v}
                />
                <Tooltip content={<ConcentrationTooltip />} />
                <Bar dataKey="pct" radius={[0, 4, 4, 0]} maxBarSize={22}>
                  {chartData.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={alertColor(entry.alertLevel)} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Client list with alert badges */}
          <div className="space-y-1.5 border-t border-border pt-3">
            {chartData.map((c, i) => (
              <div key={c.client} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-2.5 w-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: alertColor(c.alertLevel) }}
                  />
                  <span className="text-xs text-foreground truncate" title={c.client}>
                    {i + 1}. {c.client}
                  </span>
                  <AlertBadge level={c.alertLevel} />
                </div>
                <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                  {fmt(c.revenue)} · {c.pct.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <p className="text-xs text-muted-foreground">
            {data!.totalClients} cliente{data!.totalClients !== 1 ? "s" : ""} com receita paga no
            período · Total: {fmt(data!.totalRevenue)}
          </p>
        </>
      )}
    </div>
  );
}
