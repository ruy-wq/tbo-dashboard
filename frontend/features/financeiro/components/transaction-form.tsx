"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  createTransactionSchema,
  type CreateTransactionInput,
} from "@/features/financeiro/services/finance-schemas";
import {
  useCreateTransaction,
  useUpdateTransaction,
  useFinanceCategories,
  useFinanceCostCenters,
} from "@/features/financeiro/hooks/use-finance";
import type { FinanceTransaction } from "@/features/financeiro/services/finance-types";
import { autoCategorize, type AutoCategorizeResult } from "@/features/financeiro/services/auto-categorize";
import { AutoCategorizeBanner } from "./auto-categorize-banner";
import { TransactionFormFields } from "./transaction-form-fields";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTransaction: FinanceTransaction | null;
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export function TransactionForm({
  open,
  onOpenChange,
  editingTransaction,
}: Props) {
  const { mutate: create, isPending: creating } = useCreateTransaction();
  const { mutate: update, isPending: updating } = useUpdateTransaction();
  const { data: categories = [] } = useFinanceCategories();
  const { data: costCenters = [] } = useFinanceCostCenters();
  const isPending = creating || updating;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateTransactionInput>({
    resolver: zodResolver(createTransactionSchema) as Resolver<CreateTransactionInput>,
    defaultValues: {
      type: "despesa",
      status: "previsto",
      description: "",
      amount: 0,
      paid_amount: 0,
      date: todayStr(),
      due_date: null,
      paid_date: null,
      category_id: null,
      cost_center_id: null,
      counterpart: null,
      payment_method: null,
      business_unit: null,
      notes: null,
    },
  });

  useEffect(() => {
    if (open && editingTransaction) {
      reset({
        type: editingTransaction.type,
        status: editingTransaction.status,
        description: editingTransaction.description,
        amount: Number(editingTransaction.amount),
        paid_amount: Number(editingTransaction.paid_amount),
        date: editingTransaction.date,
        due_date: editingTransaction.due_date,
        paid_date: editingTransaction.paid_date,
        category_id: editingTransaction.category_id,
        cost_center_id: editingTransaction.cost_center_id,
        project_id: editingTransaction.project_id,
        counterpart: editingTransaction.counterpart,
        counterpart_doc: editingTransaction.counterpart_doc,
        payment_method: editingTransaction.payment_method,
        bank_account: editingTransaction.bank_account,
        business_unit: editingTransaction.business_unit as CreateTransactionInput["business_unit"],
        tags: editingTransaction.tags ?? [],
        notes: editingTransaction.notes,
        contract_id: editingTransaction.contract_id,
      });
    } else if (open) {
      reset({
        type: "despesa",
        status: "previsto",
        description: "",
        amount: 0,
        paid_amount: 0,
        date: todayStr(),
        due_date: null,
        paid_date: null,
        category_id: null,
        cost_center_id: null,
        counterpart: null,
        payment_method: null,
        business_unit: null,
        notes: null,
      });
    }
  }, [open, editingTransaction, reset]);

  const typeValue = watch("type");
  const descriptionValue = watch("description");
  const counterpartValue = watch("counterpart");
  const buValue = watch("business_unit");
  const categoryValue = watch("category_id");
  const costCenterValue = watch("cost_center_id");

  const filteredCategories = categories.filter(
    (c) => c.type === typeValue || typeValue === "transferencia"
  );

  // Auto-categorization
  const [suggestion, setSuggestion] = useState<AutoCategorizeResult | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runAutoCategorize = useCallback(() => {
    if (!descriptionValue?.trim() || editingTransaction) {
      setSuggestion(null);
      return;
    }
    const result = autoCategorize(
      descriptionValue, typeValue, counterpartValue ?? null,
      buValue ?? null, categories, costCenters
    );
    if (result) {
      const hasCategorySuggestion = result.category_id && !categoryValue;
      const hasCCSuggestion = result.cost_center_id && !costCenterValue;
      if (hasCategorySuggestion || hasCCSuggestion) {
        setSuggestion(result);
        setDismissed(false);
        return;
      }
    }
    setSuggestion(null);
  }, [descriptionValue, typeValue, counterpartValue, buValue, categoryValue, costCenterValue, categories, costCenters, editingTransaction]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(runAutoCategorize, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [runAutoCategorize]);

  const acceptSuggestion = useCallback(() => {
    if (!suggestion) return;
    if (suggestion.category_id && !categoryValue) setValue("category_id", suggestion.category_id);
    if (suggestion.cost_center_id && !costCenterValue) setValue("cost_center_id", suggestion.cost_center_id);
    setSuggestion(null);
    toast.success("Categorizacao aplicada automaticamente.");
  }, [suggestion, categoryValue, costCenterValue, setValue]);

  const dismissSuggestion = useCallback(() => {
    setSuggestion(null);
    setDismissed(true);
  }, []);

  function onSubmit(data: CreateTransactionInput) {
    if (editingTransaction) {
      update(
        { id: editingTransaction.id, updates: data },
        {
          onSuccess: () => { toast.success("Transacao atualizada."); onOpenChange(false); },
          onError: (e) => toast.error(e.message),
        }
      );
    } else {
      create(data, {
        onSuccess: () => { toast.success("Transacao criada."); onOpenChange(false); },
        onError: (e) => toast.error(e.message),
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingTransaction ? "Editar Transacao" : "Nova Transacao"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <TransactionFormFields
            register={register}
            watch={watch}
            setValue={setValue}
            errors={errors}
            filteredCategories={filteredCategories}
            costCenters={costCenters}
          />

          {suggestion && !dismissed && (
            <AutoCategorizeBanner
              suggestion={suggestion}
              dismissed={dismissed}
              onAccept={acceptSuggestion}
              onDismiss={dismissSuggestion}
              categoryValue={categoryValue}
              costCenterValue={costCenterValue}
            />
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : editingTransaction ? "Salvar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
