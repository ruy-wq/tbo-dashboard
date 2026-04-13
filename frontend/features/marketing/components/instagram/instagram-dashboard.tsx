"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  IconBrandInstagram,
  IconRefresh,
  IconChevronDown,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared";
import { toast } from "sonner";
import {
  useInstagramAccounts,
  useInstagramInsightsWithComparison,
  useInstagramMedia,
  useInstagramTopMedia,
  useLatestInstagramInsight,
  useSyncInstagramAccount,
} from "../../hooks/use-instagram";
import type { InsightsPeriod } from "../../types/instagram";
import { InstagramConnectCard } from "./instagram-connect-card";
import { InstagramAccountCard } from "./instagram-account-card";
import { InstagramKPICards } from "./instagram-kpi-cards";
import { InstagramInsightsChart } from "./instagram-insights-chart";
import { InstagramMediaGrid } from "./instagram-media-grid";
import { InstagramAudience } from "./instagram-audience";
import { InstagramTopPosts } from "./instagram-top-posts";

const PERIODS: { value: InsightsPeriod; label: string }[] = [
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
];

export function InstagramDashboard() {
  const searchParams = useSearchParams();
  const { data: accounts, isLoading: accountsLoading } = useInstagramAccounts();
  const syncMutation = useSyncInstagramAccount();

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [period, setPeriod] = useState<InsightsPeriod>("30d");

  // Handle OAuth redirect params
  useEffect(() => {
    const connected = searchParams.get("connected");
    const fbUser = searchParams.get("fb_user");
    const oauthError = searchParams.get("oauth_error");

    if (connected) {
      toast.success(`${connected} conta(s) Instagram conectada(s) via ${fbUser || "Meta"}!`);
      // Clean URL params
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (oauthError) {
      toast.error(`Erro OAuth: ${oauthError}`);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams]);

  // Auto-select first account
  const activeAccounts = accounts?.filter((a) => a.is_active) ?? [];
  useEffect(() => {
    if (activeAccounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(activeAccounts[0].id);
    }
  }, [activeAccounts, selectedAccountId]);

  // Data hooks for selected account
  const {
    current: currentInsights,
    previous: previousInsights,
    isLoading: insightsLoading,
  } = useInstagramInsightsWithComparison(selectedAccountId, period);

  const { data: latestInsight } = useLatestInstagramInsight(selectedAccountId);

  const { data: media, isLoading: mediaLoading } = useInstagramMedia(
    selectedAccountId,
    { limit: 24 }
  );

  const { data: topMedia, isLoading: topMediaLoading } = useInstagramTopMedia(
    selectedAccountId,
    "reach",
    8
  );

  const selectedAccount = activeAccounts.find((a) => a.id === selectedAccountId);

  function handleSync(accountId: string) {
    syncMutation.mutate({ accountId, days: 30 });
  }

  // Loading state
  if (accountsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[180px] rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </div>
    );
  }

  // No accounts connected
  if (activeAccounts.length === 0) {
    return (
      <div className="space-y-6">
        <EmptyState
          icon={IconBrandInstagram}
          title="Nenhuma conta Instagram conectada"
          description="Conecte contas Instagram Business da TBO e dos clientes para visualizar metricas, insights e gerenciar conteudo diretamente do TBO OS."
        />
        <div className="max-w-xs mx-auto">
          <InstagramConnectCard />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Account selector */}
      <div className="flex items-start gap-4 overflow-x-auto pb-2">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 flex-1">
          {activeAccounts.map((account) => (
            <InstagramAccountCard
              key={account.id}
              account={account}
              isSelected={account.id === selectedAccountId}
              onSelect={() => setSelectedAccountId(account.id)}
              onSync={() => handleSync(account.id)}
              onDisconnect={() => {
                // Will be handled by the hook
              }}
              isSyncing={
                syncMutation.isPending &&
                syncMutation.variables?.accountId === account.id
              }
            />
          ))}
          <InstagramConnectCard />
        </div>
      </div>

      {/* Period selector + sync button */}
      {selectedAccount && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <IconBrandInstagram className="size-5 text-pink-500" />
              @{selectedAccount.username}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border overflow-hidden">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    period === p.value
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  } ${p.value !== "7d" ? "border-l" : ""}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSync(selectedAccountId!)}
              disabled={syncMutation.isPending}
            >
              <IconRefresh
                className={`size-4 mr-1.5 ${syncMutation.isPending ? "animate-spin" : ""}`}
              />
              Sincronizar
            </Button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <InstagramKPICards
        current={currentInsights}
        previous={previousInsights}
        isLoading={insightsLoading}
      />

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <InstagramInsightsChart
            insights={currentInsights}
            isLoading={insightsLoading}
          />
        </div>
        <InstagramTopPosts
          media={topMedia ?? []}
          isLoading={topMediaLoading}
        />
      </div>

      {/* Audience demographics */}
      <InstagramAudience
        audience={latestInsight?.audience_data ?? null}
        isLoading={!latestInsight && insightsLoading}
      />

      {/* Media Grid */}
      <InstagramMediaGrid
        media={media ?? []}
        isLoading={mediaLoading}
      />
    </div>
  );
}
