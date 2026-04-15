"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

interface TransactionsSummaryCardsProps {
  receitas: number;
  despesas: number;
  saldo: number;
}

export function TransactionsSummaryCards({
  receitas,
  despesas,
  saldo,
}: TransactionsSummaryCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Receitas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xl font-bold text-green-600">
            {formatBRL(receitas)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Despesas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xl font-bold text-red-600">
            {formatBRL(despesas)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Saldo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p
            className={`text-xl font-bold ${saldo >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {formatBRL(saldo)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
