"use client";

import { useState, useMemo, useCallback } from "react";
import { RBACGuard } from "@/components/rbac-guard";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import {
  useFinanceTransactions,
  useDeleteTransaction,
  useFinanceCategories,
  useFinanceCostCenters,
  useFinanceChartData,
  useBulkAutoCategorize,
} from "@/features/financeiro/hooks/use-finance";
import { TransactionForm } from "@/features/financeiro/components/transaction-form";
import { TransactionsSummaryCards } from "@/features/financeiro/components/transactions-summary-cards";
import { TransactionsFilterBar, PERIOD_OPTIONS } from "@/features/financeiro/components/transactions-filter-bar";
import { TransactionsDataTable } from "@/features/financeiro/components/transactions-data-table";
import type {
  FinanceTransaction,
  FinanceFilters,
  FinanceSortColumn,
  FinanceSortDir,
} from "@/features/financeiro/services/finance-types";

const fmtDate = (d: string | null) => d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "\u2014";
const PAGE_SIZE = 25;

export default function TransacoesPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("year");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<FinanceSortColumn>("date");
  const [sortDir, setSortDir] = useState<FinanceSortDir>("desc");
  const [formOpen, setFormOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<FinanceTransaction | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const period = PERIOD_OPTIONS.find((p) => p.value === periodFilter) ?? PERIOD_OPTIONS[0];

  const filters: FinanceFilters = useMemo(
    () => ({
      ...(typeFilter !== "all" && { type: typeFilter as FinanceFilters["type"] }),
      ...(statusFilter !== "all" && { status: statusFilter }),
      ...(search.trim() && { search: search.trim() }),
      ...(period.from && { dateFrom: period.from }),
      ...(period.to && { dateTo: period.to }),
      page,
      pageSize: PAGE_SIZE,
      sortBy,
      sortDir,
    }),
    [typeFilter, statusFilter, search, period.from, period.to, page, sortBy, sortDir]
  );

  const handleSortChange = useCallback((column: FinanceSortColumn) => {
    setSortBy((current) => {
      if (current === column) {
        // Mesma coluna — alterna direção
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return current;
      }
      // Coluna nova — reset para desc (padrão mais útil em finance)
      setSortDir("desc");
      return column;
    });
    setPage(1);
  }, []);

  const { data, isLoading, isError, error, refetch } = useFinanceTransactions(filters);
  const { data: categories = [] } = useFinanceCategories();
  const { data: costCenters = [] } = useFinanceCostCenters();
  const { mutate: deleteTx, isPending: deleting } = useDeleteTransaction();
  const { mutate: bulkCategorize, isPending: bulkPending } = useBulkAutoCategorize();

  const transactions = data?.data ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories) map.set(c.id, c.name);
    return map;
  }, [categories]);

  const costCenterMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const cc of costCenters) map.set(cc.id, `${cc.code} - ${cc.name}`);
    return map;
  }, [costCenters]);

  const handleEdit = useCallback((tx: FinanceTransaction) => {
    setEditingTx(tx);
    setFormOpen(true);
  }, []);

  const handleNew = useCallback(() => {
    setEditingTx(null);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback(() => {
    if (!deleteId) return;
    deleteTx(deleteId, {
      onSuccess: () => {
        toast.success("Transacao excluida.");
        setDeleteId(null);
      },
      onError: (e) => toast.error(e.message),
    });
  }, [deleteId, deleteTx]);

  const chartFilters = useMemo(
    () => ({
      ...(typeFilter !== "all" && { type: typeFilter as FinanceFilters["type"] }),
      ...(statusFilter !== "all" && { status: statusFilter }),
      ...(period.from && { dateFrom: period.from }),
      ...(period.to && { dateTo: period.to }),
    }),
    [typeFilter, statusFilter, period.from, period.to]
  );
  const { data: allTx = [] } = useFinanceChartData(chartFilters);

  const uncategorizedCount = useMemo(
    () => allTx.filter((t) => !t.category_id || !t.cost_center_id).length,
    [allTx]
  );

  const handleBulkCategorize = useCallback(() => {
    const txToProcess = allTx
      .filter((t) => !t.category_id || !t.cost_center_id)
      .map((t) => ({
        id: t.id,
        description: t.description,
        type: t.type,
        counterpart: t.counterpart ?? null,
        business_unit: t.business_unit ?? null,
        category_id: t.category_id ?? null,
        cost_center_id: t.cost_center_id ?? null,
      }));

    if (txToProcess.length === 0) {
      toast.info("Todas as transacoes ja estao categorizadas.");
      return;
    }

    bulkCategorize(
      { transactions: txToProcess, categories, costCenters },
      {
        onSuccess: (result) => {
          if (result.updated === 0) {
            toast.info("Nenhuma transacao pode ser categorizada automaticamente.");
          } else {
            toast.success(`${result.updated} transacao(oes) categorizada(s) automaticamente.`);
          }
        },
        onError: (e) => toast.error(e.message),
      }
    );
  }, [allTx, categories, costCenters, bulkCategorize]);

  const handleExportCSV = useCallback(() => {
    const q = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const hdr = "Data;Tipo;Status;Descricao;Contraparte;Valor;Valor Pago;Vencimento;Categoria;Centro de Custo;BU";
    const rows = allTx.map((tx) =>
      [fmtDate(tx.date), tx.type, tx.status, q(tx.description ?? ""), q(tx.counterpart ?? ""),
       String(tx.amount ?? 0).replace(".", ","), String(tx.paid_amount ?? 0).replace(".", ","),
       fmtDate(tx.due_date), q(categoryMap.get(tx.category_id ?? "") ?? ""),
       q(costCenterMap.get(tx.cost_center_id ?? "") ?? ""), q(tx.business_unit ?? "")].join(";")
    );
    const blob = new Blob(["\uFEFF" + hdr + "\n" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement("a"), { href: url, download: `transacoes_${new Date().toISOString().slice(0, 10)}.csv` }).click();
    URL.revokeObjectURL(url);
  }, [allTx, categoryMap, costCenterMap]);

  const summary = useMemo(() => {
    const receitas = allTx
      .filter((t) => t.type === "receita")
      .reduce((s, t) => s + Number(t.amount), 0);
    const despesas = allTx
      .filter((t) => t.type === "despesa")
      .reduce((s, t) => s + Number(t.amount), 0);
    return { receitas, despesas, saldo: receitas - despesas };
  }, [allTx]);

  return (
    <RBACGuard minRole="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Transacoes</h1>
            <p className="text-muted-foreground text-sm">
              {totalCount} transacoes encontradas
            </p>
          </div>
          <TransactionsFilterBar
            periodFilter={periodFilter}
            setPeriodFilter={setPeriodFilter}
            search={search}
            setSearch={setSearch}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            setPage={setPage}
            uncategorizedCount={uncategorizedCount}
            bulkPending={bulkPending}
            onBulkCategorize={handleBulkCategorize}
            allTxCount={allTx.length}
            onExportCSV={handleExportCSV}
            onNew={handleNew}
          />
        </div>

        <TransactionsSummaryCards
          receitas={summary.receitas}
          despesas={summary.despesas}
          saldo={summary.saldo}
        />

        {/* Error State */}
        {isError && (
          <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950 p-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-red-700 dark:text-red-300">Erro ao carregar transacoes</p>
              <p className="text-xs text-red-600/70 dark:text-red-400/70">
                {error instanceof Error ? error.message : "Verifique a conexao e tente novamente."}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Tentar novamente
            </Button>
          </div>
        )}

        <TransactionsDataTable
          transactions={transactions}
          isLoading={isLoading}
          categoryMap={categoryMap}
          costCenterMap={costCenterMap}
          onEdit={handleEdit}
          onDelete={setDeleteId}
          onNew={handleNew}
          sortBy={sortBy}
          sortDir={sortDir}
          onSortChange={handleSortChange}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Pagina {page} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <TransactionForm
          open={formOpen}
          onOpenChange={setFormOpen}
          editingTransaction={editingTx}
        />

        <AlertDialog
          open={!!deleteId}
          onOpenChange={(open) => !open && setDeleteId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir transacao?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acao nao pode ser desfeita. A transacao sera removida permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleting ? "Excluindo..." : "Excluir"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </RBACGuard>
  );
}
