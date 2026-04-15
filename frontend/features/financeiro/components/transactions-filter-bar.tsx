"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Sparkles, Download, Plus } from "lucide-react";
import {
  getTBOYearRange,
  getTBOSemesterRange,
  getTBOQuarterRange,
  getTBOYearPeriods,
} from "@/features/financeiro/services/finance-cycle";

const YEAR = new Date().getFullYear();

const yearRange = getTBOYearRange(YEAR);
const s1 = getTBOSemesterRange(YEAR, 1);
const s2 = getTBOSemesterRange(YEAR, 2);
const q1 = getTBOQuarterRange(YEAR, 1);
const q2 = getTBOQuarterRange(YEAR, 2);
const q3 = getTBOQuarterRange(YEAR, 3);
const q4 = getTBOQuarterRange(YEAR, 4);
const monthPeriods = getTBOYearPeriods(YEAR);

export const PERIOD_OPTIONS = [
  { value: "year", label: `${YEAR}`, from: yearRange.from, to: yearRange.to },
  { value: "s1", label: `S1 ${YEAR}`, from: s1.from, to: s1.to },
  { value: "s2", label: `S2 ${YEAR}`, from: s2.from, to: s2.to },
  { value: "q1", label: `Q1 ${YEAR}`, from: q1.from, to: q1.to },
  { value: "q2", label: `Q2 ${YEAR}`, from: q2.from, to: q2.to },
  { value: "q3", label: `Q3 ${YEAR}`, from: q3.from, to: q3.to },
  { value: "q4", label: `Q4 ${YEAR}`, from: q4.from, to: q4.to },
  ...monthPeriods,
  { value: "all", label: "Todos", from: undefined as string | undefined, to: undefined as string | undefined },
] as const;

interface TransactionsFilterBarProps {
  periodFilter: string;
  setPeriodFilter: (v: string) => void;
  search: string;
  setSearch: (v: string) => void;
  typeFilter: string;
  setTypeFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  setPage: (v: number) => void;
  uncategorizedCount: number;
  bulkPending: boolean;
  onBulkCategorize: () => void;
  allTxCount: number;
  onExportCSV: () => void;
  onNew: () => void;
}

export function TransactionsFilterBar({
  periodFilter,
  setPeriodFilter,
  search,
  setSearch,
  typeFilter,
  setTypeFilter,
  statusFilter,
  setStatusFilter,
  setPage,
  uncategorizedCount,
  bulkPending,
  onBulkCategorize,
  allTxCount,
  onExportCSV,
  onNew,
}: TransactionsFilterBarProps) {
  return (
    <>
      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {uncategorizedCount > 0 && (
          <Button
            variant="outline"
            onClick={onBulkCategorize}
            disabled={bulkPending}
          >
            <Sparkles className="mr-2 h-4 w-4 text-purple-600" />
            {bulkPending
              ? "Categorizando..."
              : `Auto-categorizar (${uncategorizedCount})`}
          </Button>
        )}
        {allTxCount > 0 && (
          <Button variant="outline" onClick={onExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        )}
        <Button onClick={onNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Transacao
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select
          value={periodFilter}
          onValueChange={(v) => {
            setPeriodFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Periodo" />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar descricao..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={typeFilter}
          onValueChange={(v) => {
            setTypeFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="receita">Receita</SelectItem>
            <SelectItem value="despesa">Despesa</SelectItem>
            <SelectItem value="transferencia">Transferencia</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="previsto">Previsto</SelectItem>
            <SelectItem value="provisionado">Provisionado</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
            <SelectItem value="liquidado">Liquidado</SelectItem>
            <SelectItem value="parcial">Parcial</SelectItem>
            <SelectItem value="atrasado">Atrasado</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
