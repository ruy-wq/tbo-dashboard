import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export interface CreativeBriefingRow {
  id: string;
  tenant_id: string;
  slug: string;
  client_name: string;
  project_slug: string | null;
  project_name: string | null;
  project_id: string | null;
  status: "rascunho" | "enviado" | "em_analise" | "aprovado";
  form_data: Record<string, unknown>;
  is_active: boolean;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function getCreativeBriefings(
  supabase: SupabaseClient<Database>,
  filters?: { status?: string; search?: string },
): Promise<CreativeBriefingRow[]> {
  let query = (supabase
    .from("creative_briefings" as never)
    .select("*" as never) as unknown as {
    neq: (col: string, val: string) => unknown;
    eq: (col: string, val: string) => unknown;
    ilike: (col: string, val: string) => unknown;
    order: (col: string, opts: { ascending: boolean }) => unknown;
  });

  // Excluir rascunhos por padrão (só mostrar enviados+)
  if (filters?.status) {
    query = query.eq("status", filters.status) as typeof query;
  } else {
    query = query.neq("status", "rascunho") as typeof query;
  }

  if (filters?.search) {
    query = query.ilike("client_name", `%${filters.search}%`) as typeof query;
  }

  query = query.order("created_at", { ascending: false }) as typeof query;

  const { data, error } = (await query) as unknown as {
    data: CreativeBriefingRow[] | null;
    error: { message: string } | null;
  };
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getCreativeBriefingById(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<CreativeBriefingRow | null> {
  const { data, error } = (await (supabase
    .from("creative_briefings" as never)
    .select("*" as never)
    .eq("id" as never, id as never)
    .single())) as unknown as {
    data: CreativeBriefingRow | null;
    error: { message: string } | null;
  };
  if (error) throw new Error(error.message);
  return data;
}

export async function updateBriefingStatus(
  supabase: SupabaseClient<Database>,
  id: string,
  status: CreativeBriefingRow["status"],
): Promise<void> {
  const { error } = (await (supabase
    .from("creative_briefings" as never)
    .update({ status, updated_at: new Date().toISOString() } as never)
    .eq("id" as never, id as never))) as unknown as {
    error: { message: string } | null;
  };
  if (error) throw new Error(error.message);
}

// ── Criar briefing criativo diretamente (interno) ──

export interface CreateBriefingInput {
  client_name: string;
  project_name?: string;
  slug: string;
  project_slug?: string;
  form_data?: Record<string, unknown>;
}

export async function createCreativeBriefing(
  supabase: SupabaseClient<Database>,
  input: CreateBriefingInput,
): Promise<CreativeBriefingRow> {
  // Buscar tenant_id do usuario logado
  const { data: profile } = await (supabase
    .from("profiles" as never)
    .select("tenant_id" as never)
    .single()) as unknown as { data: { tenant_id: string } | null };

  if (!profile?.tenant_id) throw new Error("Tenant nao encontrado");

  const now = new Date().toISOString();
  const { data, error } = (await (supabase
    .from("creative_briefings" as never)
    .insert({
      tenant_id: profile.tenant_id,
      slug: input.slug,
      client_name: input.client_name,
      project_slug: input.project_slug || null,
      project_name: input.project_name || null,
      form_data: input.form_data || {},
      status: "enviado",
      submitted_at: now,
      is_active: true,
    } as never)
    .select("*" as never)
    .single())) as unknown as {
    data: CreativeBriefingRow | null;
    error: { message: string } | null;
  };

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Erro ao criar briefing");
  return data;
}

// ── Campaign Briefings (para listagem unificada em /clientes/briefings) ──

export interface CampaignBriefingWithCampaign {
  id: string;
  campaign_id: string;
  campaign_name: string;
  objective: string | null;
  target_audience: string | null;
  key_messages: string[];
  deliverables: string[];
  status: "draft" | "pending_approval" | "approved" | "revision";
  created_at: string;
  updated_at: string;
}

export async function getAllCampaignBriefings(
  supabase: SupabaseClient<Database>,
  filters?: { status?: string; search?: string },
): Promise<CampaignBriefingWithCampaign[]> {
  // Buscar briefings de campanha com join no nome da campanha
  const { data: briefings, error: bErr } = await (supabase as SupabaseClient)
    .from("campaign_briefings")
    .select("*, marketing_campaigns!inner(name)")
    .order("created_at", { ascending: false });

  if (bErr) {
    // Tabela pode nao existir ou nome diferente — fallback silencioso
    console.warn("campaign_briefings query error:", bErr.message);
    return [];
  }

  const items = (briefings ?? []).map((b: Record<string, unknown>) => {
    const campaign = b.marketing_campaigns as { name: string } | null;
    return {
      id: b.id as string,
      campaign_id: b.campaign_id as string,
      campaign_name: campaign?.name ?? "Campanha",
      objective: (b.objective as string) ?? null,
      target_audience: (b.target_audience as string) ?? null,
      key_messages: (b.key_messages as string[]) ?? [],
      deliverables: (b.deliverables as string[]) ?? [],
      status: b.status as CampaignBriefingWithCampaign["status"],
      created_at: b.created_at as string,
      updated_at: b.updated_at as string,
    };
  });

  // Aplicar filtros
  let filtered = items;

  if (filters?.status) {
    filtered = filtered.filter((b) => b.status === filters.status);
  } else {
    // Excluir drafts por padrao
    filtered = filtered.filter((b) => b.status !== "draft");
  }

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(
      (b) =>
        b.campaign_name.toLowerCase().includes(q) ||
        (b.objective ?? "").toLowerCase().includes(q),
    );
  }

  return filtered;
}
