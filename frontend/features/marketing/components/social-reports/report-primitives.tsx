"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconTrendingUp, IconTrendingDown } from "@tabler/icons-react";
import type { MetricWithDelta } from "../../data/thal-instagram-report";

// ── Delta Badge ──────────────────────────────────────────────────

export function DeltaBadge({ delta, label }: { delta: number; label?: string }) {
  if (label) {
    return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{label}</Badge>;
  }
  const isPositive = delta > 0;
  const isNeutral = delta === 0;
  const color = isPositive ? "text-emerald-600 bg-emerald-500/10" : isNeutral ? "text-muted-foreground bg-muted" : "text-red-500 bg-red-500/10";
  const Icon = isPositive ? IconTrendingUp : IconTrendingDown;

  return (
    <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 gap-0.5 ${color}`}>
      {!isNeutral && <Icon className="h-3 w-3" />}
      {isPositive ? "+" : ""}{delta.toFixed(delta % 1 === 0 ? 0 : 2)}%
    </Badge>
  );
}

// ── KPI Card ─────────────────────────────────────────────────────

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  metric?: MetricWithDelta;
  sub?: string;
  accent?: boolean;
  deltaLabel?: string;
}

export function ReportKpiCard({ icon, label, value, metric, sub, accent, deltaLabel }: KpiCardProps) {
  return (
    <Card className="transition-all hover:shadow-md hover:border-primary/20">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          {icon}
          <span className="text-[11px] uppercase tracking-wider">{label}</span>
        </div>
        <div className={`text-2xl font-semibold tracking-tight ${accent ? "text-blue-500" : ""}`}>
          {value}
        </div>
        {metric && (
          <div className="flex items-center gap-2 mt-2">
            <DeltaBadge delta={metric.delta} label={deltaLabel} />
            <span className="text-[10px] text-muted-foreground">
              vs. {metric.previous.toLocaleString("pt-BR")}
            </span>
          </div>
        )}
        {sub && <p className="text-[11px] text-muted-foreground mt-1.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ── Section Header ───────────────────────────────────────────────

export function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex items-center justify-center rounded bg-[#E85102] px-2 py-0.5 text-xs font-bold text-white tracking-wider">
        {number}
      </span>
      <h2 className="text-lg font-bold tracking-tight">{title}</h2>
    </div>
  );
}

// ── Insight Callout ──────────────────────────────────────────────

export function InsightCallout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border-l-4 border-[#E85102] bg-orange-50 dark:bg-orange-950/20 p-4">
      <p className="text-sm font-semibold text-[#E85102] mb-1">{title}</p>
      <p className="text-sm text-muted-foreground leading-relaxed">{children}</p>
    </div>
  );
}

// ── Mini KPI ─────────────────────────────────────────────────────

export function MiniKpi({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3 text-center transition-colors hover:bg-muted/80 cursor-default">
      <div className={`text-lg font-semibold ${className ?? ""}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

// ── Metric Table ─────────────────────────────────────────────────

interface TableColumn {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  format?: (val: unknown) => string;
  className?: string;
  hideOnMobile?: boolean;
}

interface MetricTableProps {
  title: string;
  icon: React.ReactNode;
  columns: TableColumn[];
  rows: Record<string, unknown>[];
  highlightKey?: string;
}

export function MetricTable({ title, icon, columns, rows, highlightKey }: MetricTableProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-3 py-2.5 font-medium text-muted-foreground text-${col.align ?? "left"} ${col.hideOnMobile ? "hidden md:table-cell" : ""}`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row, i) => {
                const isHighlighted = highlightKey && row[highlightKey] === Math.max(...rows.map((r) => Number(r[highlightKey])));
                return (
                  <tr key={i} className={`hover:bg-muted/30 transition-colors ${isHighlighted ? "bg-orange-50/50 dark:bg-orange-950/10" : ""}`}>
                    {columns.map((col) => {
                      const val = row[col.key];
                      const formatted = col.format ? col.format(val) : String(val ?? "—");
                      return (
                        <td
                          key={col.key}
                          className={`px-3 py-2.5 text-${col.align ?? "left"} ${col.className ?? ""} ${col.hideOnMobile ? "hidden md:table-cell" : ""}`}
                        >
                          {formatted}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Reach Bar ────────────────────────────────────────────────────

export function ReachBar({ paid, organic }: { paid: number; organic: number }) {
  const total = paid + organic;
  if (total === 0) return null;
  const paidPct = ((paid / total) * 100).toFixed(1);
  const orgPct = ((organic / total) * 100).toFixed(1);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Alcance · últimos 30 dias</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-3">
          <MiniKpi label="Total" value={total.toLocaleString("pt-BR")} />
          <MiniKpi label="Pago" value={paid.toLocaleString("pt-BR")} className="text-orange-500" />
          <MiniKpi label="Orgânico" value={organic.toLocaleString("pt-BR")} className="text-blue-500" />
          <MiniKpi label="% Orgânico" value={`${orgPct}%`} />
        </div>
        <div className="flex h-10 overflow-hidden rounded-lg">
          <div
            className="flex items-center justify-center bg-orange-500 hover:bg-orange-400 text-xs font-semibold text-white transition-colors cursor-default"
            style={{ flex: Number(paidPct) }}
          >
            Pago {paidPct}%
          </div>
          <div
            className="flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-xs text-white transition-colors cursor-default"
            style={{ flex: Number(orgPct) }}
          >
            {Number(orgPct) > 3 ? `Org. ${orgPct}%` : ""}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
