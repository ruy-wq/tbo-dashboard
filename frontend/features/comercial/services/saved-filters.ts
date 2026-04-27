import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/types";

type SavedFilterRow = Database["public"]["Tables"]["user_saved_filters"]["Row"];

export type SavedFilter<TFilters = Json> = Omit<SavedFilterRow, "filters"> & {
  filters: TFilters;
};

export async function getSavedFilters<T = Json>(
  supabase: SupabaseClient<Database>,
  module: string,
): Promise<SavedFilter<T>[]> {
  const { data, error } = await supabase
    .from("user_saved_filters")
    .select("*")
    .eq("module", module)
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as SavedFilter<T>[];
}

export async function createSavedFilter<T = Json>(
  supabase: SupabaseClient<Database>,
  input: {
    user_id: string;
    tenant_id: string;
    module: string;
    name: string;
    filters: T;
    is_pinned?: boolean;
  },
): Promise<SavedFilter<T>> {
  const { data, error } = await supabase
    .from("user_saved_filters")
    .insert({
      user_id: input.user_id,
      tenant_id: input.tenant_id,
      module: input.module,
      name: input.name,
      filters: input.filters as unknown as Json,
      is_pinned: input.is_pinned ?? false,
    })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as SavedFilter<T>;
}

export async function updateSavedFilter<T = Json>(
  supabase: SupabaseClient<Database>,
  id: string,
  updates: {
    name?: string;
    filters?: T;
    is_pinned?: boolean;
  },
): Promise<SavedFilter<T>> {
  const payload: Database["public"]["Tables"]["user_saved_filters"]["Update"] = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.filters !== undefined) payload.filters = updates.filters as unknown as Json;
  if (updates.is_pinned !== undefined) payload.is_pinned = updates.is_pinned;

  const { data, error } = await supabase
    .from("user_saved_filters")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as SavedFilter<T>;
}

export async function deleteSavedFilter(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("user_saved_filters")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
