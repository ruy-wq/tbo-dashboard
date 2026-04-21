"use client";

import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { RBACGuard } from "@/components/rbac-guard";
import { useFounderDashboard } from "@/features/founder-dashboard/hooks/use-founder-dashboard";
import { usePersistedPeriod } from "@/hooks/use-persisted-period";
import { OmieSyncButton } from "@/features/financeiro/components/omie-sync-button";
import { fmt, fmtMonths, fmtPct } from "@/features/financeiro/lib/formatters";
import {
  IconArrowRight,
  IconAlertTriangle,
  IconCalendarStats,
  IconCash,
  IconChartBar,
  IconCurrencyDollar,
  IconFileCheck,
  IconGitCompare,
  IconReceiptRefund,
  IconReportMoney,
  IconTable,
} from "@tabler/icons-react";
import type { FounderDashboardSnapshot } from "@/features/founder-dashboard/services/founder-dashboard";

const T = {
  text: "#0f0f0f",
  muted: "#4a4a4a",
  orange: "#c45a1a",
  orangeGlow: "rgba(196,90,26,0.10)",
  glass: "rgba(255,255,255,0.65)",
  glassBorder: "rgba(255,255,255,0.45)",
  glassShadow: "0 8px 32px rgba(15,15,15,0.06), 0 1px 3px rgba(15,15,15,0.04)",
  glassBlur: "blur(16px) saturate(180%)",
  r: "16px",
  rSm: "10px",
};

type ModuleDef = { href: string; label: string; description: string; icon: React.ElementType; color: string };

const MODULES: ModuleDef[] = [
  { href: "/financeiro/dre", label: "DRE", description: "Demonstração de resultado do exercício", icon: IconReportMoney, color: "#22c55e" },
  { href: "/financeiro/fluxo-caixa", label: "Fluxo de Caixa", description: "Entradas, saídas e projeções", icon: IconCash, color: "#3b82f6" },
  { href: "/financeiro/transacoes", label: "Transações", description: "Contas a pagar e receber detalhadas", icon: IconCurrencyDollar, color: "#f59e0b" },
  { href: "/financeiro/contas", label: "Contas", description: "Gestão de contas bancárias", icon: IconTable, color: "#8b5cf6" },
  { href: "/financeiro/conciliacao", label: "Conciliação", description: "Reconciliação bancária automatizada", icon: IconGitCompare, color: "#14b8a6" },
  { href: "/financeiro/recorrentes", label: "Recorrentes", description: "Receitas e despesas recorrentes", icon: IconReceiptRefund, color: "#6366f1" },
  { href: "/financeiro/fiscal", label: "Fiscal", description: "Notas fiscais e obrigações", icon: IconFileCheck, color: "#f97316" },
  { href: "/financeiro/operacional", label: "Operacional", description: "Headcount, folha e custo operacional", icon: IconCalendarStats, color: "#0ea5e9" },
  { href: "/financeiro/performance", label: "Performance", description: "Indicadores financeiros e benchmarks", icon: IconChartBar, color: "#10b981" },
];

function KpiBlock({
  label,
  value,
  accent,
  isLoading,
}: {
  label: string;
  value: string;
  accent?: "positive" | "negative" | "neutral";
  isLoading: boolean;
}) {
  const valueColor =
    accent === "positive"
      ? "text-emerald-300"
      : accent === "negative"
        ? "text-red-300"
        : "text-white";
  return (
    <div className="text-right min-w-0">
      {isLoading ? (
        <Skeleton className="h-5 w-20 bg-white/10 rounded ml-auto" />
      ) : (
        <span className={`text-base md:text-lg font-bold tabular-nums ${valueColor}`}>
          {value}
        </span>
      )}
      <span className="block text-[10px] uppercase tracking-wider text-white/40">
        {label}
      </span>
    </div>
  );
}

