"use client";

import { useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth-store";
import { RequireRole } from "@/features/auth/components/require-role";
import { useLaunches } from "@/features/lancamentos/hooks/use-launches";
import { LaunchCard } from "@/features/lancamentos/components/launch-card";
import { LaunchFormDialog } from "@/features/lancamentos/components/launch-form-dialog";
import { LAUNCH_STATUS_LABELS, LAUNCH_STATUS_COLORS } from "@/features/lancamentos/lib/constants";
import { ErrorState } from "@/components/shared";
import {
  IconPlus,
  IconSearch,
  IconRocket,
  IconBuildingSkyscraper,
  IconChartBar,
  IconTarget,
} from "@tabler/icons-react";

/* ─── TBO Design Tokens ───────────────────────────────────────────── */

const T = {
  text: "#0f0f0f",
  muted: "#4a4a4a",
  glass: "rgba(255,255,255,0.65)",
  glassBorder: "rgba(255,255,255,0.45)",
  glassShadow: "0 8px 32px rgba(15,15,15,0.06), 0 1px 3px rgba(15,15,15,0.04)",
  glassBlur: "blur(16px) saturate(180%)",
  r: "16px",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/* ─── Skeleton ────────────────────────────────────────────────────── */

function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-52 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/* ─── Status Filter ───────────────────────────────────────────────── */

const STATUS_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "planning", label: "Planejamento" },
  { value: "active", label: "Ativos" },
  { value: "paused", label: "Pausados" },
  { value: "completed", label: "Concluídos" },
];

/* ─── Page ────────────────────────────────────────────────────────── */

export default function LancamentosPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const { data: launches = [], isLoading, error, refetch } = useLaunches({
    status: statusFilter || undefined,
    search: search || undefined,
  });

  // KPIs
  const kpis = useMemo(() => {
    const total = launches.length;
    const active = launches.filter((l) => l.status === "active").length;
    const totalVgv = launches.reduce((s, l) => s + (l.target_vgv ?? 0), 0);
    const avgConversion =
      total > 0
        ? launches.reduce((s, l) => s + (l.conversion_rate ?? 0), 0) / total
        : 0;
    return { total, active, totalVgv, avgConversion };
  }, [launches]);

  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorState message="Erro ao carregar lançamentos" onRetry={() => refetch()} />;

  return (
    <RequireRole minRole="lider">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <IconRocket className="size-6" />
              Lançamentos
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Sistema operacional para lançamentos imobiliários
            </p>
          </div>
          <Button onClick={() => setFormOpen(true)} className="gap-2">
            <IconPlus className="size-4" />
            Novo Lançamento
          </Button>
        </div>

        {/* KPI Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            className="rounded-xl p-4"
            style={{
              background: T.glass,
              backdropFilter: T.glassBlur,
              border: `1px solid ${T.glassBorder}`,
              borderRadius: T.r,
              boxShadow: T.glassShadow,
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <IconBuildingSkyscraper className="size-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
            <p className="text-2xl font-bold">{kpis.total}</p>
          </div>
          <div
            className="rounded-xl p-4"
            style={{
              background: T.glass,
              backdropFilter: T.glassBlur,
              border: `1px solid ${T.glassBorder}`,
              borderRadius: T.r,
              boxShadow: T.glassShadow,
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <IconRocket className="size-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Ativos</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{kpis.active}</p>
          </div>
          <div
            className="rounded-xl p-4"
            style={{
              background: T.glass,
              backdropFilter: T.glassBlur,
              border: `1px solid ${T.glassBorder}`,
              borderRadius: T.r,
              boxShadow: T.glassShadow,
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <IconChartBar className="size-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">VGV Total</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(kpis.totalVgv)}</p>
          </div>
          <div
            className="rounded-xl p-4"
            style={{
              background: T.glass,
              backdropFilter: T.glassBlur,
              border: `1px solid ${T.glassBorder}`,
              borderRadius: T.r,
              boxShadow: T.glassShadow,
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <IconTarget className="size-4 text-purple-500" />
              <span className="text-xs text-muted-foreground">Conversão Média</span>
            </div>
            <p className="text-2xl font-bold">{kpis.avgConversion.toFixed(1)}%</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar lançamento..."
              className="pl-9"
            />
          </div>
          <div className="flex gap-1">
            {STATUS_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                size="sm"
                variant={statusFilter === opt.value ? "default" : "outline"}
                onClick={() => setStatusFilter(opt.value)}
                className="text-xs"
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Launch Grid */}
        {launches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <IconRocket className="size-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-1">Nenhum lançamento encontrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Crie seu primeiro lançamento para começar a estruturar suas vendas
            </p>
            <Button onClick={() => setFormOpen(true)} className="gap-2">
              <IconPlus className="size-4" />
              Criar Lançamento
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {launches.map((launch) => (
              <LaunchCard key={launch.id} launch={launch} />
            ))}
          </div>
        )}

        <LaunchFormDialog open={formOpen} onOpenChange={setFormOpen} />
      </div>
    </RequireRole>
  );
}
