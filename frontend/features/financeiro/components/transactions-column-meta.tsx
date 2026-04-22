"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import type { FinanceTransaction, FinanceSortColumn } from "@/features/financeiro/services/finance-types";
import type { ColumnId } from "../hooks/use-transactions-table-layout";

const STATUS_COLORS: Record<string, string> = {
  previsto: "bg-blue-100 text-blue-800",
  provisionado: "bg-purple-100 text-purple-800",
  pago: "bg-green-100 text-green-800",
  liquidado: "bg-emerald-100 text-emerald-800",
  parcial: "bg-amber-100 text-amber-800",
  atrasado: "bg-red-100 text-red-800",
  recorrente: "bg-indigo-100 text-indigo-800",
  cancelado: "bg-gray-100 text-gray-800",
};

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "\u2014";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("pt-BR");
}

export interface CellContext {
  categoryMap: Map<string, string>;
  costCenterMap: Map<string, string>;
}

export interface ColumnMeta {
  id: ColumnId;
  label: string;
  sortable: FinanceSortColumn | null;
  align: "left" | "right";
  renderCell: (tx: FinanceTransaction, ctx: CellContext) => ReactNode;
}

export const COLUMN_META: Record<ColumnId, ColumnMeta> = {
  description: {
    id: "description",
    label: "Descricao",
    sortable: "description",
    align: "left",
    renderCell: (tx) => (
      <span className="font-medium truncate block">{tx.description}</span>
    ),
  },
  category: {
    id: "category",
    label: "Categoria",
    sortable: null,
    align: "left",
    renderCell: (tx, { categoryMap }) => (
      <span className="text-sm text-muted-foreground truncate block">
        {tx.category_id ? (
          (categoryMap.get(tx.category_id) ?? "\u2014")
        ) : (
          <span className="text-amber-500">sem categoria</span>
        )}
      </span>
    ),
  },
  cost_center: {
    id: "cost_center",
    label: "Centro de Custo",
    sortable: null,
    align: "left",
    renderCell: (tx, { costCenterMap }) => (
      <span className="text-sm text-muted-foreground truncate block">
        {tx.cost_center_id ? (
          (costCenterMap.get(tx.cost_center_id) ?? "\u2014")
        ) : (
          <span className="text-amber-500">sem CC</span>
        )}
      </span>
    ),
  },
  counterpart: {
    id: "counterpart",
    label: "Contraparte",
    sortable: "counterpart",
    align: "left",
    renderCell: (tx) => (
      <span className="text-sm truncate block">{tx.counterpart ?? "\u2014"}</span>
    ),
  },
  amount: {
    id: "amount",
    label: "Valor",
    sortable: "amount",
    align: "right",
    renderCell: (tx) => (
      <span
        className={`font-mono font-medium ${
          tx.type === "receita"
            ? "text-green-600"
            : tx.type === "despesa"
              ? "text-red-600"
              : ""
        }`}
      >
        {formatBRL(Number(tx.amount))}
      </span>
    ),
  },
  date: {
    id: "date",
    label: "Data",
    sortable: "date",
    align: "left",
    renderCell: (tx) => <span className="text-sm">{formatDate(tx.date)}</span>,
  },
  due_date: {
    id: "due_date",
    label: "Vencimento",
    sortable: "due_date",
    align: "left",
    renderCell: (tx) => (
      <span className="text-sm">{formatDate(tx.due_date)}</span>
    ),
  },
  status: {
    id: "status",
    label: "Status",
    sortable: "status",
    align: "left",
    renderCell: (tx) => (
      <Badge variant="secondary" className={STATUS_COLORS[tx.status] ?? ""}>
        {tx.status}
      </Badge>
    ),
  },
};
