"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/stores/auth-store";
import { hasMinRole } from "@/lib/permissions";
import { RequireRole } from "@/features/auth/components/require-role";
import { useLaunchDetail, useUpdateLaunch, useDeleteLaunch } from "@/features/lancamentos/hooks/use-launches";
import { StrategicPanel } from "@/features/lancamentos/components/strategic-panel";
import { OperationalPanel } from "@/features/lancamentos/components/operational-panel";
import { IndicatorsPanel } from "@/features/lancamentos/components/indicators-panel";
import { LAUNCH_STATUS_LABELS, LAUNCH_STATUS_COLORS, PHASE_DEFINITIONS } from "@/features/lancamentos/lib/constants";
import { ErrorState } from "@/components/shared";
import {
  IconArrowLeft,
  IconStack2,
  IconActivity,
  IconChartBar,
  IconMapPin,
  IconCalendar,
  IconPlayerPlay,
  IconPlayerPause,
  IconCheck,
  IconTrash,
} from "@tabler/icons-react";

/* ─── Skeleton ────────────────────────────────────────────────────── */

function DetailSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-10 w-80" />
      <Skeleton className="h-[500px] rounded-xl" />
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────── */

export default function LaunchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const role = useAuthStore((s) => s.role);
  const isAdmin = hasMinRole(role, "admin");
  const canApproveGate = hasMinRole(role, "lider");

  const { data: launch, isLoading, error, refetch } = useLaunchDetail(id);
  const updateLaunch = useUpdateLaunch();
  const deleteLaunch = useDeleteLaunch();

  const [tab, setTab] = useState("operacional");

  if (isLoading) return <DetailSkeleton />;
  if (error || !launch) {
    return (
      <ErrorState
        message="Erro ao carregar lançamento"
        onRetry={() => refetch()}
      />
    );
  }

  const statusColor = LAUNCH_STATUS_COLORS[launch.status] ?? "#94a3b8";
  const statusLabel = LAUNCH_STATUS_LABELS[launch.status] ?? launch.status;
  const currentPhaseName = PHASE_DEFINITIONS[launch.current_phase - 1]?.name ?? "";

  function handleStatusChange(newStatus: string) {
    if (!launch) return;
    updateLaunch.mutate({ id: launch.id, updates: { status: newStatus } });
  }

  function handleDelete() {
    if (!launch) return;
    if (!confirm("Tem certeza que deseja excluir este lançamento?")) return;
    deleteLaunch.mutate(launch.id, {
      onSuccess: () => router.push("/lancamentos"),
    });
  }

  return (
    <RequireRole minRole="lider">
      <div className="space-y-6 p-6">
        {/* Breadcrumb + Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/lancamentos">
              <Button variant="ghost" size="sm" className="gap-1">
                <IconArrowLeft className="size-4" />
                Lançamentos
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {launch.status === "planning" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange("active")}
                className="gap-1 text-green-600 border-green-200 hover:bg-green-50"
              >
                <IconPlayerPlay className="size-3.5" />
                Ativar
              </Button>
            )}
            {launch.status === "active" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange("paused")}
                className="gap-1"
              >
                <IconPlayerPause className="size-3.5" />
                Pausar
              </Button>
            )}
            {launch.status === "paused" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange("active")}
                className="gap-1 text-green-600"
              >
                <IconPlayerPlay className="size-3.5" />
                Retomar
              </Button>
            )}
            {(launch.status === "active" || launch.status === "paused") && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange("completed")}
                className="gap-1 text-blue-600"
              >
                <IconCheck className="size-3.5" />
                Concluir
              </Button>
            )}
            {isAdmin && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                className="gap-1 text-destructive hover:text-destructive"
              >
                <IconTrash className="size-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{launch.name}</h1>
            <Badge
              variant="outline"
              style={{
                borderColor: `${statusColor}40`,
                color: statusColor,
                background: `${statusColor}10`,
              }}
            >
              {statusLabel}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {launch.location && (
              <span className="flex items-center gap-1">
                <IconMapPin className="size-3.5" />
                {launch.location}
              </span>
            )}
            <span>
              Fase {launch.current_phase}/7 — {currentPhaseName}
            </span>
            {launch.start_date && (
              <span className="flex items-center gap-1">
                <IconCalendar className="size-3.5" />
                {new Date(launch.start_date).toLocaleDateString("pt-BR")}
                {launch.target_date &&
                  ` → ${new Date(launch.target_date).toLocaleDateString("pt-BR")}`}
              </span>
            )}
          </div>
          {launch.description && (
            <p className="text-sm text-muted-foreground mt-2">{launch.description}</p>
          )}
        </div>

        {/* Phase dots */}
        <div className="flex gap-1.5">
          {Array.from({ length: 7 }, (_, i) => {
            const phase = launch.launch_phases.find((p) => p.phase_number === i + 1);
            return (
              <div key={i} className="flex-1 space-y-1">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    background:
                      phase?.status === "completed"
                        ? "#22c55e"
                        : phase?.status === "in_progress"
                          ? "#6366f1"
                          : phase?.status === "blocked"
                            ? "#ef4444"
                            : "#e2e8f0",
                  }}
                />
                <p className="text-[9px] text-center text-muted-foreground truncate">
                  {PHASE_DEFINITIONS[i]?.name}
                </p>
              </div>
            );
          })}
        </div>

        {/* 3 System Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="estrategico" className="gap-1.5">
              <IconStack2 className="size-4" />
              Estratégico
            </TabsTrigger>
            <TabsTrigger value="operacional" className="gap-1.5">
              <IconActivity className="size-4" />
              Operacional
            </TabsTrigger>
            <TabsTrigger value="indicadores" className="gap-1.5">
              <IconChartBar className="size-4" />
              Indicadores
            </TabsTrigger>
          </TabsList>

          <TabsContent value="estrategico" className="mt-6">
            <StrategicPanel launch={launch} />
          </TabsContent>

          <TabsContent value="operacional" className="mt-6">
            <OperationalPanel launch={launch} canApproveGate={canApproveGate} />
          </TabsContent>

          <TabsContent value="indicadores" className="mt-6">
            <IndicatorsPanel launch={launch} />
          </TabsContent>
        </Tabs>
      </div>
    </RequireRole>
  );
}
