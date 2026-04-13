import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import type {
  MetaInstagramAccount,
  MetaInstagramInsight,
  MetaInstagramMedia,
  ConnectAccountPayload,
  InsightsPeriod,
} from "../types/instagram";

// ── Accounts ────────────────────────────────────────────────────────────────

export async function listInstagramAccounts(
  supabase: SupabaseClient<Database>,
  tenantId: string
): Promise<MetaInstagramAccount[]> {
  const { data, error } = await supabase
    .from("meta_instagram_accounts")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("account_type")
    .order("username");

  if (error) throw error;
  return (data ?? []) as unknown as MetaInstagramAccount[];
}

export async function getInstagramAccount(
  supabase: SupabaseClient<Database>,
  accountId: string
): Promise<MetaInstagramAccount> {
  const { data, error } = await supabase
    .from("meta_instagram_accounts")
    .select("*")
    .eq("id", accountId)
    .single();

  if (error) throw error;
  return data as unknown as MetaInstagramAccount;
}

export async function connectInstagramAccount(
  supabase: SupabaseClient<Database>,
  payload: ConnectAccountPayload
): Promise<MetaInstagramAccount> {
  // First, get the IG profile from Meta API via our edge function
  const { data, error } = await supabase
    .from("meta_instagram_accounts")
    .upsert(
      {
        tenant_id: payload.tenant_id,
        fb_user_id: payload.fb_user_id,
        fb_page_id: payload.fb_page_id,
        ig_user_id: payload.ig_user_id,
        access_token: payload.access_token,
        account_type: payload.account_type,
        client_name: payload.client_name ?? null,
        username: "loading...",
        is_active: true,
        last_sync_status: "pending",
      } as never,
      { onConflict: "tenant_id,ig_user_id" }
    )
    .select("*")
    .single();

  if (error) throw error;
  return data as unknown as MetaInstagramAccount;
}

export async function disconnectInstagramAccount(
  supabase: SupabaseClient<Database>,
  accountId: string
): Promise<void> {
  const { error } = await supabase
    .from("meta_instagram_accounts")
    .update({ is_active: false } as never)
    .eq("id", accountId);

  if (error) throw error;
}

export async function updateInstagramAccount(
  supabase: SupabaseClient<Database>,
  accountId: string,
  updates: Partial<Pick<MetaInstagramAccount, "account_type" | "client_name" | "tags" | "sync_frequency" | "is_active">>
): Promise<MetaInstagramAccount> {
  const { data, error } = await supabase
    .from("meta_instagram_accounts")
    .update(updates as never)
    .eq("id", accountId)
    .select("*")
    .single();

  if (error) throw error;
  return data as unknown as MetaInstagramAccount;
}

// ── Insights ────────────────────────────────────────────────────────────────

function periodToDays(period: InsightsPeriod): number {
  const map: Record<InsightsPeriod, number> = { "7d": 7, "30d": 30, "90d": 90 };
  return map[period];
}

