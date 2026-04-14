"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { LAUNCH_STATUS_LABELS, LAUNCH_STATUS_COLORS, PHASE_DEFINITIONS } from "../lib/constants";
import type { Launch } from "../services/launches";
import {
  IconBuildingSkyscraper,
  IconMapPin,
  IconCalendar,
  IconArrowRight,
} from "@tabler/icons-react";

interface LaunchCardProps {
  launch: Launch;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function LaunchCard({ launch }: LaunchCardProps) {
  const statusColor = LAUNCH_STATUS_COLORS[launch.status] ?? "#94a3b8";
  const statusLabel = LAUNCH_STATUS_LABELS[launch.status] ?? launch.status;
  const currentPhaseName = PHASE_DEFINITIONS[launch.current_phase - 1]?.name ?? "";

  return (
    <Link href={`/lancamentos/${launch.id}`} className="block group">
      <div className="rounded-xl border p-5 transition-all hover:shadow-md hover:border-primary/20 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10">
              <IconBuildingSkyscraper className="size-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-semibold group-hover:text-primary transition-colors">
                {launch.name}
              </h3>
              {launch.location && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <IconMapPin className="size-3" />
                  {launch.location}
                </div>
              )}
            </div>
          </div>
          <Badge
            variant="outline"
            style={{ borderColor: `${statusColor}40`, color: statusColor, background: `${statusColor}10` }}
          >
            {statusLabel}
          </Badge>
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">
              Fase {launch.current_phase} — {currentPhaseName}
            </span>
            <span className="text-xs font-medium tabular-nums">{launch.overall_progress.toFixed(0)}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${launch.overall_progress}%`,
                background: `linear-gradient(90deg, ${statusColor}, ${statusColor}cc)`,
              }}
            />
          </div>
          {/* Phase dots */}
          <div className="flex gap-1 mt-2">
            {Array.from({ length: 7 }, (_, i) => (
              <div
                key={i}
                className="h-1 flex-1 rounded-full"
                style={{
                  background:
                    i + 1 < launch.current_phase
                      ? "#22c55e"
                      : i + 1 === launch.current_phase
                        ? "#6366f1"
                        : "#e2e8f0",
                }}
              />
            ))}
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-3 pt-1">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">VGV Alvo</p>
            <p className="text-sm font-semibold tabular-nums">{formatCurrency(launch.target_vgv)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Vendidas</p>
            <p className="text-sm font-semibold tabular-nums">
              {launch.units_sold}/{launch.target_units}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Conversão</p>
            <p className="text-sm font-semibold tabular-nums">{launch.conversion_rate.toFixed(1)}%</p>
          </div>
        </div>

        {/* Footer */}
        {(launch.start_date || launch.target_date) && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1 border-t">
            <IconCalendar className="size-3" />
            {launch.start_date && new Date(launch.start_date).toLocaleDateString("pt-BR")}
            {launch.start_date && launch.target_date && " → "}
            {launch.target_date && new Date(launch.target_date).toLocaleDateString("pt-BR")}
          </div>
        )}
      </div>
    </Link>
  );
}
