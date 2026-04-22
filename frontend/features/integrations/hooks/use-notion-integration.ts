"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface NotionStatus {
  connected: boolean;
  workspace_name?: string;
  workspace_id?: string;
  owner_name?: string;
  connected_at?: string;
}

async function fetchStatus(): Promise<NotionStatus> {
  const res = await fetch("/api/notion/status");
  if (!res.ok) return { connected: false };
  return res.json();
}

export function useNotionStatus() {
  return useQuery<NotionStatus>({
    queryKey: ["notion-status"],
    queryFn: fetchStatus,
    staleTime: 30_000,
  });
}

export function useNotionDisconnect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notion/disconnect", { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao desconectar");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notion-status"] });
    },
  });
}

export type SyncMode = "properties" | "comments";
export type SyncLogStatus = "running" | "success" | "partial" | "error";

export interface NotionLastSync {
  id: string;
  status: SyncLogStatus;
  started_at: string | null;
  completed_at: string | null;
  records_fetched: number | null;
  records_updated: number | null;
  records_errors: number | null;
}

export function useNotionLastSync(mode: SyncMode) {
  return useQuery<NotionLastSync | null>({
    queryKey: ["notion-last-sync", mode],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("sync_logs")
        .select(
          "id, status, started_at, completed_at, records_fetched, records_updated, records_errors",
        )
        .eq("provider", "notion")
        .eq("entity_type", mode)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as NotionLastSync | null) ?? null;
    },
    staleTime: 10_000,
  });
}
