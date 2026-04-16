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
import type { ProjectMargin } from "@/features/founder-dashboard/services/founder-dashboard";

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

// ── Custom Tooltip ───────────────────────────────────────────────────────────

function ProjectTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ProjectMargin }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const isLow = d.margemPct < 30;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md space-y-1">
      <p className="text-xs font-medium text-gray-900 truncate max-w-[200px]">
        {d.project}
      </p>
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
          className={`text-xs font-bold ${
            isLow ? "text-red-500" : "text-emerald-500"
          }`}
        >
          {fmtPct(d.margemPct)}
        </span>
      </div>
    </div>
  );
}

// ── Custom Legend ─────────────────────────────────────────────────────────────

function ProjectLegend() {
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

interface TopProjectsTableProps {
  data: ProjectMargin[];
  isLoading?: boolean;
  onAdjustPeriod?: () => void;
}

export function TopProjectsTable({ data, isLoading, onAdjustPeriod }: TopProjectsTableProps) {
  // Truncate long project names for chart display
  const chartData = data.map((row) => ({
    ...row,
    shortName:
      row.project.length > 18
        ? row.project.slice(0, 16) + "…"
        : row.project,
  }));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold">Top Projetos por Margem</h2>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-5 w-5" aria-label="Informações do bloco">
              <IconInfoCircle className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" side="top" className="w-72 space-y-1">
            <p className="text-sm font-medium text-gray-900">Top Projetos por Margem</p>
            <p className="text-xs text-gray-500">
              Considera somente transações com projeto definido (tag/campo).
            </p>
            <p className="text-xs text-gray-500">
              Se não houver &quot;projeto&quot; no Omie, o estado vazio será
              exibido.
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
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-28 rounded" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-16 rounded" />
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
            Nenhum projeto com transações no período.
          </p>
          <p className="text-xs text-muted-foreground/70">
            Ajuste o período ou vincule transações a projetos no OMIE
          </p>
          {onAdjustPeriod && (
            <Button variant="outline" size="sm" onClick={onAdjustPeriod}>
              Ajustar período
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Grouped Bar Chart — receita vs custos */}
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
              >
                <XAxis
                  dataKey="shortName"
                  tick={{ fontSize: 9, fill: "var(--color-muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={45}
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
                  content={<ProjectTooltip />}
                  cursor={{ fill: "var(--color-muted)", opacity: 0.3 }}
                />
                <Bar
                  dataKey="receita"
                  name="Receita"
                  fill="#10b981"
                  fillOpacity={0.8}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="custos"
                  name="Custos"
                  fill="#f87171"
                  fillOpacity={0.7}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ProjectLegend />

          {/* Summary rows below chart */}
          <div className="mt-3 pt-3 border-t border-gray-200 space-y-1.5">
            {data.map((row) => {
              const isLow = row.margemPct < 30;
              return (
                <div
                  key={row.project}
                  className={`flex items-center justify-between gap-2 px-1.5 py-1 rounded ${
                    isLow ? "bg-red-500/5" : ""
                  }`}
                >
                  <span
                    className="text-xs text-gray-900 truncate max-w-[45%]"
                    title={row.project}
                  >
                    {row.project}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-500">
                      {fmt(row.receita)}
                    </span>
                    <span className="text-xs text-red-500 dark:text-red-400">
                      {fmt(row.custos)}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        isLow
                          ? "text-red-600 dark:text-red-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {fmtPct(row.margemPct)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
