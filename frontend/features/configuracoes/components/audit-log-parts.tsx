"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconChevronLeft,
  IconChevronRight,
  IconFilter,
  IconFilterOff,
} from "@tabler/icons-react";
import {
  ACTION_LABELS,
  ENTITY_LABELS,
  ALL_ACTIONS,
  ALL_ENTITIES,
} from "./audit-log-constants";
import { parseAuditMetadata } from "@/features/configuracoes/types";

// ── Skeleton ──────────────────────────────────────────────────────────────

export function AuditSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-32" />
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  );
}

// ── Filters ───────────────────────────────────────────────────────────────

type AuditFiltersProps = {
  action: string;
  entityType: string;
  dateFrom: string;
  dateTo: string;
  hasFilters: boolean;
  onActionChange: (v: string) => void;
  onEntityTypeChange: (v: string) => void;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  onClear: () => void;
};

export function AuditFilters({
  action,
  entityType,
  dateFrom,
  dateTo,
  hasFilters,
  onActionChange,
  onEntityTypeChange,
  onDateFromChange,
  onDateToChange,
  onClear,
}: AuditFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Select
        value={action || "all"}
        onValueChange={(v) => onActionChange(v === "all" ? "" : v)}
      >
        <SelectTrigger className="w-[140px] h-8 text-xs">
          <IconFilter size={12} className="mr-1.5 text-muted-foreground" />
          <SelectValue placeholder="Ação" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as ações</SelectItem>
          {ALL_ACTIONS.map((a) => (
            <SelectItem key={a} value={a}>
              {ACTION_LABELS[a]?.label ?? a}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={entityType || "all"}
        onValueChange={(v) => onEntityTypeChange(v === "all" ? "" : v)}
      >
        <SelectTrigger className="w-[150px] h-8 text-xs">
          <SelectValue placeholder="Entidade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas entidades</SelectItem>
          {ALL_ENTITIES.map((e) => (
            <SelectItem key={e} value={e}>
              {ENTITY_LABELS[e]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="date"
        value={dateFrom}
        onChange={(e) => onDateFromChange(e.target.value)}
        className="w-[140px] h-8 text-xs"
        placeholder="De"
      />
      <Input
        type="date"
        value={dateTo}
        onChange={(e) => onDateToChange(e.target.value)}
        className="w-[140px] h-8 text-xs"
        placeholder="Até"
      />

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-8 px-2 text-xs text-muted-foreground gap-1"
        >
          <IconFilterOff size={12} />
          Limpar
        </Button>
      )}
    </div>
  );
}

// ── LogItem ───────────────────────────────────────────────────────────────

type AuditLogRecord = {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string | null;
  metadata: unknown;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
};

export function AuditLogItem({ log }: { log: AuditLogRecord }) {
  const actionInfo = ACTION_LABELS[log.action] ?? {
    label: log.action,
    color:
      "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  };
  const entityLabel =
    ENTITY_LABELS[log.entity_type ?? ""] ?? log.entity_type ?? "—";
  const meta = parseAuditMetadata(log.metadata);
  const changedFieldKeys = meta?.changed_fields
    ? Object.keys(meta.changed_fields)
    : [];
  const date = new Date(log.created_at ?? "");
  const user = log.profiles;
  const initials = (user?.full_name ?? "?")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="py-3 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <Avatar className="h-7 w-7 shrink-0 mt-0.5">
          <AvatarImage src={user?.avatar_url ?? undefined} />
          <AvatarFallback className="text-[10px] font-semibold bg-tbo-orange/10 text-tbo-orange">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${actionInfo.color}`}
            >
              {actionInfo.label}
            </span>
            <span className="text-sm font-medium">{entityLabel}</span>
            {log.entity_id && (
              <span className="text-xs text-muted-foreground font-mono">
                #{log.entity_id.slice(0, 8)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {user?.full_name && (
              <span className="text-xs text-muted-foreground">
                por{" "}
                <span className="font-medium text-foreground">
                  {user.full_name}
                </span>
              </span>
            )}
            {changedFieldKeys.length > 0 && (
              <span className="text-xs text-muted-foreground">
                · campos: {changedFieldKeys.join(", ")}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className="text-xs text-muted-foreground">
          {date.toLocaleDateString("pt-BR")}
        </p>
        <p className="text-xs text-muted-foreground">
          {date.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────

type AuditPaginationProps = {
  page: number;
  totalPages: number;
  totalCount: number;
  onPrev: () => void;
  onNext: () => void;
};

export function AuditPagination({
  page,
  totalPages,
  totalCount,
  onPrev,
  onNext,
}: AuditPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-4 mt-2 border-t">
      <p className="text-xs text-muted-foreground">
        Página {page + 1} de {totalPages} · {totalCount} registros
      </p>
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={page === 0}
          onClick={onPrev}
          aria-label="Página anterior"
        >
          <IconChevronLeft size={14} />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={page >= totalPages - 1}
          onClick={onNext}
          aria-label="Próxima página"
        >
          <IconChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
}
