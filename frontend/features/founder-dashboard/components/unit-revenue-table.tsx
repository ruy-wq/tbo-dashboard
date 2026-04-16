"use client";

import { IconInfoCircle } from "@tabler/icons-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { UnitRevenue } from "@/features/founder-dashboard/services/founder-dashboard";

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function fmtPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

const UNIT_COLORS = [
  "#10b981", // emerald
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#f59e0b", // amber
  "#ef4444", // red
  "#ec4899", // pink
  "#06b6d4", // cyan
];

// ── Chart data transform ─────────────────────────────────────────────────────

interface ChartRow {
  unit: string;
  receita: number;
  custos: number;
  margem: number;
  margemPct: number;
}

function toChartData(data: UnitRevenue[]): ChartRow[] {
  return data.map((row) => {
    const custos = row.receita - row.margem;
    const margemPct = row.receita > 0 ? (row.margem / row.receita) * 100 : 0;
    return {
      unit: row.unit,
      receita: row.receita,
      custos,
      margem: row.margem,
      margemPct,
    };
  });
}

// ── Custom Tooltip ───────────────────────────────────────────────────────────

function UnitTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartRow; dataKey: string; color: string }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md space-y-1">
      <p className="text-xs font-medium text-gray-900">{d.unit}</p>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
        <span className="text-xs text-gray-500">Receita:</span>
        <span className="text-xs font-semibold">{fmt(d.receita)}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-red-400 shrink-0" />
        <span className="text-xs text-gray-500">Custos:</span>
        <span className="text-xs font-semibold">{fmt(d.custos)}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
        <span className="text-xs text-gray-500">Margem:</span>
        <span
          className={`text-xs font-semibold ${
            d.margemPct < 30 ? "text-red-500" : "text-emerald-500"
          }`}
        >
          {fmt(d.margem)} ({fmtPct(d.margemPct)})
        </span>
      </div>
    </div>
  );
}

// ── Custom Legend ─────────────────────────────────────────────────────────────

function UnitLegend() {
  return (
    <div className="flex items-center justify-center gap-4 mt-1">
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
        <span className="text-xs text-gray-500">Receita</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm bg-red-400" />
        <span className="text-xs text-gray-500">Custos</span>
      </div>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

interface UnitRevenueTableProps {
  data: UnitRevenue[];
  isLoading?: boolean;
  onAdjustPeriod?: () => void;
}

export function UnitRevenueTable({ data, isLoading, onAdjustPeriod }: UnitRevenueTableProps) {
  const chartData = toChartData(data);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold">Receita por Unidade (MTD)</h2>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-5 w-5" aria-label="Informações do bloco">
              <IconInfoCircle className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" side="top" className="w-72 space-y-1">
            <p className="text-sm font-medium text-gray-900">Receita por Unidade de Negócio</p>
            <p className="text-xs text-gray-500">
              Receita e custos agrupados por centro de custo/unidade.
            </p>
            <p className="text-xs text-gray-500">
              Se um projeto cruzar unidades, a regra é a do centro de custo da
              transação no Omie.
            </p>
          </PopoverContent>
        </Popover>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {/* Chart skeleton */}
          <Skeleton className="h-52 w-full rounded-lg" />
          {/* Legend skeleton */}
          <div className="flex items-center justify-center gap-4">
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
          {/* Table rows skeleton */}
          <div className="space-y-1.5 pt-3 border-t border-gray-200">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-24 rounded" />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-16 rounded" />
                  <Skeleton className="h-4 w-10 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center py-6 gap-3">
          <p className="text-sm text-muted-foreground">
            Nenhum dado disponível no período.
          </p>
          <p className="text-xs text-muted-foreground/70">
            Ajuste o período ou aguarde a sincronização do OMIE
          </p>
          {onAdjustPeriod && (
            <Button variant="outline" size="sm" onClick={onAdjustPeriod}>
              Ajustar período
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Stacked Bar Chart — receita vs custos per unit */}
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
              >
                <XAxis
                  dataKey="unit"
                  tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={40}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => {
                    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
                    if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
                    return String(v);
                  }}
                  width={45}
                />
                <Tooltip
                  content={<UnitTooltip />}
                  cursor={{ fill: "var(--color-muted)", opacity: 0.3 }}
                />
                <Bar
                  dataKey="receita"
                  name="Receita"
                  fill="#10b981"
                  fillOpacity={0.8}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="custos"
                  name="Custos"
                  fill="#f87171"
                  fillOpacity={0.7}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <UnitLegend />

          {/* Summary table below */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="space-y-1.5">
              {chartData.map((row, i) => (
                <div key={row.unit} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-2.5 w-2.5 rounded-sm shrink-0"
                      style={{
                        backgroundColor:
                          UNIT_COLORS[i % UNIT_COLORS.length],
                      }}
                    />
                    <span className="text-xs text-gray-900 truncate">
                      {row.unit}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-gray-500">
                      {fmt(row.receita)}
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        row.margemPct < 30
                          ? "text-red-600 dark:text-red-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {fmtPct(row.margemPct)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
