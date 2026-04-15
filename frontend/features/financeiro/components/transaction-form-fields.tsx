"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
  FieldErrors,
} from "react-hook-form";
import type { CreateTransactionInput } from "@/features/financeiro/services/finance-schemas";
import type { FinanceCategory, FinanceCostCenter } from "@/features/financeiro/services/finance-types";
import { BU_OPTIONS, STATUS_OPTIONS, PAYMENT_METHODS } from "./transaction-form-constants";

interface TransactionFormFieldsProps {
  register: UseFormRegister<CreateTransactionInput>;
  watch: UseFormWatch<CreateTransactionInput>;
  setValue: UseFormSetValue<CreateTransactionInput>;
  errors: FieldErrors<CreateTransactionInput>;
  filteredCategories: FinanceCategory[];
  costCenters: FinanceCostCenter[];
}

export function TransactionFormFields({
  register,
  watch,
  setValue,
  errors,
  filteredCategories,
  costCenters,
}: TransactionFormFieldsProps) {
  const typeValue = watch("type");
  const statusValue = watch("status");

  return (
    <>
      {/* Type + Status */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Tipo</Label>
          <Select
            value={typeValue}
            onValueChange={(v) =>
              setValue(
                "type",
                v as "receita" | "despesa" | "transferencia"
              )
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="receita">Receita</SelectItem>
              <SelectItem value="despesa">Despesa</SelectItem>
              <SelectItem value="transferencia">Transferencia</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select
            value={statusValue}
            onValueChange={(v) =>
              setValue("status", v as CreateTransactionInput["status"])
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label>Descricao</Label>
        <Input
          {...register("description")}
          placeholder="Ex: Fatura Google Ads marco"
        />
        {errors.description && (
          <p className="text-xs text-red-500">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Amount + Paid Amount */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Valor (R$)</Label>
          <Input
            type="number"
            step="0.01"
            {...register("amount", { valueAsNumber: true })}
            placeholder="0,00"
          />
          {errors.amount && (
            <p className="text-xs text-red-500">{errors.amount.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Valor Pago (R$)</Label>
          <Input
            type="number"
            step="0.01"
            {...register("paid_amount", { valueAsNumber: true })}
            placeholder="0,00"
          />
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>Data</Label>
          <Input type="date" {...register("date")} />
          {errors.date && (
            <p className="text-xs text-red-500">{errors.date.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Vencimento</Label>
          <Input type="date" {...register("due_date")} />
        </div>
        <div className="space-y-1.5">
          <Label>Data Pgto</Label>
          <Input type="date" {...register("paid_date")} />
        </div>
      </div>

      {/* Counterpart + Doc */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Contraparte</Label>
          <Input
            {...register("counterpart")}
            placeholder="Nome da empresa/pessoa"
          />
        </div>
        <div className="space-y-1.5">
          <Label>CNPJ/CPF</Label>
          <Input
            {...register("counterpart_doc")}
            placeholder="00.000.000/0001-00"
          />
        </div>
      </div>

      {/* Category + Cost Center */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Categoria</Label>
          <Select
            value={watch("category_id") ?? "none"}
            onValueChange={(v) =>
              setValue("category_id", v === "none" ? null : v)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecionar..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhuma</SelectItem>
              {filteredCategories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Centro de Custo</Label>
          <Select
            value={watch("cost_center_id") ?? "none"}
            onValueChange={(v) =>
              setValue("cost_center_id", v === "none" ? null : v)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecionar..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum</SelectItem>
              {costCenters.map((cc) => (
                <SelectItem key={cc.id} value={cc.id}>
                  {cc.code} - {cc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Business Unit + Payment Method */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Unidade de Negocio</Label>
          <Select
            value={watch("business_unit") ?? "none"}
            onValueChange={(v) =>
              setValue(
                "business_unit",
                v === "none"
                  ? null
                  : (v as CreateTransactionInput["business_unit"])
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecionar..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhuma</SelectItem>
              {BU_OPTIONS.map((bu) => (
                <SelectItem key={bu} value={bu}>
                  {bu}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Forma de Pagamento</Label>
          <Select
            value={watch("payment_method") ?? "none"}
            onValueChange={(v) =>
              setValue("payment_method", v === "none" ? null : v)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecionar..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhuma</SelectItem>
              {PAYMENT_METHODS.map((pm) => (
                <SelectItem key={pm} value={pm}>
                  {pm}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label>Notas</Label>
        <Textarea
          {...register("notes")}
          rows={2}
          placeholder="Observacoes (opcional)"
        />
      </div>
    </>
  );
}
