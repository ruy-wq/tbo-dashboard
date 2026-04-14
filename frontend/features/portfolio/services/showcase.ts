import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import type { ShowcaseRow, ShowcaseInsert } from "@/features/portfolio/types/showcase";
import type { PortfolioItem } from "@/features/portfolio/types/portfolio";

// ─── Queries ────────────────────────────────────────────────────────────────

export async function getShowcaseByToken(
  supabase: SupabaseClient<Database>,
  token: string,
): Promise<{ showcase: ShowcaseRow; items: PortfolioItem[] } | null> {
  // Fetch showcase
  const { data: showcase, error } = await supabase
    .from("portfolio_showcases" as never)
    .select("*")
    .eq("token", token)
    .eq("is_active", true)
    .single();

  if (error || !showcase) return null;

  const sc = showcase as unknown as ShowcaseRow;

  // Check expiry
  if (sc.expires_at && new Date(sc.expires_at) < new Date()) return null;

  // Fetch related items
  const { data: items } = await supabase
    .from("portfolio_items" as never)
    .select("*")
    .in("id", sc.item_ids);

  // Increment access count
  await supabase
    .from("portfolio_showcases" as never)
    .update({
      access_count: sc.access_count + 1,
      last_accessed_at: new Date().toISOString(),
      ...(!sc.first_accessed_at ? { first_accessed_at: new Date().toISOString() } : {}),
    } as never)
    .eq("id", sc.id);

  return {
    showcase: sc,
    items: ((items ?? []) as unknown as PortfolioItem[]).sort((a, b) => {
      // Maintain order from item_ids
      return sc.item_ids.indexOf(a.id) - sc.item_ids.indexOf(b.id);
    }),
  };
}

export async function getShowcases(
  supabase: SupabaseClient<Database>,
  tenantId: string,
): Promise<ShowcaseRow[]> {
  const { data, error } = await supabase
    .from("portfolio_showcases" as never)
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as ShowcaseRow[];
}

// ─── Mutations ──────────────────────────────────────────────────────────────

export async function createShowcase(
  supabase: SupabaseClient<Database>,
  input: ShowcaseInsert,
): Promise<ShowcaseRow> {
  const { data, error } = await supabase
    .from("portfolio_showcases" as never)
    .insert({
      ...input,
      access_count: 0,
      is_active: true,
    } as never)
    .select()
    .single();

  if (error) throw error;
  return data as unknown as ShowcaseRow;
}

export async function deleteShowcase(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("portfolio_showcases" as never)
    .update({ is_active: false, updated_at: new Date().toISOString() } as never)
    .eq("id", id);

  if (error) throw error;
}
