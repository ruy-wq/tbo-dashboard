"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUpdateKPI } from "../hooks/use-launches";
import { KPI_CATEGORY_LABELS, PHASE_DEFINITIONS } from "../lib/constants";
import type { LaunchWithPhases, LaunchKPI } from "../services/launches";
import {
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
  IconAlertTriangle,
  IconEdit,
  IconCheck,
  IconTarget,
  IconChartBar,
  IconActivity,
  IconUsers,
} from "@tabler/icons-react";

interface IndicatorsPanelProps {
  launch: LaunchWithPhases;
}

const TREND_ICON: Record<string, React.ElementType> = {
  up: IconTrendingUp,
  down: IconTrendingDown,
  stable: IconMinus,
};

const TREND_COLOR: Record<string, string> = {
  up: "#22c55e",
  down: "#ef4444",
  stable: "#94a3b8",
};

const CATEGORY_ICON: Record<string, React.ElementType> = {
  conversion: IconTarget,
  financial: IconChartBar,
  operational: IconActivity,
  engagement: IconUsers,
};

function formatValue(value: number, unit: string): string {
  if (unit === "R$") {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
  if (unit === "%") return `${value.toFixed(1)}%`;
  return `${value.toLocaleString("pt-BR")} ${unit}`.trim();
}

function KPICard({ kpi, launchId }: { kpi: LaunchKPI; launchId: string }) {
  const [editing, setEditing] = useState(false);
  const [currentDraft, setCurrentDraft] = useState(String(kpi.current_value));
  const [targetDraft, setTargetDraft] = useState(String(kpi.target_value ?? ""));
  const updateKPI = useUpdateKPI(launchId);

  const TrendIcon = TREND_ICON[kpi.trend] ?? IconMinus;
  const trendColor = TREND_COLOR[kpi.trend] ?? "#94a3b8";
  const CatIcon = CATEGORY_ICON[kpi.category] ?? IconChartBar;
  const progress =
    kpi.target_value && kpi.target_value > 0
      ? Math.min(100, (kpi.current_value / kpi.target_value) * 100)
      : 0;

  function handleSave() {
    updateKPI.mutate({
      kpiId: kpi.id,
      updates: {
        current_value: Number(currentDraft) || 0,
        target_value: targetDraft ? Number(targetDraft) : null,
      },
    });
    setEditing(false);
  }

  return (
    <div className="rounded-lg border p-4 space-y-3 group">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md flex items-center justify-center bg-primary/10">
            <CatIcon className="size-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">{kpi.name}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {KPI_CATEGORY_LABELS[kpi.category] ?? kpi.category}
              {kpi.phase_number != null &&
                ` · Fase ${kpi.phase_number} — ${PHASE_DEFINITIONS[kpi.phase_number - 1]?.name ?? ""}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {kpi.is_alert && (
            <IconAlertTriangle className="size-4 text-amber-500" />
          )}
          <TrendIcon className="size-4" style={{ color: trendColor }} />
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => {
              if (editing) handleSave();
              else {
                setCurrentDraft(String(kpi.current_value));
                setTargetDraft(String(kpi.target_value ?? ""));
                setEditing(true);
              }
            }}
          >
            {editing ? <IconCheck className="size-3.5" /> : <IconEdit className="size-3.5" />}
          </Button>
        </div>
      </div>

      {editing ? (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-muted-foreground">Atual</label>
            <Input
              value={currentDraft}
              onChange={(e) => setCurrentDraft(e.target.value)}
              className="text-sm h-8"
              type="number"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") setEditing(false);
              }}
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground">Meta</label>
            <Input
              value={targetDraft}
              onChange={(e) => setTargetDraft(e.target.value)}
              className="text-sm h-8"
              type="number"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") setEditing(false);
              }}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums">
              {formatValue(kpi.current_value, kpi.unit)}
            </span>
            {kpi.target_value != null && kpi.target_value > 0 && (
              <span className="text-sm text-muted-foreground">
                / {formatValue(kpi.target_value, kpi.unit)}
              </span>
            )}
          </div>

          {kpi.target_value != null && kpi.target_value > 0 && (
            <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  background:
                    progress >= 100
                      ? "#22c55e"
                      : progress >= 70
                        ? "#6366f1"
                        : progress >= 40
                          ? "#f59e0b"
                          : "#ef4444",
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function IndicatorsPanel({ launch }: IndicatorsPanelProps) {
  const kpis = launch.launch_kpis;
  const categories = [...new Set(kpis.map((k) => k.category))];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Conversão</p>
          <p className="text-2xl font-bold mt-1">{launch.conversion_rate.toFixed(1)}%</p>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">CAC</p>
          <p className="text-2xl font-bold mt-1">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
              minimumFractionDigits: 0,
            }).format(launch.cac)}
          </p>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Progresso</p>
          <p className="text-2xl font-bold mt-1">{launch.overall_progress.toFixed(0)}%</p>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Fase Atual</p>
          <p className="text-2xl font-bold mt-1">{launch.current_phase}/7</p>
        </div>
      </div>

      {/* KPI Cards by category */}
      {categories.map((cat) => (
        <div key={cat}>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            {KPI_CATEGORY_LABELS[cat] ?? cat}
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {kpis
              .filter((k) => k.category === cat)
              .map((kpi) => (
                <KPICard key={kpi.id} kpi={kpi} launchId={launch.id} />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