function HeaderKpis({
  d,
  isLoading,
}: {
  d: FounderDashboardSnapshot | undefined;
  isLoading: boolean;
}) {
  const margemAccent: "positive" | "negative" | "neutral" =
    !d ? "neutral" : d.margemPct >= 15 ? "positive" : d.margemPct < 0 ? "negative" : "neutral";
  const runwayAccent: "positive" | "negative" | "neutral" =
    !d ? "neutral" : d.runway >= 6 ? "positive" : d.runway < 3 ? "negative" : "neutral";
  const criticalAlerts = d?.alerts?.filter((a) => a.value < a.threshold).length ?? 0;

  return (
    <div className="flex items-center gap-4 md:gap-6 flex-wrap justify-end">
      <KpiBlock
        label="receita"
        value={d ? fmt(d.receitaRealizada) : "—"}
        isLoading={isLoading}
      />
      <KpiBlock
        label="margem"
        value={d ? `${fmtPct(d.margemPct)}` : "—"}
        accent={margemAccent}
        isLoading={isLoading}
      />
      <KpiBlock
        label="runway"
        value={d ? fmtMonths(d.runway) : "—"}
        accent={runwayAccent}
        isLoading={isLoading}
      />
      {!isLoading && criticalAlerts > 0 && (
        <Link
          href="/diretoria"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-400/30 hover:bg-amber-500/25 transition-colors"
          aria-label={`${criticalAlerts} alertas críticos`}
        >
          <IconAlertTriangle className="size-3.5 text-amber-300" />
          <span className="text-[11px] font-semibold text-amber-200 tabular-nums">
            {criticalAlerts}
          </span>
        </Link>
      )}
    </div>
  );
}

function ModuleCard({ mod }: { mod: ModuleDef }) {
  const Icon = mod.icon;
  return (
    <Link href={mod.href} className="block transition-all hover:scale-[1.005]">
      <div className="p-4 flex items-center gap-3" style={{ background: T.glass, backdropFilter: T.glassBlur, WebkitBackdropFilter: T.glassBlur, border: `1px solid ${T.glassBorder}`, borderRadius: T.rSm, boxShadow: T.glassShadow }}>
        <div className="rounded-lg p-2.5 shrink-0" style={{ background: `${mod.color}15` }}>
          <Icon className="size-5" style={{ color: mod.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: T.text }}>{mod.label}</p>
          <p className="text-[11px] truncate" style={{ color: T.muted }}>{mod.description}</p>
        </div>
        <IconArrowRight className="size-4 shrink-0" style={{ color: T.muted }} />
      </div>
    </Link>
  );
}

function FinanceiroContent() {
  const [period] = usePersistedPeriod("ytd");
  const { data: d, isLoading } = useFounderDashboard(period);

  return (
    <div className="-mx-4 md:-mx-8 lg:-mx-12 -my-6">
      <div className="min-h-[calc(100dvh-64px)] p-5 space-y-4 max-w-4xl mx-auto">
        {/* Header Bar */}
        <div className="relative overflow-hidden p-4" style={{ background: "linear-gradient(135deg, #1a1410 0%, #2d1810 50%, #c45a1a 100%)", borderRadius: T.r, boxShadow: "0 8px 32px rgba(196,90,26,0.15)" }}>
          <div className="absolute inset-0 opacity-[0.04]"><div className="absolute -top-8 -right-8 size-32 border-[2px] border-white rounded-full" /><div className="absolute bottom-0 left-10 size-16 border-[2px] border-white rounded-full" /></div>
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <OmieSyncButton />
            <HeaderKpis d={d} isLoading={isLoading} />
          </div>
        </div>

        {/* Modules */}
        <div>
          <h2 className="text-sm font-semibold mb-3" style={{ color: T.text }}>Módulos</h2>
          <div className="space-y-2">
            {MODULES.map((mod) => <ModuleCard key={mod.href} mod={mod} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FinanceiroPage() {
  return (
    <RBACGuard minRole="admin">
      <FinanceiroContent />
    </RBACGuard>
  );
}
