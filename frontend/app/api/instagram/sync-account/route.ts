import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const IG_GRAPH_URL = "https://graph.facebook.com/v21.0";
const REQUEST_DELAY_MS = 500;

interface IgInsightEntry {
  name: string;
  period: string;
  values: Array<{ value: number | Record<string, unknown>; end_time?: string }>;
  total_value?: { value: number | Record<string, unknown>; breakdowns?: unknown[] };
}

/**
 * POST /api/instagram/sync-account
 *
 * Syncs a single meta_instagram_account: profile, insights, media.
 * Writes to meta_instagram_insights + meta_instagram_media tables.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Validate user
    const anonClient = createClient(
      SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user } } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = (await req.json()) as { account_id: string; days?: number };
    if (!body.account_id) {
      return NextResponse.json({ error: "account_id required" }, { status: 400 });
    }

    // Get the account
    const { data: account, error: acctErr } = await supabase
      .from("meta_instagram_accounts")
      .select("*")
      .eq("id", body.account_id)
      .single();

    if (acctErr || !account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const accessToken = account.access_token as string;
    const igUserId = account.ig_user_id as string;
    const tenantId = account.tenant_id as string;
    const daysBack = body.days ?? 30;
    const errors: string[] = [];

    // Mark as syncing
    await supabase
      .from("meta_instagram_accounts")
      .update({ last_sync_status: "syncing" })
      .eq("id", body.account_id);

    try {
      // ── 1. Update profile ──────────────────────────────────────────
      const profile = await igGet(
        accessToken,
        `/${igUserId}?fields=id,username,name,profile_picture_url,followers_count,follows_count,media_count,biography,website`
      );

      await supabase
        .from("meta_instagram_accounts")
        .update({
          username: profile.username || account.username,
          name: profile.name || account.name,
          profile_picture_url: profile.profile_picture_url || null,
          biography: profile.biography || null,
          website: profile.website || null,
          followers_count: profile.followers_count ?? 0,
          follows_count: profile.follows_count ?? 0,
          media_count: profile.media_count ?? 0,
        })
        .eq("id", body.account_id);

      // ── 2. Account insights ────────────────────────────────────────
      const now = new Date();
      const since = new Date(now.getTime() - daysBack * 86400000);
      const sinceUnix = Math.floor(since.getTime() / 1000);
      const untilUnix = Math.floor(now.getTime() / 1000);

      let dailyInsights: IgInsightEntry[] = [];
      try {
        const res = await igGet(
          accessToken,
          `/${igUserId}/insights?metric=reach,follower_count,impressions&period=day&since=${sinceUnix}&until=${untilUnix}`
        );
        dailyInsights = (res?.data || []) as IgInsightEntry[];
      } catch (e: unknown) {
        errors.push(`Account insights: ${e instanceof Error ? e.message : String(e)}`);
      }

      await delay(REQUEST_DELAY_MS);

      // Total value metrics
      let totalValueMetrics: Record<string, number> = {};
      try {
        const res = await igGet(
          accessToken,
          `/${igUserId}/insights?metric=profile_views,accounts_engaged,website_clicks&period=day&metric_type=total_value&since=${sinceUnix}&until=${untilUnix}`
        );
        for (const entry of (res?.data || []) as IgInsightEntry[]) {
          const tv = entry.total_value;
          if (tv && typeof tv.value === "number") {
            totalValueMetrics[entry.name] = tv.value;
          }
        }
      } catch (e: unknown) {
        errors.push(`Total value metrics: ${e instanceof Error ? e.message : String(e)}`);
      }

      await delay(REQUEST_DELAY_MS);

      // Audience demographics
      let audience: Record<string, unknown> = {};
      try {
        const demoRes = await igGet(
          accessToken,
          `/${igUserId}/insights?metric=follower_demographics&period=lifetime&metric_type=total_value&breakdown=city,age,gender`
        );
        audience = parseAudienceDemographics((demoRes?.data || []) as IgInsightEntry[]);
      } catch (e: unknown) {
        errors.push(`Audience: ${e instanceof Error ? e.message : String(e)}`);
      }

      // Build daily snapshots from the insights
      const dailyMap = buildDailyMap(dailyInsights);
      const today = now.toISOString().split("T")[0];

      // Upsert today's aggregate insight
      const totalReach = sumInsightMetric(dailyInsights, "reach");
      const totalImpressions = sumInsightMetric(dailyInsights, "impressions");

      const { error: insightErr } = await supabase
        .from("meta_instagram_insights")
        .upsert(
          {
            tenant_id: tenantId,
            account_id: body.account_id,
            date: today,
            followers: profile.followers_count ?? 0,
            follows: profile.follows_count ?? 0,
            media_count: profile.media_count ?? 0,
            reach: totalReach,
            impressions: totalImpressions,
            profile_views: totalValueMetrics.profile_views ?? 0,
            accounts_engaged: totalValueMetrics.accounts_engaged ?? 0,
            website_clicks: totalValueMetrics.website_clicks ?? 0,
            total_interactions: totalValueMetrics.accounts_engaged ?? 0,
            engagement_rate:
              (profile.followers_count ?? 0) > 0
                ? parseFloat(
                    (((totalValueMetrics.accounts_engaged ?? 0) / profile.followers_count) * 100).toFixed(3)
                  )
                : 0,
            follower_change: 0,
            audience_data: audience,
            raw_data: { daily: dailyMap, total_value: totalValueMetrics },
          },
          { onConflict: "account_id,date" }
        );

      if (insightErr) errors.push(`Insight upsert: ${insightErr.message}`);

      // Upsert historical daily data if available
      for (const [date, metrics] of Object.entries(dailyMap)) {
        if (date === today) continue;
        const dayMetrics = metrics as Record<string, number>;
        await supabase.from("meta_instagram_insights").upsert(
          {
            tenant_id: tenantId,
            account_id: body.account_id,
            date,
            followers: dayMetrics.follower_count ?? profile.followers_count ?? 0,
            reach: dayMetrics.reach ?? 0,
            impressions: dayMetrics.impressions ?? 0,
          },
          { onConflict: "account_id,date" }
        );
      }

      // ── 3. Media + per-media insights ──────────────────────────────
      let mediaList: Record<string, unknown>[] = [];
      try {
        const mediaRes = await igGet(
          accessToken,
          `/${igUserId}/media?fields=id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count,media_product_type,permalink&limit=50`
        );
        mediaList = (mediaRes?.data || []) as Record<string, unknown>[];
      } catch (e: unknown) {
        errors.push(`Media list: ${e instanceof Error ? e.message : String(e)}`);
      }

      let mediaUpserted = 0;
      for (const post of mediaList) {
        await delay(REQUEST_DELAY_MS);

        const mediaId = String(post.id);
        let postMetrics: Record<string, number> = {};

        try {
          const isReels = post.media_product_type === "REELS";
          const isVideo = post.media_type === "VIDEO";
          const metrics = isReels
            ? "reach,saved,shares,total_interactions,ig_reels_avg_watch_time,ig_reels_video_view_total_time,clips_replays_count"
            : isVideo
              ? "reach,saved,shares,total_interactions,video_views"
              : "reach,saved,shares,total_interactions";

          const insightsRes = await igGet(accessToken, `/${mediaId}/insights?metric=${metrics}`);
          postMetrics = parseMediaInsights((insightsRes?.data || []) as IgInsightEntry[]);
        } catch {
          // Some media types don't support insights
        }

        const likeCount = (post.like_count as number) ?? 0;
        const commentCount = (post.comments_count as number) ?? 0;
        const postReach = postMetrics.reach ?? 0;
        const totalInteractions = postMetrics.total_interactions ?? likeCount + commentCount + (postMetrics.saved ?? 0);
        const engRate = postReach > 0 ? parseFloat(((totalInteractions / postReach) * 100).toFixed(3)) : 0;

        const mediaType = post.media_product_type === "REELS" ? "REELS" : String(post.media_type);

        const { error: mediaErr } = await supabase.from("meta_instagram_media").upsert(
          {
            tenant_id: tenantId,
            account_id: body.account_id,
            ig_media_id: mediaId,
            media_type: mediaType,
            media_product_type: post.media_product_type ? String(post.media_product_type) : null,
            caption: post.caption ? String(post.caption) : null,
            permalink: post.permalink ? String(post.permalink) : null,
            media_url: post.media_url ? String(post.media_url) : null,
            thumbnail_url: post.thumbnail_url ? String(post.thumbnail_url) : null,
            timestamp: post.timestamp ? new Date(String(post.timestamp)).toISOString() : null,
            like_count: likeCount,
            comments_count: commentCount,
            reach: postReach,
            impressions: postMetrics.impressions ?? 0,
            saved: postMetrics.saved ?? 0,
            shares: postMetrics.shares ?? 0,
            plays: postMetrics.clips_replays_count ?? postMetrics.video_views ?? 0,
            total_interactions: totalInteractions,
            engagement_rate: engRate,
            reel_avg_watch_time: postMetrics.ig_reels_avg_watch_time ?? null,
            reel_total_play_time: postMetrics.ig_reels_video_view_total_time ?? null,
            reel_replays: postMetrics.clips_replays_count ?? 0,
            raw_insights: postMetrics,
            synced_at: new Date().toISOString(),
          },
          { onConflict: "account_id,ig_media_id" }
        );

        if (!mediaErr) mediaUpserted++;
        else errors.push(`Media ${mediaId}: ${mediaErr.message}`);
      }

      // ── 4. Update account sync status ──────────────────────────────
      await supabase
        .from("meta_instagram_accounts")
        .update({
          last_sync_at: new Date().toISOString(),
          last_sync_status: errors.length > 0 ? "error" : "success",
          last_sync_error: errors.length > 0 ? errors.join("; ") : null,
        })
        .eq("id", body.account_id);

      return NextResponse.json({
        success: true,
        message: `Sync concluido: ${mediaUpserted} posts sincronizados`,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);

      await supabase
        .from("meta_instagram_accounts")
        .update({
          last_sync_status: "error",
          last_sync_error: msg,
        })
        .eq("id", body.account_id);

      return NextResponse.json({ error: msg }, { status: 500 });
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[instagram-sync-account]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

async function igGet(token: string, endpoint: string): Promise<Record<string, unknown>> {
  const separator = endpoint.includes("?") ? "&" : "?";
  const url = `${IG_GRAPH_URL}${endpoint}${separator}access_token=${token}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`IG API ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sumInsightMetric(entries: IgInsightEntry[], metricName: string): number {
  const entry = entries.find((e) => e.name === metricName);
  if (!entry) return 0;
  return (entry.values || []).reduce((acc, v) => acc + (typeof v.value === "number" ? v.value : 0), 0);
}

function buildDailyMap(entries: IgInsightEntry[]): Record<string, Record<string, number>> {
  const map: Record<string, Record<string, number>> = {};
  for (const entry of entries) {
    for (const v of entry.values || []) {
      if (!v.end_time || typeof v.value !== "number") continue;
      const date = v.end_time.split("T")[0];
      if (!map[date]) map[date] = {};
      map[date][entry.name] = v.value;
    }
  }
  return map;
}

function parseAudienceDemographics(entries: IgInsightEntry[]): Record<string, unknown> {
  const result: Record<string, unknown> = { gender: {}, top_cities: {}, age_ranges: {} };

  for (const entry of entries) {
    if (entry.name !== "follower_demographics") continue;
    const totalValue = entry.total_value;
    if (!totalValue) continue;

    const breakdowns = totalValue.breakdowns as Array<{
      dimension_keys: string[];
      results: Array<{ dimension_values: string[]; value: number }>;
    }> | undefined;

    if (!breakdowns) continue;

    for (const breakdown of breakdowns) {
      const dims = breakdown.dimension_keys || [];
      const results = breakdown.results || [];

      if (dims.includes("city")) {
        const cities: Record<string, number> = {};
        for (const r of results) cities[r.dimension_values?.[0] ?? "Unknown"] = r.value;
        const sorted = Object.entries(cities).sort(([, a], [, b]) => b - a).slice(0, 10);
        result.top_cities = Object.fromEntries(sorted);
      }
      if (dims.includes("age")) {
        const ages: Record<string, number> = {};
        for (const r of results) {
          const age = r.dimension_values?.[0] ?? "Unknown";
          ages[age] = (ages[age] ?? 0) + r.value;
        }
        result.age_ranges = ages;
      }
      if (dims.includes("gender")) {
        const genders: Record<string, number> = {};
        for (const r of results) {
          const g = r.dimension_values?.[0] ?? "U";
          genders[g] = (genders[g] ?? 0) + r.value;
        }
        result.gender = genders;
      }
    }
  }

  return result;
}

function parseMediaInsights(entries: IgInsightEntry[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const entry of entries) {
    const val = entry.values?.[0]?.value;
    if (typeof val === "number") result[entry.name] = val;
  }
  return result;
}
