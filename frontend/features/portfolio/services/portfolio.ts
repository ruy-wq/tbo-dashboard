import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import type {
  PortfolioItem,
  PortfolioInsert,
  PortfolioUpdate,
} from "@/features/portfolio/types/portfolio";

// ─── Queries ────────────────────────────────────────────────────────────────

export async function getPortfolioItems(
  supabase: SupabaseClient<Database>,
  tenantId: string,
): Promise<PortfolioItem[]> {
  const { data, error } = await supabase
    .from("portfolio_items" as never)
    .select("*")
    .eq("tenant_id", tenantId)
    .order("is_featured", { ascending: false })
    .order("year", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as PortfolioItem[];
}

export async function getPortfolioItem(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<PortfolioItem> {
  const { data, error } = await supabase
    .from("portfolio_items" as never)
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as unknown as PortfolioItem;
}

// ─── Mutations ──────────────────────────────────────────────────────────────

export async function createPortfolioItem(
  supabase: SupabaseClient<Database>,
  input: PortfolioInsert,
): Promise<PortfolioItem> {
  const { data, error } = await supabase
    .from("portfolio_items" as never)
    .insert(input as never)
    .select()
    .single();

  if (error) throw error;
  return data as unknown as PortfolioItem;
}

export async function updatePortfolioItem(
  supabase: SupabaseClient<Database>,
  id: string,
  updates: PortfolioUpdate,
): Promise<PortfolioItem> {
  const { data, error } = await supabase
    .from("portfolio_items" as never)
    .update({ ...updates, updated_at: new Date().toISOString() } as never)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as unknown as PortfolioItem;
}

export async function deletePortfolioItem(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("portfolio_items" as never)
    .delete()
    .eq("id", id);

  if (error) throw error;
}
