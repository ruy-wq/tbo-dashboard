"use client";

import { useState } from "react";
import Link from "next/link";
import {
  IconBrandInstagram,
  IconArrowLeft,
  IconCalendar,
  IconCalendarStats,
  IconShare,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RequireRole } from "@/features/auth/components/require-role";
import { ThalMonthlyView } from "@/features/marketing/components/social-reports/thal-monthly-view";
import { ThalSemesterView } from "@/features/marketing/components/social-reports/thal-semester-view";
import { ShareReportDialog } from "@/features/marketing/components/social-reports/share-report-dialog";
import {
  THAL_REPORT,
  MONTHLY_SUMMARY,
  MONTHLY_FEED,
  MONTHLY_REELS,
  MONTHLY_STORIES,
  AUDIENCE,
  SEMESTER_SUMMARY,
  SEMESTER_FEED,
  SEMESTER_REELS,
  SEMESTER_STORIES,
  SEMESTER_COMPARISON,
} from "@/features/marketing/data/thal-instagram-report";

type Period = "30d" | "6m";

function ThalDashboardContent() {
  const [period, setPeriod] = useState<Period>("30d");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <Link
            href="/marketing/redes-sociais/relatorios"
            className="mt-1 rounded-lg border p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <IconArrowLeft className="size-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 p-2">
                <IconBrandInstagram className="size-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Thal Engenharia</h1>
                <p className="text-sm text-muted-foreground">
                  @thal_engenharia · Instagram Business
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-[10px]">
                5.172 seguidores
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                Abril 2026
              </Badge>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <ShareReportDialog
            clientName={THAL_REPORT.client}
            handle={THAL_REPORT.handle}
            platform={THAL_REPORT.platform}
            periodLabel="Abril 2026"
            periodStart="2026-03-08"
            periodEnd="2026-04-06"
            reportData={{
              monthly: {
                summary: MONTHLY_SUMMARY,
                feed: MONTHLY_FEED,
                reels: MONTHLY_REELS,
                stories: MONTHLY_STORIES,
              },
              semester: {
                summary: SEMESTER_SUMMARY,
                feed: SEMESTER_FEED,
                reels: SEMESTER_REELS,
                stories: SEMESTER_STORIES,
                comparison: SEMESTER_COMPARISON,
              },
              audience: AUDIENCE,
            }}
          >
            <Button variant="outline" size="sm">
              <IconShare className="size-4 mr-1.5" />
              Compartilhar
            </Button>
          </ShareReportDialog>

          {/* Period Tabs */}
          <div className="flex items-center rounded-lg border overflow-hidden">
          <button
            onClick={() => setPeriod("30d")}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
              period === "30d"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <IconCalendar className="size-4" />
            30 dias
          </button>
          <button
            onClick={() => setPeriod("6m")}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors border-l ${
              period === "6m"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <IconCalendarStats className="size-4" />
            Semestral
          </button>
          </div>
        </div>
      </div>

      {/* Period subtitle */}
      <p className="text-xs text-muted-foreground">
        {period === "30d"
          ? "Periodo: 08/03/2026 a 06/04/2026 · Comparativo: 06/02/2026 a 07/03/2026"
          : "Periodo: 06/10/2025 a 06/04/2026 · Comparativo: 06/04/2025 a 05/10/2025"}
      </p>

      {/* Views */}
      {period === "30d" ? <ThalMonthlyView /> : <ThalSemesterView />}

      {/* Footer */}
      <div className="border-t pt-4 text-center">
        <p className="text-xs text-muted-foreground">
          Relatorio produzido por TBO — think, build, own
        </p>
      </div>
    </div>
  );
}

export default function ThalReportPage() {
  return (
    <RequireRole module="marketing">
      <ThalDashboardContent />
    </RequireRole>
  );
}
