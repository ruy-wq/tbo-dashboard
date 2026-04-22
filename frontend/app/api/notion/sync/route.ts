import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { withRetry, HttpStatusError } from "@/lib/retry";

const EDGE_FN_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL + "/functions/v1/notion-sync";

interface SyncPayload {
  total_notion_pages?: number;
  matched?: number;
  updated?: number;
  not_found?: number;
  total_comments_imported?: number;
  demands_processed?: number;
  errors?: string[];
  error?: string;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  if (!profile?.tenant_id) {
    return NextResponse.json({ error: "No tenant" }, { status: 400 });
  }

  const { data: integration } = await (supabase as unknown as SupabaseClient)
    .from("notion_integrations")
    .select("access_token")
    .eq("tenant_id", profile.tenant_id)
    .single();

  if (!integration?.access_token) {
    return NextResponse.json(
      { error: "Notion not connected. Connect via Configuracoes > Integracoes." },
      { status: 400 }
    );
  }

  const mode = request.nextUrl.searchParams.get("mode") ?? "properties";
  const entityType = mode === "comments" ? "comments" : "properties";

  const fwdParams = new URLSearchParams(request.nextUrl.searchParams.toString());
  if (!fwdParams.has("tenant_id")) {
    fwdParams.set("tenant_id", profile.tenant_id);
  }
  const url = `${EDGE_FN_URL}?${fwdParams.toString()}`;

  const { data: logRow } = await supabase
    .from("sync_logs")
    .insert({
      tenant_id: profile.tenant_id,
      provider: "notion",
      direction: "pull",
      entity_type: entityType,
      status: "running",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  const logId = logRow?.id as string | undefined;

  try {
    const { status, data } = await withRetry(
      async () => {
        const edgeRes = await fetch(url, {
          method: "GET",
          headers: {
            "x-notion-token": integration.access_token,
            "Content-Type": "application/json",
          },
        });
        const body = (await edgeRes.json()) as SyncPayload;
        if (!edgeRes.ok) {
          throw new HttpStatusError(edgeRes.status, body, body.error);
        }
        return { status: edgeRes.status, data: body };
      },
      { maxAttempts: 3, initialDelayMs: 600 },
    );

    if (logId) {
      const fetched = data.total_notion_pages ?? data.demands_processed ?? 0;
      const updated = data.updated ?? data.total_comments_imported ?? 0;
      const errorCount = data.errors?.length ?? 0;
      await supabase
        .from("sync_logs")
        .update({
          status: errorCount > 0 ? "partial" : "success",
          completed_at: new Date().toISOString(),
          records_fetched: fetched,
          records_updated: updated,
          records_errors: errorCount,
          error_details: errorCount > 0 ? { warnings: data.errors ?? [] } : null,
        })
        .eq("id", logId);
    }

    return NextResponse.json(data, { status });
  } catch (err) {
    const status =
      err instanceof HttpStatusError && err.status >= 400 && err.status < 500
        ? err.status
        : 502;
    const message =
      err instanceof Error ? err.message : "Falha ao sincronizar com o Notion";

    if (logId) {
      await supabase
        .from("sync_logs")
        .update({
          status: "error",
          completed_at: new Date().toISOString(),
          error_details: { message, status },
        })
        .eq("id", logId);
    }

    return NextResponse.json({ error: message }, { status });
  }
}
