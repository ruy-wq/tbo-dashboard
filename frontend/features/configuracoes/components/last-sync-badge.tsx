"use client";

import { useEffect, useState } from "react";
import {
  IconCircleCheck,
  IconCircleDashed,
  IconAlertTriangle,
  IconAlertCircle,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { NotionLastSync } from "@/features/integrations/hooks/use-notion-integration";

const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000;
const TICK_MS = 60_000;

interface Props {
  lastSync: NotionLastSync | null;
}

export function LastSyncBadge({ lastSync }: Props) {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  if (!lastSync) {
    return (
      <Badge variant="outline" className="shrink-0 text-[10px] font-normal">
        Nunca sincronizado
      </Badge>
    );
  }

  const reference = lastSync.completed_at ?? lastSync.started_at;
  if (!reference) return null;

  const ageMs = now - new Date(reference).getTime();
  const status = resolveStatus(lastSync.status, ageMs);
  const { Icon, label, tone } = PRESENTATION[status];

  return (
    <Badge
      variant="outline"
      className={cn(
        "shrink-0 gap-1 text-[10px] font-normal whitespace-nowrap",
        tone,
      )}
      title={`${label}: ${new Date(reference).toLocaleString("pt-BR")}`}
    >
      <Icon className="h-3 w-3" />
      {label} · {formatRelative(ageMs)}
    </Badge>
  );
}

type Status = "success" | "running" | "partial" | "error" | "stale";

function resolveStatus(raw: string, ageMs: number): Status {
  if (raw === "running") return "running";
  if (raw === "error") return "error";
  if (raw === "partial") return "partial";
  if (ageMs > STALE_THRESHOLD_MS) return "stale";
  return "success";
}

const PRESENTATION: Record<
  Status,
  { Icon: typeof IconCircleCheck; label: string; tone: string }
> = {
  success: {
    Icon: IconCircleCheck,
    label: "Sincronizado",
    tone: "border-green-200 text-green-700 dark:border-green-900 dark:text-green-400",
  },
  running: {
    Icon: IconCircleDashed,
    label: "Sincronizando",
    tone: "border-blue-200 text-blue-700 dark:border-blue-900 dark:text-blue-400",
  },
  partial: {
    Icon: IconAlertTriangle,
    label: "Parcial",
    tone: "border-amber-200 text-amber-700 dark:border-amber-900 dark:text-amber-400",
  },
  stale: {
    Icon: IconAlertTriangle,
    label: "Desatualizado",
    tone: "border-amber-200 text-amber-700 dark:border-amber-900 dark:text-amber-400",
  },
  error: {
    Icon: IconAlertCircle,
    label: "Erro",
    tone: "border-red-200 text-red-700 dark:border-red-900 dark:text-red-400",
  },
};

function formatRelative(ms: number): string {
  if (ms < 0) return "agora";
  const s = Math.floor(ms / 1000);
  if (s < 60) return "agora";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m atras`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atras`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d atras`;
  const mo = Math.floor(d / 30);
  return `${mo}mo atras`;
}
