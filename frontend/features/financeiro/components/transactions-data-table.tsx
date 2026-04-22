"use client";

import { memo, useCallback, useEffect, useRef } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  GripVertical,
} from "lucide-react";
import type {
  FinanceTransaction,
  FinanceSortColumn,
  FinanceSortDir,
} from "@/features/financeiro/services/finance-types";
import {
  useTransactionsTableLayout,
  type ColumnId,
  type ColumnLayout,
} from "../hooks/use-transactions-table-layout";
import { COLUMN_META, type CellContext } from "./transactions-column-meta";

const TYPE_ICONS = {
  receita: <ArrowUpCircle className="h-4 w-4 text-green-600" />,
  despesa: <ArrowDownCircle className="h-4 w-4 text-red-600" />,
  transferencia: <ArrowLeftRight className="h-4 w-4 text-blue-600" />,
} as const;

/* ─── Sortable/Resizable Header ──────────────────────────────── */

function ColumnHeader({
  column,
  sortBy,
  sortDir,
  onSortChange,
  onResize,
}: {
  column: ColumnLayout;
  sortBy: FinanceSortColumn;
  sortDir: FinanceSortDir;
  onSortChange: (column: FinanceSortColumn) => void;
  onResize: (id: ColumnId, width: number) => void;
}) {
  const meta = COLUMN_META[column.id];
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    width: column.width,
    minWidth: column.width,
    maxWidth: column.width,
    opacity: isDragging ? 0.4 : 1,
    position: "relative" as const,
  };

  const active = meta.sortable && sortBy === meta.sortable;
  const SortIcon = active
    ? sortDir === "asc"
      ? ArrowUp
      : ArrowDown
    : ChevronsUpDown;

  // Resize handle via mouse events
  const startX = useRef(0);
  const startWidth = useRef(0);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const delta = e.clientX - startX.current;
      onResize(column.id, startWidth.current + delta);
    },
    [column.id, onResize],
  );

  const handleMouseUp = useCallback(() => {
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseMove]);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      startX.current = e.clientX;
      startWidth.current = column.width;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [column.width, handleMouseMove, handleMouseUp],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <TableHead ref={setNodeRef} style={style} className="group/col p-0">
      <div className="flex items-center h-10 px-2 gap-1">
        {/* Drag handle (grabs the whole column) */}
        <button
          type="button"
          aria-label="Reordenar coluna"
          className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3 w-3" />
        </button>

        {/* Label + sort trigger */}
        {meta.sortable ? (
          <button
            type="button"
            onClick={() => onSortChange(meta.sortable!)}
            className={`inline-flex items-center gap-1 hover:text-foreground transition-colors flex-1 min-w-0 ${
              meta.align === "right" ? "flex-row-reverse justify-start" : ""
            } ${active ? "text-foreground font-semibold" : ""}`}
            aria-sort={
              active ? (sortDir === "asc" ? "ascending" : "descending") : "none"
            }
          >
            <span className="truncate">{meta.label}</span>
            <SortIcon
              className={`h-3 w-3 shrink-0 ${active ? "opacity-100" : "opacity-40"}`}
            />
          </button>
        ) : (
          <span
            className={`flex-1 min-w-0 truncate ${
              meta.align === "right" ? "text-right" : ""
            }`}
          >
            {meta.label}
          </span>
        )}
      </div>

      {/* Resize handle — posicionado na borda direita */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute top-0 right-0 h-full w-1 cursor-col-resize group-hover/col:bg-border hover:!bg-primary/60 active:!bg-primary transition-colors"
        role="separator"
        aria-label="Redimensionar coluna"
        aria-orientation="vertical"
      />
    </TableHead>
  );
}

/* ─── Row ───────────────────────────────────────────────────── */

const TransactionRow = memo(function TransactionRow({
  tx,
  columns,
  ctx,
  onEdit,
  onDelete,
}: {
  tx: FinanceTransaction;
  columns: ColumnLayout[];
  ctx: CellContext;
  onEdit: (tx: FinanceTransaction) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => onEdit(tx)}
    >
      <TableCell className="w-[40px]">{TYPE_ICONS[tx.type]}</TableCell>
      {columns.map((col) => {
        const meta = COLUMN_META[col.id];
        return (
          <TableCell
            key={col.id}
            style={{
              width: col.width,
              minWidth: col.width,
              maxWidth: col.width,
            }}
            className={`overflow-hidden ${meta.align === "right" ? "text-right" : ""}`}
          >
            {meta.renderCell(tx, ctx)}
          </TableCell>
        );
      })}
      <TableCell className="w-[50px]">
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

/* ─── Main ──────────────────────────────────────────────────── */

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
  const { layout, reorderColumn, resizeColumn, resetLayout } =
    useTransactionsTableLayout();

  // Evita drag disparar em cliques rápidos (sort/resize)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      reorderColumn(active.id as ColumnId, over.id as ColumnId);
    },
    [reorderColumn],
  );

  const ctx: CellContext = { categoryMap, costCenterMap };
  const colCount = layout.length + 2; // +type icon + actions

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-center justify-end px-3 py-1.5 text-xs text-muted-foreground border-b">
          <button
            type="button"
            onClick={resetLayout}
            className="hover:text-foreground transition-colors"
          >
            Redefinir colunas
          </button>
        </div>

        <div className="overflow-x-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToHorizontalAxis]}
            onDragEnd={handleDragEnd}
          >
            <Table style={{ tableLayout: "fixed", width: "auto", minWidth: "100%" }}>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]" />
                  <SortableContext
                    items={layout.map((c) => c.id)}
                    strategy={horizontalListSortingStrategy}
                  >
                    {layout.map((col) => (
                      <ColumnHeader
                        key={col.id}
                        column={col}
                        sortBy={sortBy}
                        sortDir={sortDir}
                        onSortChange={onSortChange}
                        onResize={resizeColumn}
                      />
                    ))}
                  </SortableContext>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: colCount }).map((__, j) => (
                        <TableCell key={j}>
                          <div className="h-4 w-full animate-pulse rounded bg-muted" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={colCount} className="h-32 text-center">
                      <p className="text-muted-foreground">
                        Nenhuma transacao encontrada.
                      </p>
                      <Button variant="link" className="mt-2" onClick={onNew}>
                        Criar primeira transacao
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TransactionRow
                      key={tx.id}
                      tx={tx}
                      columns={layout}
                      ctx={ctx}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
      </CardContent>
    </Card>
  );
}
