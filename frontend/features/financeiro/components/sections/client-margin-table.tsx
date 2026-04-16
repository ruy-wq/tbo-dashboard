"use client";

import { IconUsers } from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { FounderDashboardSnapshot } from "@/features/founder-dashboard/services/founder-dashboard";
import { fmt, fmtPct } from "@/features/financeiro/lib/formatters";

type ClientMargin = FounderDashboardSnapshot["clientMargins"][number];

interface Props {
  clientMargins: ClientMargin[];
}

export function ClientMarginTable({ clientMargins }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <IconUsers className="h-4 w-4 text-muted-foreground" />
          Margem por Cliente (Top 10)
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Receita vs custos diretos atribuídos via projetos no período
        </p>
      </CardHeader>
      <CardContent>
        {clientMargins.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <IconUsers className="size-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma margem por cliente no período</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Ajuste o período ou sincronize os dados do OMIE</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-xs text-muted-foreground">
                  <TableHead className="font-medium">Cliente</TableHead>
                  <TableHead className="text-right font-medium">Receita</TableHead>
                  <TableHead className="text-right font-medium">Custos</TableHead>
                  <TableHead className="text-right font-medium">Margem</TableHead>
                  <TableHead className="text-right font-medium">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientMargins.map((cm) => (
                  <TableRow
                    key={cm.client}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <TableCell className="font-medium truncate max-w-[200px]">
                      {cm.client}
                    </TableCell>
                    <TableCell className="text-right text-emerald-600">
                      {fmt(cm.receita)}
                    </TableCell>
                    <TableCell className="text-right text-rose-500">
                      {fmt(cm.custos)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        cm.margem >= 0 ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {fmt(cm.margem)}
                    </TableCell>
                    <TableCell
                      className={`text-right ${
                        cm.margemPct >= 30
                          ? "text-emerald-600"
                          : cm.margemPct >= 15
                            ? "text-amber-600"
                            : "text-red-600"
                      }`}
                    >
                      {fmtPct(cm.margemPct)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
