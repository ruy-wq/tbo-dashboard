import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DeliverableItem {
  title: string;
  description: string;
  type: "folder" | "link" | "pdf" | "video" | "image" | "zip" | "dwg";
  url: string;
  icon?: string;
  file_size?: string;
}

export interface DeliveryRow {
  id: string;
  tenant_id: string;
  project_id: string | null;
  token: string;
  title: string;
  description: string | null;
  client_name: string | null;
  client_company: string | null;
  project_name: string | null;
  delivered_by: string | null;
  delivery_date: string | null;
  deliverables: DeliverableItem[];
  hero_subtitle: string | null;
  hero_gradient_from: string | null;
  hero_gradient_to: string | null;
  accent_color: string | null;
  cover_image_url: string | null;
  personal_message: string | null;
  access_password: string | null;
  access_count: number;
  first_accessed_at: string | null;
  last_accessed_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeliveryInsert {
  tenant_id: string;
  project_id?: string | null;
  token: string;
  title: string;
  description?: string | null;
  client_name?: string | null;
  client_company?: string | null;
  project_name?: string | null;
  delivered_by?: string | null;
  delivery_date?: string | null;
  deliverables: DeliverableItem[];
  hero_subtitle?: string | null;
  accent_color?: string | null;
  cover_image_url?: string | null;
  personal_message?: string | null;
  access_password?: string | null;
}

export type DeliveryUpdate = Partial<Omit<DeliveryInsert, "tenant_id">>;

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getProjectDeliveries(
  supabase: SupabaseClient<Database>,
  projectId: string,
): Promise<DeliveryRow[]> {
  const { data, error } = await supabase
    .from("project_deliveries" as never)
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as DeliveryRow[];
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function createDelivery(
  supabase: SupabaseClient<Database>,
  input: DeliveryInsert,
): Promise<DeliveryRow> {
  const { data, error } = await supabase
    .from("project_deliveries" as never)
    .insert({
      ...input,
      access_count: 0,
      is_active: true,
    } as never)
    .select()
    .single();

  if (error) throw error;
  return data as unknown as DeliveryRow;
}

export async function updateDelivery(
  supabase: SupabaseClient<Database>,
  id: string,
  updates: DeliveryUpdate,
): Promise<DeliveryRow> {
  const { data, error } = await supabase
    .from("project_deliveries" as never)
    .update({ ...updates, updated_at: new Date().toISOString() } as never)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as unknown as DeliveryRow;
}

export async function deleteDelivery(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("project_deliveries" as never)
    .update({ is_active: false, updated_at: new Date().toISOString() } as never)
    .eq("id", id);

  if (error) throw error;
}