export async function getAccountInsights(
  supabase: SupabaseClient<Database>,
  accountId: string,
  period: InsightsPeriod = "30d"
): Promise<MetaInstagramInsight[]> {
  const days = periodToDays(period);
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("meta_instagram_insights")
    .select("*")
    .eq("account_id", accountId)
    .gte("date", since.toISOString().split("T")[0])
    .order("date", { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as MetaInstagramInsight[];
}

export async function getLatestInsight(
  supabase: SupabaseClient<Database>,
  accountId: string
): Promise<MetaInstagramInsight | null> {
  const { data, error } = await supabase
    .from("meta_instagram_insights")
    .select("*")
    .eq("account_id", accountId)
    .order("date", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return (data as unknown as MetaInstagramInsight) ?? null;
}

// ── Media ───────────────────────────────────────────────────────────────────

export async function getAccountMedia(
  supabase: SupabaseClient<Database>,
  accountId: string,
  options?: {
    mediaType?: string;
    limit?: number;
    offset?: number;
  }
): Promise<MetaInstagramMedia[]> {
  let query = supabase
    .from("meta_instagram_media")
    .select("*")
    .eq("account_id", accountId)
    .order("timestamp", { ascending: false });

  if (options?.mediaType && options.mediaType !== "all") {
    query = query.eq("media_type", options.mediaType);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options?.limit ?? 25) - 1);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as MetaInstagramMedia[];
}

export async function getTopMedia(
  supabase: SupabaseClient<Database>,
  accountId: string,
  sortBy: "reach" | "engagement_rate" | "like_count" | "total_interactions" = "reach",
  limit = 10
): Promise<MetaInstagramMedia[]> {
  const { data, error } = await supabase
    .from("meta_instagram_media")
    .select("*")
    .eq("account_id", accountId)
    .order(sortBy, { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as unknown as MetaInstagramMedia[];
}

// ── Sync ────────────────────────────────────────────────────────────────────

export async function triggerAccountSync(
  accountId: string,
  days = 30
): Promise<{ success: boolean; message: string }> {
  const res = await fetch("/api/instagram/sync-account", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ account_id: accountId, days }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Sync failed" }));
    throw new Error(err.error ?? `Sync failed (${res.status})`);
  }

  return res.json();
}

// ── OAuth ───────────────────────────────────────────────────────────────────

export function getMetaOAuthUrl(tenantId: string, accountType: "own" | "client" = "own", clientName?: string): string {
  const appId = process.env.NEXT_PUBLIC_META_APP_ID;
  const redirectUri = `${window.location.origin}/api/instagram/oauth/callback`;

  const state = btoa(
    JSON.stringify({ tenant_id: tenantId, account_type: accountType, client_name: clientName })
  );

  const scopes = [
    "instagram_basic",
    "instagram_manage_insights",
    "pages_show_list",
    "pages_read_engagement",
    "business_management",
  ].join(",");

  return `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&state=${encodeURIComponent(state)}&response_type=code`;
}

// ── KPI Computation (client-side) ───────────────────────────────────────────

export function computeInstagramKPIs(
  insights: MetaInstagramInsight[],
  previousInsights: MetaInstagramInsight[]
): {
  followers: number;
  followerChange: number;
  reach: number;
  reachChange: number;
  engagement: number;
  engagementChange: number;
  engagementRate: number;
  engagementRateChange: number;
  profileViews: number;
  profileViewsChange: number;
  postsCount: number;
} {
  const sumField = (arr: MetaInstagramInsight[], field: keyof MetaInstagramInsight) =>
    arr.reduce((s, i) => s + (Number(i[field]) || 0), 0);

  const latestFollowers = insights.length > 0 ? insights[insights.length - 1].followers : 0;
  const previousFollowers = previousInsights.length > 0 ? previousInsights[previousInsights.length - 1].followers : 0;

  const reach = sumField(insights, "reach");
  const prevReach = sumField(previousInsights, "reach");

  const engagement = sumField(insights, "total_interactions");
  const prevEngagement = sumField(previousInsights, "total_interactions");

  const avgEngRate = insights.length > 0
    ? insights.reduce((s, i) => s + Number(i.engagement_rate), 0) / insights.length
    : 0;
  const prevAvgEngRate = previousInsights.length > 0
    ? previousInsights.reduce((s, i) => s + Number(i.engagement_rate), 0) / previousInsights.length
    : 0;

  const profileViews = sumField(insights, "profile_views");
  const prevProfileViews = sumField(previousInsights, "profile_views");

  const postsCount = insights.length > 0 ? insights[insights.length - 1].media_count : 0;

  return {
    followers: latestFollowers,
    followerChange: latestFollowers - previousFollowers,
    reach,
    reachChange: reach - prevReach,
    engagement,
    engagementChange: engagement - prevEngagement,
    engagementRate: Number(avgEngRate.toFixed(2)),
    engagementRateChange: Number((avgEngRate - prevAvgEngRate).toFixed(2)),
    profileViews,
    profileViewsChange: profileViews - prevProfileViews,
    postsCount,
  };
}
