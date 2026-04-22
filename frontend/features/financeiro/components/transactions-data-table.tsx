"use client";

import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
  ArrowLeftRight,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
} from "lucide-react";
import type {
  FinanceTransaction,
  FinanceSortColumn,
  FinanceSortDir,
} from "@/features/financeiro/services/finance-types";

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

const TYPE_ICONS = {
  receita: <ArrowUpCircle className="h-4 w-4 text-green-600" />,
  despesa: <ArrowDownCircle className="h-4 w-4 text-red-600" />,
  transferencia: <ArrowLeftRight className="h-4 w-4 text-blue-600" />,
} as const;

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

interface TransactionsDataTableProps {
  transactions: FinanceTransaction[];
  isLoading: boolean;
  categoryMap: Map<string, string>;
  costCenterMap: Map<string, string>;
  onEdit: (tx: FinanceTransaction) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  sortBy: FinanceSortColumn;
  sortDir: FinanceSortDir;
  onSortChange: (column: FinanceSortColumn) => void;
}

function SortableHeader({
  column,
  label,
  align = "left",
  sortBy,
  sortDir,
  onSortChange,
}: {
  column: FinanceSortColumn;
  label: string;
  align?: "left" | "right";
  sortBy: FinanceSortColumn;
  sortDir: FinanceSortDir;
  onSortChange: (column: FinanceSortColumn) => void;
}) {
  const active = sortBy === column;
  const Icon = active ? (sortDir === "asc" ? ArrowUp : ArrowDown) : ChevronsUpDown;
  return (
    <TableHead className={align === "right" ? "text-right" : undefined}>
      <button
        type="button"
        onClick={() => onSortChange(column)}
        className={`inline-flex items-center gap-1 hover:text-foreground transition-colors ${
          align === "right" ? "flex-row-reverse" : ""
        } ${active ? "text-foreground font-semibold" : ""}`}
        aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
      >
        {label}
        <Icon
          className={`h-3 w-3 ${active ? "opacity-100" : "opacity-40"}`}
        />
      </button>
    </TableHead>
  );
}

const TransactionRow = memo(function TransactionRow({
  tx,
  categoryMap,
  costCenterMap,
  onEdit,
  onDelete,
}: {
  tx: FinanceTransaction;
  categoryMap: Map<string, string>;
  costCenterMap: Map<string, string>;
  onEdit: (tx: FinanceTransaction) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => onEdit(tx)}
    >
      <TableCell>{TYPE_ICONS[tx.type]}</TableCell>
      <TableCell className="font-medium max-w-[250px] truncate">
        {tx.description}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {tx.category_id
          ? categoryMap.get(tx.category_id) ?? "\u2014"
          : <span className="text-amber-500">sem categoria</span>}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {tx.cost_center_id
          ? costCenterMap.get(tx.cost_center_id) ?? "\u2014"
          : <span className="text-amber-500">sem CC</span>}
      </TableCell>
      <TableCell className="text-sm">
        {tx.counterpart ?? "\u2014"}
      </TableCell>
      <TableCell
        className={`text-right font-mono font-medium ${
          tx.type === "receita"
            ? "text-green-600"
            : tx.type === "despesa"
              ? "text-red-600"
              : ""
        }`}
      >
        {formatBRL(Number(tx.amount))}
      </TableCell>
      <TableCell className="text-sm">
        {formatDate(tx.date)}
      </TableCell>
      <TableCell className="text-sm">
        {formatDate(tx.due_date)}
      </TableCell>
      <TableCell>
        <Badge
          variant="secondary"
          className={STATUS_COLORS[tx.status] ?? ""}
        >
          {tx.status}
        </Badge>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit(tx);
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(tx.id);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
});

export function TransactionsDataTable({
  transactions,
  isLoading,
  categoryMap,
  costCenterMap,
  onEdit,
  onDelete,
  onNew,
  sortBy,
  sortDir,
  onSortChange,
}: TransactionsDataTableProps) {
  const sortProps = { sortBy, sortDir, onSortChange };
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]" />
              <SortableHeader column="description" label="Descricao" {...sortProps} />
              <TableHead>Categoria</TableHead>
              <TableHead>Centro de Custo</TableHead>
              <SortableHeader column="counterpart" label="Contraparte" {...sortProps} />
              <SortableHeader column="amount" label="Valor" align="right" {...sortProps} />
              <SortableHeader column="date" label="Data" {...sortProps} />
              <SortableHeader column="due_date" label="Vencimento" {...sortProps} />
              <SortableHeader column="status" label="Status" {...sortProps} />
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 10 }).map((__, j) => (
                    <TableCell key={j}>
                      <div className="h-4 w-full animate-pulse rounded bg-muted" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-32 text-center">
                  <p className="text-muted-foreground">
                    Nenhuma transacao encontrada.
                  </p>
                  <Button
                    variant="link"
                    className="mt-2"
                    onClick={onNew}
                  >
                    Criar primeira transacao
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  tx={tx}
                  categoryMap={categoryMap}
                  costCenterMap={costCenterMap}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
