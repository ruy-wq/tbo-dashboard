"use client";

import { cn } from "@/lib/utils";
import { PHASE_STATUS_LABELS } from "../lib/constants";
import type { LaunchPhase, LaunchPhaseItem } from "../services/launches";
import {
  IconCheck,
  IconLock,
  IconPlayerPlay,
  IconClock,
} from "@tabler/icons-react";

interface PhaseTimelineProps {
  phases: (LaunchPhase & { launch_phase_items: LaunchPhaseItem[] })[];
  currentPhase: number;
  onSelectPhase: (phase: LaunchPhase & { launch_phase_items: LaunchPhaseItem[] }) => void;
  selectedPhaseNumber?: number;
}

const STATUS_ICON: Record<string, React.ElementType> = {
  completed: IconCheck,
  in_progress: IconPlayerPlay,
  blocked: IconLock,
  pending: IconClock,
};

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  completed: { bg: "rgba(34,197,94,0.12)", border: "#22c55e", text: "#22c55e" },
  in_progress: { bg: "rgba(99,102,241,0.12)", border: "#6366f1", text: "#6366f1" },
  blocked: { bg: "rgba(239,68,68,0.12)", border: "#ef4444", text: "#ef4444" },
  pending: { bg: "rgba(148,163,184,0.08)", border: "#94a3b8", text: "#94a3b8" },
};

export function PhaseTimeline({ phases, currentPhase, onSelectPhase, selectedPhaseNumber }: PhaseTimelineProps) {
  return (
    <div className="space-y-1">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Fases do Lançamento
      </h3>
      {phases.map((phase, idx) => {
        const colors = STATUS_COLORS[phase.status] ?? STATUS_COLORS.pending;
        const Icon = STATUS_ICON[phase.status] ?? IconClock;
        const isSelected = selectedPhaseNumber === phase.phase_number;
        const completedItems = phase.launch_phase_items.filter((i) => i.is_completed).length;
        const totalItems = phase.launch_phase_items.length;
        const isCurrent = phase.phase_number === currentPhase;

        return (
          <div key={phase.id} className="flex gap-3">
            {/* Connector line */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => onSelectPhase(phase)}
                className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all border-2",
                  isSelected && "ring-2 ring-offset-2 ring-offset-background",
                )}
                style={{
                  background: colors.bg,
                  borderColor: colors.border,
                  ...(isSelected ? { ringColor: colors.border } : {}),
                }}
              >
                <Icon className="size-4" style={{ color: colors.text }} />
              </button>
              {idx < phases.length - 1 && (
                <div
                  className="w-0.5 flex-1 min-h-[20px] my-1 rounded-full"
                  style={{
                    background: phase.status === "completed" ? "#22c55e" : "#e2e8f0",
                  }}
                />
              )}
            </div>

            {/* Phase info */}
            <button
              onClick={() => onSelectPhase(phase)}
              className={cn(
                "flex-1 text-left rounded-lg p-3 transition-all mb-1",
                isSelected
                  ? "bg-accent/80 shadow-sm"
                  : "hover:bg-accent/40",
              )}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-semibold">
                  {phase.phase_number}. {phase.name}
                </span>
                {isCurrent && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                    style={{ background: colors.bg, color: colors.text }}
                  >
                    Atual
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1.5 rounded-full bg-muted/50 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${phase.progress}%`,
                      background: colors.border,
                    }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium tabular-nums">
                  {completedItems}/{totalItems}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {PHASE_STATUS_LABELS[phase.status] ?? phase.status}
                {phase.gate_approved && " · Gate aprovado"}
              </p>
            </button>
          </div>
        );
      })}
    </div>
  );
}
