"use client";

import { useReducer } from "react";
import { useAuditLogs } from "@/features/configuracoes/hooks/use-settings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { IconShieldCheck } from "@tabler/icons-react";
import {
  AuditSkeleton,
  AuditFilters,
  AuditLogItem,
  AuditPagination,
} from "./audit-log-parts";

interface FiltersState {
  page: number;
  action: string;
  entityType: string;
  dateFrom: string;
  dateTo: string;
}

type FilterField = "action" | "entityType" | "dateFrom" | "dateTo";

type Action =
  | { type: "setField"; field: FilterField; value: string }
  | { type: "setPage"; value: number }
  | { type: "clear" };

const INITIAL_STATE: FiltersState = {
  page: 0,
  action: "",
  entityType: "",
  dateFrom: "",
  dateTo: "",
};

function filtersReducer(state: FiltersState, action: Action): FiltersState {
  switch (action.type) {
    case "setField":
      return { ...state, [action.field]: action.value, page: 0 };
    case "setPage":
      return { ...state, page: action.value };
    case "clear":
      return INITIAL_STATE;
  }
}

function AuditCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <AuditSkeleton />
      </CardContent>
    </Card>
  );
}

export function AuditLogTable() {
  const [filters, dispatch] = useReducer(filtersReducer, INITIAL_STATE);
  const { page, action, entityType, dateFrom, dateTo } = filters;

  const hasFilters = !!(action || entityType || dateFrom || dateTo);

  const { data, isLoading } = useAuditLogs({
    page,
    action: action || undefined,
    entityType: entityType || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const logs = data?.data ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / 25);

  if (isLoading) return <AuditCardSkeleton />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <IconShieldCheck size={16} className="text-muted-foreground" />
          Logs de Auditoria
          <span className="ml-1 text-muted-foreground font-normal">({totalCount})</span>
        </CardTitle>
        <CardDescription>
          Registro de ações realizadas no sistema pelos membros da equipe
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <AuditFilters
          action={action}
          entityType={entityType}
          dateFrom={dateFrom}
          dateTo={dateTo}
          hasFilters={hasFilters}
          onActionChange={(v) => dispatch({ type: "setField", field: "action", value: v })}
          onEntityTypeChange={(v) => dispatch({ type: "setField", field: "entityType", value: v })}
          onDateFromChange={(v) => dispatch({ type: "setField", field: "dateFrom", value: v })}
          onDateToChange={(v) => dispatch({ type: "setField", field: "dateTo", value: v })}
          onClear={() => dispatch({ type: "clear" })}
        />

        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">
            {hasFilters
              ? "Nenhum log encontrado para os filtros aplicados."
              : "Nenhum log de auditoria encontrado."}
          </p>
        ) : (
          <div className="divide-y">
            {logs.map((log) => (
              <AuditLogItem key={log.id} log={log} />
            ))}
          </div>
        )}

        <AuditPagination
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          onPrev={() => dispatch({ type: "setPage", value: page - 1 })}
          onNext={() => dispatch({ type: "setPage", value: page + 1 })}
        />
      </CardContent>
    </Card>
  );
}
