// ─── Meta Instagram API Types ──────────────────────────────────────────────

export interface MetaInstagramAccount {
  id: string;
  tenant_id: string;
  fb_user_id: string;
  fb_page_id: string | null;
  ig_user_id: string;
  username: string;
  name: string | null;
  profile_picture_url: string | null;
  biography: string | null;
  website: string | null;
  followers_count: number;
  follows_count: number;
  media_count: number;
  access_token: string;
  token_expires_at: string | null;
  token_refreshed_at: string | null;
  account_type: "own" | "client";
  client_name: string | null;
  client_id: string | null;
  tags: string[];
  rsm_account_id: string | null;
  last_sync_at: string | null;
  last_sync_status: "pending" | "syncing" | "success" | "error";
  last_sync_error: string | null;
  sync_frequency: "hourly" | "daily" | "weekly" | "manual";
  is_active: boolean;
  connected_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MetaInstagramInsight {
  id: string;
  tenant_id: string;
  account_id: string;
  date: string;
  followers: number;
  follows: number;
  media_count: number;
  reach: number;
  impressions: number;
  profile_views: number;
  accounts_engaged: number;
  website_clicks: number;
  total_interactions: number;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  engagement_rate: number;
  follower_change: number;
  audience_data: AudienceData;
  raw_data: Record<string, unknown>;
  created_at: string;
}

export interface MetaInstagramMedia {
  id: string;
  tenant_id: string;
  account_id: string;
  ig_media_id: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | "REELS";
  media_product_type: string | null;
  caption: string | null;
  permalink: string | null;
  media_url: string | null;
  thumbnail_url: string | null;
  timestamp: string | null;
  like_count: number;
  comments_count: number;
  reach: number;
  impressions: number;
  saved: number;
  shares: number;
  plays: number;
  total_interactions: number;
  engagement_rate: number;
  reel_avg_watch_time: number | null;
  reel_total_play_time: number | null;
  reel_replays: number;
  raw_insights: Record<string, unknown>;
  synced_at: string;
  created_at: string;
  updated_at: string;
}

// ─── Audience Demographics ────────────────────────────────────────────────

export interface AudienceData {
  gender?: Record<string, number>;
  top_cities?: Record<string, number>;
  age_ranges?: Record<string, number>;
}

// ─── Dashboard Aggregation Types ──────────────────────────────────────────

export interface InstagramKPIs {
  followers: number;
  followerChange: number;
  reach: number;
  reachChange: number;
  engagement: number;
  engagementChange: number;
  engagementRate: number;
  engagementRateChange: number;
  postsCount: number;
  profileViews: number;
  profileViewsChange: number;
}

export interface InsightsTrend {
  date: string;
  followers: number;
  reach: number;
  impressions: number;
  engagement: number;
  engagement_rate: number;
}

// ─── OAuth Types ──────────────────────────────────────────────────────────

export interface MetaOAuthUrlResponse {
  url: string;
}

export interface MetaOAuthCallbackPayload {
  code: string;
  tenant_id: string;
  account_type: "own" | "client";
  client_name?: string;
}

export interface MetaIGBusinessAccount {
  ig_user_id: string;
  username: string;
  name: string;
  profile_picture_url: string;
  followers_count: number;
  fb_page_id: string;
  fb_page_name: string;
}

export interface MetaOAuthCallbackResponse {
  accounts: MetaIGBusinessAccount[];
  fb_user_id: string;
  access_token: string;
}

export interface ConnectAccountPayload {
  tenant_id: string;
  fb_user_id: string;
  fb_page_id: string;
  ig_user_id: string;
  access_token: string;
  account_type: "own" | "client";
  client_name?: string;
}

// ─── Media Filter Types ───────────────────────────────────────────────────

export type MediaTypeFilter = "all" | "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | "REELS";

export type InsightsPeriod = "7d" | "30d" | "90d";
