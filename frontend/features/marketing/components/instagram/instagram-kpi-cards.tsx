"use client";

import {
  IconUsers,
  IconEye,
  IconHeart,
  IconTrendingUp,
  IconPhoto,
  IconClick,
} from "@tabler/icons-react";
import { Skeleton } from "@/components/ui/skeleton";
import { computeInstagramKPIs } from "../../services/instagram";
import type { MetaInstagramInsight } from "../../types/instagram";

interface Props {
  current: MetaInstagramInsight[];
  previous: MetaInstagramInsight[];
  isLoading: boolean;
}

interface KPIItem {
  label: string;
  value: string;
  change: number;
  icon: React.ElementType;
  color: string;
}

export function InstagramKPICards({ current, previous, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-4 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    );
  }

  const kpis = computeInstagramKPIs(current, previous);

  const items: KPIItem[] = [
    {
      label: "Seguidores",
      value: formatNumber(kpis.followers),
      change: kpis.followerChange,
      icon: IconUsers,
      color: "#3b82f6",
    },
    {
      label: "Alcance",
      value: formatNumber(kpis.reach),
      change: kpis.reachChange,
      icon: IconEye,
      color: "#8b5cf6",
    },
    {
      label: "Engajamento",
      value: formatNumber(kpis.engagement),
      change: kpis.engagementChange,
      icon: IconHeart,
      color: "#ef4444",
    },
    {
      label: "Taxa de eng.",
      value: `${kpis.engagementRate}%`,
      change: kpis.engagementRateChange,
      icon: IconTrendingUp,
      color: "#22c55e",
    },
    {
      label: "Visitas ao perfil",
      value: formatNumber(kpis.profileViews),
      change: kpis.profileViewsChange,
      icon: IconClick,
      color: "#f59e0b",
    },
    {
      label: "Posts",
      value: formatNumber(kpis.postsCount),
      change: 0,
      icon: IconPhoto,
      color: "#ec4899",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {items.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div
            key={kpi.label}
            className="rounded-lg border bg-card p-4 space-y-1 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center gap-1.5">
              <Icon className="size-3.5" style={{ color: kpi.color }} />
              <p className="text-[11px] text-muted-foreground">{kpi.label}</p>
            </div>
            <p className="text-xl font-bold tracking-tight">{kpi.value}</p>
            {kpi.change !== 0 && (
              <p
                className={`text-[11px] font-medium ${
                  kpi.change > 0 ? "text-emerald-600" : "text-red-500"
                }`}
              >
                {kpi.change > 0 ? "+" : ""}
                {typeof kpi.change === "number" && Math.abs(kpi.change) < 1
                  ? `${kpi.change}%`
                  : formatNumber(kpi.change)}
                {" "}vs periodo anterior
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function formatNumber(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("pt-BR");
}
