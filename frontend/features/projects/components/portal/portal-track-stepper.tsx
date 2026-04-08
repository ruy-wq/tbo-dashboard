"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

export type PhaseStatus = "completed" | "in_progress" | "pending";

export interface TrackPhase {
  key: string;
  label: string;
  status: PhaseStatus;
}

export interface PhaseDetail {
  taskCount: number;
  completedCount: number;
  estimatedDays?: number | null;
  actualDays?: number | null;
  owner?: string | null;
}

interface PortalTrackStepperProps {
  phases: TrackPhase[];
  phaseDetails?: Record<string, PhaseDetail>;
  healthLabel: string;
  healthColor: string;
  healthBg: string;
  dueDate: string | null;
}

export function PortalTrackStepper({
  phases,
  phaseDetails,
  healthLabel,
  healthColor,
  healthBg,
  dueDate,
}: PortalTrackStepperProps) {
  const countdown = useMemo(() => {
    if (!dueDate) return null;
    const end = new Date(dueDate + "T23:59:59");
    const days = differenceInDays(end, new Date());
    if (days < 0) return { label: `${Math.abs(days)} dias atrasado`, overdue: true };
    if (days === 0) return { label: "Entrega hoje", overdue: false };
    return { label: `${days} dias para entrega`, overdue: false };
  }, [dueDate]);

  const currentIndex = phases.findIndex((p) => p.status === "in_progress");

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Progresso</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative flex items-center justify-between px-2 py-4">
          {/* Connecting line */}
          <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2">
            <div className="h-0.5 w-full bg-border" />
            {currentIndex >= 0 && (
              <div
                className="absolute left-0 top-0 h-0.5 bg-primary transition-all duration-500"
                style={{
                  width:
                    phases.length <= 1
                      ? "100%"
                      : `${(currentIndex / (phases.length - 1)) * 100}%`,
                }}
              />
            )}
          </div>

          {phases.map((phase, i) => {
            const detail = phaseDetails?.[phase.key];
            const hasDetail = detail && detail.taskCount > 0;
            const pct =
              hasDetail && detail.taskCount > 0
                ? Math.round((detail.completedCount / detail.taskCount) * 100)
                : null;

            const circle = (
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all",
                  phase.status === "completed" &&
                    "border-primary bg-primary text-primary-foreground",
                  phase.status === "in_progress" &&
                    "border-primary bg-primary/10 text-primary animate-pulse",
                  phase.status === "pending" &&
                    "border-muted-foreground/30 bg-background text-muted-foreground/50",
                  hasDetail && "cursor-pointer",
                )}
              >
                {phase.status === "completed" ? (
                  <svg
                    className="size-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
            );

            return (
              <div
                key={phase.key}
                className="relative z-10 flex flex-col items-center gap-2"
              >
                {hasDetail ? (
                  <Popover>
                    <PopoverTrigger asChild>{circle}</PopoverTrigger>
                    <PopoverContent
                      className="w-56 p-3"
                      side="top"
                      sideOffset={8}
                    >
                      <div className="space-y-2.5">
                        <p className="text-sm font-semibold">{phase.label}</p>

                        {/* Progress */}
                        <div>
                          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              {detail.completedCount}/{detail.taskCount} tasks
                            </span>
                            {pct !== null && (
                              <span className="font-medium text-foreground">
                                {pct}%
                              </span>
                            )}
                          </div>
                          <Progress value={pct ?? 0} className="h-1.5" />
                        </div>

                        {/* Time */}
                        {(detail.estimatedDays || detail.actualDays) && (
                          <div className="flex items-center justify-between text-xs">
                            {detail.estimatedDays && (
                              <span className="text-muted-foreground">
                                Est: {detail.estimatedDays}d
                              </span>
                            )}
                            {detail.actualDays !== undefined &&
                              detail.actualDays !== null && (
                                <span
                                  className={cn(
                                    "font-medium",
                                    detail.estimatedDays &&
                                      detail.actualDays > detail.estimatedDays
                                      ? "text-red-500"
                                      : "text-green-600",
                                  )}
                                >
                                  Real: {detail.actualDays}d
                                </span>
                              )}
                          </div>
                        )}

                        {/* Owner */}
                        {detail.owner && (
                          <p className="text-[11px] text-muted-foreground">
                            Responsavel: {detail.owner}
                          </p>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                ) : (
                  circle
                )}

                {/* Label */}
                <span
                  className={cn(
                    "max-w-[80px] text-center text-[10px] leading-tight",
                    phase.status === "completed" && "font-medium text-foreground",
                    phase.status === "in_progress" &&
                      "font-semibold text-primary",
                    phase.status === "pending" && "text-muted-foreground",
                  )}
                >
                  {phase.label}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
