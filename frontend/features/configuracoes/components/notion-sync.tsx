"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  IconRefresh,
  IconLoader2,
  IconDatabase,
  IconMessage,
  IconCircleCheck,
  IconAlertCircle,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  useNotionStatus,
  useNotionDisconnect,
  useNotionLastSync,
  type SyncMode,
} from "@/features/integrations/hooks/use-notion-integration";
import { SyncResultDisplay, NotionConnectionCard, type SyncResult, type SyncStatus } from "./notion-sync-result";
import { LastSyncBadge } from "./last-sync-badge";

const CLIENT_ID = (process.env.NEXT_PUBLIC_NOTION_CLIENT_ID ?? "").trim();
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "").trim();

function buildAuthUrl() {
  const redirectUri = `${APP_URL}/api/notion/callback`;
  return (
    `https://api.notion.com/v1/oauth/authorize` +
    `?client_id=${CLIENT_ID}` +
    `&response_type=code` +
    `&owner=user` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}`
  );
}

export function NotionSync() {
  const searchParams = useSearchParams();
  const notionParam = searchParams.get("notion");

  const { data: status, isLoading: statusLoading } = useNotionStatus();
  const disconnect = useNotionDisconnect();

  const [propStatus, setPropStatus] = useState<SyncStatus>("idle");
  const [propResult, setPropResult] = useState<SyncResult | null>(null);
  const [commentStatus, setCommentStatus] = useState<SyncStatus>("idle");
  const [commentResult, setCommentResult] = useState<SyncResult | null>(null);

  const [oauthBanner, setOauthBanner] = useState<"connected" | "error" | null>(null);
  useEffect(() => {
    if (notionParam === "connected") setOauthBanner("connected");
    else if (notionParam && notionParam !== "connected") setOauthBanner("error");
  }, [notionParam]);

  const qc = useQueryClient();
  const runSync = useCallback(
    async (mode: SyncMode) => {
      const setStatus = mode === "properties" ? setPropStatus : setCommentStatus;
      const setResult = mode === "properties" ? setPropResult : setCommentResult;

      setStatus("running");
      setResult(null);

      try {
        const params = new URLSearchParams({ mode });
        if (mode === "comments") params.set("limit", "100");

        const res = await fetch(`/api/notion/sync?${params}`);
        const data = await res.json();

        if (!res.ok) {
          setStatus("error");
          setResult({ mode, error: data.error ?? `HTTP ${res.status}` });
          return;
        }

        setStatus("success");
        setResult(data);
      } catch (err) {
        setStatus("error");
        setResult({ mode, error: err instanceof Error ? err.message : "Erro de rede" });
      } finally {
        qc.invalidateQueries({ queryKey: ["notion-last-sync", mode] });
      }
    },
    [qc],
  );

  const connected = status?.connected ?? false;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Notion</h2>
        <p className="text-sm text-gray-500">
          Sincronize dados de demandas do Notion com o dashboard.
        </p>
      </div>

      {oauthBanner === "connected" && (
        <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-3 dark:border-green-900 dark:bg-green-950/30">
          <IconCircleCheck className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
          <p className="text-sm text-green-700 dark:text-green-300">
            Workspace do Notion conectado com sucesso!
          </p>
        </div>
      )}
      {oauthBanner === "error" && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950/30">
          <IconAlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">
            Falha ao conectar com o Notion. Tente novamente.
          </p>
        </div>
      )}

      <NotionConnectionCard
        connected={connected}
        statusLoading={statusLoading}
        status={status}
        disconnect={disconnect}
        authUrl={buildAuthUrl()}
      />

      {connected && (
        <>
          <Separator />

          <SyncCard
            mode="properties"
            icon={<IconDatabase className="h-4 w-4 text-blue-500" />}
            title="Sincronizar Propriedades"
            description="Importa datas (inicio, prazo, fim), status, prioridade, responsavel, BUs, tags e mais de cada demanda no Notion."
            syncStatus={propStatus}
            syncResult={propResult}
            onRun={() => runSync("properties")}
            buttonLabel={{
              idle: "Sincronizar Propriedades",
              running: "Sincronizando...",
            }}
          />

          <SyncCard
            mode="comments"
            icon={<IconMessage className="h-4 w-4 text-violet-500" />}
            title="Sincronizar Comentarios"
            description="Importa comentarios de cada pagina de demanda no Notion para a tabela de comentarios do dashboard."
            syncStatus={commentStatus}
            syncResult={commentResult}
            onRun={() => runSync("comments")}
            variant="outline"
            buttonLabel={{
              idle: "Sincronizar Comentarios",
              running: "Importando...",
            }}
          />
        </>
      )}
    </div>
  );
}

interface SyncCardProps {
  mode: SyncMode;
  icon: React.ReactNode;
  title: string;
  description: string;
  syncStatus: SyncStatus;
  syncResult: SyncResult | null;
  onRun: () => void;
  variant?: "default" | "outline";
  buttonLabel: { idle: string; running: string };
}

function SyncCard({
  mode,
  icon,
  title,
  description,
  syncStatus,
  syncResult,
  onRun,
  variant = "default",
  buttonLabel,
}: SyncCardProps) {
  const { data: lastSync } = useNotionLastSync(mode);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              {icon}
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
            </div>
            <CardDescription className="mt-1.5">{description}</CardDescription>
          </div>
          <LastSyncBadge lastSync={lastSync ?? null} />
        </div>
      </CardHeader>
      <CardContent>
        <Button
          onClick={onRun}
          disabled={syncStatus === "running"}
          variant={variant}
          size="sm"
        >
          {syncStatus === "running" ? (
            <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <IconRefresh className="h-4 w-4 mr-2" />
          )}
          {syncStatus === "running" ? buttonLabel.running : buttonLabel.idle}
        </Button>
        <SyncResultDisplay status={syncStatus} result={syncResult} />
      </CardContent>
    </Card>
  );
}
