export interface ShowcaseRow {
  id: string;
  tenant_id: string;
  token: string;
  title: string;
  description: string | null;
  item_ids: string[];
  accent_color: string | null;
  created_by: string | null;
  access_count: number;
  first_accessed_at: string | null;
  last_accessed_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShowcaseInsert {
  tenant_id: string;
  token: string;
  title: string;
  description?: string | null;
  item_ids: string[];
  accent_color?: string;
  created_by?: string | null;
  expires_at?: string | null;
}
