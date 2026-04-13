"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { ProposalItemDraft } from "./proposal-items-editor";

interface Props {
  items: ProposalItemDraft[];
  urgencyFlag: boolean;
  packageDiscountPct: number; // 0, 5, or 8
  cashDiscountPct: number;    // e.g. 5
  urgencyMultiplier: number;
  onUrgencyChange: (v: boolean) => void;
  onPackageDiscountPctChange: (pct: number) => void;
}

function fmt(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtPct(n: number) {
  return `${n.toFixed(1).replace(".", ",")}%`;
}

export function ProposalSummaryCard({
  items,
  urgencyFlag,
  packageDiscountPct,
  cashDiscountPct,
  urgencyMultiplier,
  onUrgencyChange,
  onPackageDiscountPctChange,
}: Props) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price * (1 - item.discount_pct / 100),
    0,
  );

  const packageDiscount = packageDiscountPct > 0 ? subtotal * (packageDiscountPct / 100) : 0;
  const afterDiscount = subtotal - packageDiscount;
  const total = urgencyFlag ? afterDiscount * urgencyMultiplier : afterDiscount;
  const urgencyAdd = urgencyFlag ? afterDiscount * (urgencyMultiplier - 1) : 0;

  // Payment conditions
  const cashTotal = total * (1 - cashDiscountPct / 100);
  const installment2x = total / 2;

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Resumo Financeiro
      </p>

      {/* Flags */}
      <div className="flex gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <Switch
            id="urgency"
            checked={urgencyFlag}
            onCheckedChange={onUrgencyChange}
          />
          <Label htmlFor="urgency" className="text-sm cursor-pointer">
            Urgência
            <span className="ml-1 text-xs text-amber-600 font-medium">
              (+{fmtPct((urgencyMultiplier - 1) * 100)})
            </span>
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="pkg5"
            checked={packageDiscountPct === 5}
            onCheckedChange={(v) => onPackageDiscountPctChange(v ? 5 : 0)}
          />
          <Label htmlFor="pkg5" className="text-sm cursor-pointer">
            Pacote 5%
            <span className="ml-1 text-xs text-emerald-600 font-medium">
              (−5,0%)
            </span>
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="pkg8"
            checked={packageDiscountPct === 8}
            onCheckedChange={(v) => onPackageDiscountPctChange(v ? 8 : 0)}
          />
          <Label htmlFor="pkg8" className="text-sm cursor-pointer">
            Pacote 8%
            <span className="ml-1 text-xs text-emerald-600 font-medium">
              (−8,0%)
            </span>
          </Label>
        </div>
      </div>

      <Separator />

      {/* Values */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal ({items.length} {items.length === 1 ? "item" : "itens"})</span>
          <span>{fmt(subtotal)}</span>
        </div>
        {packageDiscountPct > 0 && packageDiscount > 0 && (
          <div className="flex justify-between text-emerald-600">
            <span>Desconto pacote (−{fmtPct(packageDiscountPct)})</span>
            <span>−{fmt(packageDiscount)}</span>
          </div>
        )}
        {urgencyFlag && urgencyAdd > 0 && (
          <div className="flex justify-between text-amber-600">
            <span>Adicional urgência (+{fmtPct((urgencyMultiplier - 1) * 100)})</span>
            <span>+{fmt(urgencyAdd)}</span>
          </div>
        )}
        <Separator />
        <div className="flex justify-between font-semibold text-base">
          <span>Total da proposta</span>
          <span className="text-primary">{fmt(total)}</span>
        </div>
      </div>

      {/* Payment conditions */}
      {total > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Condições de Pagamento
            </p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  À vista
                  <span className="ml-1 text-xs text-emerald-600 font-medium">
                    (−{fmtPct(cashDiscountPct)})
                  </span>
                </span>
                <span className="font-medium text-emerald-600">{fmt(cashTotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Parcelado 2x</span>
                <span className="font-medium">2x de {fmt(installment2x)}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
