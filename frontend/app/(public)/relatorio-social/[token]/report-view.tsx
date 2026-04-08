"use client";

import { useState } from "react";
import {
  IconBrandInstagram,
  IconCalendar,
  IconCalendarStats,
  IconLock,
  IconDownload,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThalMonthlyView } from "@/features/marketing/components/social-reports/thal-monthly-view";
import { ThalSemesterView } from "@/features/marketing/components/social-reports/thal-semester-view";

type Period = "30d" | "6m";

interface ReportViewProps {
  clientName: string;
  handle: string;
  platform: string;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  reportData: Record<string, unknown>;
  accessPassword: string | null;
}

export function ReportView({
  clientName,
  handle,
  platform,
  periodLabel,
  periodStart,
  periodEnd,
  reportData,
  accessPassword,
}: ReportViewProps) {
  const [period, setPeriod] = useState<Period>("30d");
  const [unlocked, setUnlocked] = useState(!accessPassword);
  const [passwordInput, setPasswordInput] = useState("");
  const [error, setError] = useState(false);

  if (!unlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <IconLock className="size-7 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Relatório protegido</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Digite a senha para acessar o relatório de {clientName}.
            </p>
          </div>
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Senha de acesso"
              value={passwordInput}
              onChange={(e) => { setPasswordInput(e.target.value); setError(false); }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (passwordInput === accessPassword) setUnlocked(true);
                  else setError(true);
                }
              }}
              className={error ? "border-red-500" : ""}
            />
            {error && <p className="text-xs text-red-500">Senha incorreta.</p>}
            <Button
              className="w-full"
              onClick={() => {
                if (passwordInput === accessPassword) setUnlocked(true);
                else setError(true);
              }}
            >
              Acessar relatório
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Extract data sections from reportData JSONB
  const monthly = reportData.monthly as Record<string, unknown> | undefined;
  const semester = reportData.semester as Record<string, unknown> | undefined;
  const audience = reportData.audience as Record<string, unknown> | undefined;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 p-2.5">
            <IconBrandInstagram className="size-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{clientName}</h1>
            <p className="text-sm text-muted-foreground">
              {handle} · Instagram Business
            </p>
            <div className="flex items-center gap-2 mt-1">
              {periodLabel && (
                <Badge variant="outline" className="text-[10px]">{periodLabel}</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="print:hidden"
            onClick={() => window.print()}
          >
            <IconDownload className="size-4 mr-1.5" />
            Baixar PDF
          </Button>

          <div className="flex items-center rounded-lg border overflow-hidden print:hidden">
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

      {/* Period info */}
      {(periodStart || periodEnd) && (
        <p className="text-xs text-muted-foreground">
          Período: {periodStart} a {periodEnd}
        </p>
      )}

      {/* Views — pass data from JSONB if available, otherwise defaults */}
      {period === "30d" ? (
        <ThalMonthlyView
          monthlySummary={monthly?.summary as typeof import("@/features/marketing/data/thal-instagram-report").MONTHLY_SUMMARY | undefined}
          monthlyFeed={monthly?.feed as typeof import("@/features/marketing/data/thal-instagram-report").MONTHLY_FEED | undefined}
          monthlyReels={monthly?.reels as typeof import("@/features/marketing/data/thal-instagram-report").MONTHLY_REELS | undefined}
          monthlyStories={monthly?.stories as typeof import("@/features/marketing/data/thal-instagram-report").MONTHLY_STORIES | undefined}
          audience={audience as typeof import("@/features/marketing/data/thal-instagram-report").AUDIENCE | undefined}
        />
      ) : (
        <ThalSemesterView
          semesterSummary={semester?.summary as typeof import("@/features/marketing/data/thal-instagram-report").SEMESTER_SUMMARY | undefined}
          semesterFeed={semester?.feed as typeof import("@/features/marketing/data/thal-instagram-report").SEMESTER_FEED | undefined}
          semesterReels={semester?.reels as typeof import("@/features/marketing/data/thal-instagram-report").SEMESTER_REELS | undefined}
          semesterStories={semester?.stories as typeof import("@/features/marketing/data/thal-instagram-report").SEMESTER_STORIES | undefined}
          semesterComparison={semester?.comparison as typeof import("@/features/marketing/data/thal-instagram-report").SEMESTER_COMPARISON | undefined}
        />
      )}

      {/* Footer */}
      <div className="border-t pt-6 text-center space-y-1">
        <p className="text-xs text-muted-foreground">
          Relatório produzido por TBO — think, build, own
        </p>
        <p className="text-[10px] text-muted-foreground/60">
          wearetbo.com.br
        </p>
      </div>
    </div>
  );
}
