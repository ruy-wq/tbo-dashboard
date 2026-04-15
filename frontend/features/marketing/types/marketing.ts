// ─── Email Studio Types ─────────────────────────────────────────────

export interface EmailTemplate {
  id: string;
  tenant_id: string;
  name: string;
  subject: string;
  html_content: string;
  thumbnail_url: string | null;
  category: string | null;
  tags: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailCampaign {
  id: string;
  tenant_id: string;
  name: string;
  subject: string;
  template_id: string | null;
  status: EmailCampaignStatus;
  list_id: string | null;
  list_name: string | null;
  segment_id: string | null;
  segment_name: string | null;
  scheduled_at: string | null;
  sent_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type EmailCampaignStatus =
  | "draft"
  | "scheduled"
  | "sending"
  | "sent"
  | "paused"
  | "cancelled";

export interface EmailSend {
  id: string;
  campaign_id: string;
  campaign_name: string;
  recipient_count: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  status: "queued" | "sending" | "completed" | "failed";
  sent_at: string | null;
  completed_at: string | null;
}

export interface EmailAnalytics {
  campaign_id: string;
  campaign_name: string;
  total_sent: number;
  total_delivered: number;
  total_opened: number;
  total_clicked: number;
  total_bounced: number;
  total_unsubscribed: number;
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
  unsubscribe_rate: number;
}

// ─── Email Segment Types ────────────────────────────────────────────

export type SegmentRuleField =
  | "funnel_stage"
  | "deal_source"
  | "deal_value_min"
  | "deal_value_max"
  | "tags"
  | "created_after"
  | "created_before"
  | "has_email"
  | "bu";

export type SegmentRuleOperator =
  | "equals"
  | "not_equals"
  | "in"
  | "not_in"
  | "greater_than"
  | "less_than"
  | "contains"
  | "is_true";

export interface SegmentRule {
  field: SegmentRuleField;
  operator: SegmentRuleOperator;
  value: string | string[] | number | boolean;
}

export interface SegmentRuleSet {
  rules: SegmentRule[];
  match: "all" | "any";
}

export interface EmailSegment {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  rules: SegmentRuleSet;
  estimated_count: number;
  last_counted_at: string | null;
  segment_type: "static" | "dynamic";
  static_deal_ids: string[];
  tags: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type EmailSegmentInput = Pick<
  EmailSegment,
  "name" | "description" | "rules" | "segment_type" | "tags"
>;

// ─── Marketing Campaign Types ───────────────────────────────────────

export interface MarketingCampaign {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  status: MarketingCampaignStatus;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  spent: number | null;
  owner_id: string | null;
  owner_name: string | null;
  channels: string[];
  tags: string[];
  /** Feature #70 — favoritar campanha */
  is_favorited?: boolean;
  created_at: string;
  updated_at: string;
}

export type MarketingCampaignStatus =
  | "planejamento"
  | "briefing"
  | "em_producao"
  | "ativa"
  | "pausada"
  | "finalizada"
  | "cancelada";

export interface CampaignBriefing {
  id: string;
  campaign_id: string;
  objective: string | null;
  target_audience: string | null;
  key_messages: string[];
  deliverables: string[];
  references: string[];
  approved_by: string | null;
  approved_at: string | null;
  status: "draft" | "pending_approval" | "approved" | "revision";
  created_at: string;
  updated_at: string;
}

export interface CampaignPiece {
  id: string;
  campaign_id: string;
  name: string;
  type: string;
  status: "pendente" | "em_producao" | "revisao" | "aprovado" | "publicado";
  file_url: string | null;
  assigned_to: string | null;
  due_date: string | null;
  /** Feature #67 — relação bidirecional com ContentItem */
  content_item_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignBudget {
  id: string;
  campaign_id: string;
  category: string;
  description: string | null;
  planned: number;
  actual: number;
  vendor: string | null;
  created_at: string;
}

// ─── Content Types ──────────────────────────────────────────────────

export interface ContentItem {
  id: string;
  tenant_id: string;
  title: string;
  type: ContentType;
  status: ContentStatus;
  channel: string | null;
  scheduled_date: string | null;
  published_date: string | null;
  author_id: string | null;
  author_name: string | null;
  brief_id: string | null;
  campaign_id: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export type ContentType =
  | "post_social"
  | "blog"
  | "video"
  | "email"
  | "stories"
  | "reels"
  | "carrossel"
  | "infografico"
  | "ebook"
  | "outro";

export type ContentStatus =
  | "ideia"
  | "briefing"
  | "em_producao"
  | "revisao"
  | "aprovado"
  | "agendado"
  | "publicado"
  | "arquivado";

export interface ContentBrief {
  id: string;
  tenant_id: string;
  title: string;
  objective: string | null;
  target_audience: string | null;
  key_messages: string[];
  references: string[];
  deliverables: string[];
  deadline: string | null;
  status: "draft" | "approved" | "revision" | "cancelled";
  created_by: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentAsset {
  id: string;
  tenant_id: string;
  name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  tags: string[];
  campaign_id: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface ContentApproval {
  id: string;
  content_id: string;
  content_title: string;
  status: "pending" | "approved" | "rejected" | "revision";
  reviewer_id: string | null;
  reviewer_name: string | null;
  feedback: string | null;
  submitted_at: string;
  reviewed_at: string | null;
}

// ─── Social Media Types ─────────────────────────────────────────────

export interface SocialAccount {
  id: string;
  tenant_id: string;
  platform: SocialPlatform;
  handle: string;
  name: string;
  avatar_url: string | null;
  followers: number;
  is_active: boolean;
  connected_at: string;
}

export type SocialPlatform =
  | "instagram"
  | "facebook"
  | "linkedin"
  | "tiktok"
  | "youtube"
  | "twitter"
  | "pinterest";

export interface SocialPost {
  id: string;
  account_id: string;
  platform: SocialPlatform;
  content: string;
  media_urls: string[];
  status: "draft" | "scheduled" | "published" | "failed";
  scheduled_at: string | null;
  published_at: string | null;
  engagement: SocialEngagement | null;
  created_at: string;
}

export interface SocialEngagement {
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reach: number;
  impressions: number;
}

export interface SocialPerformance {
  account_id: string;
  platform: SocialPlatform;
  period: string;
  followers_gained: number;
  followers_lost: number;
  total_posts: number;
  total_reach: number;
  total_impressions: number;
  total_engagement: number;
  engagement_rate: number;
}

// ─── Analytics Types ────────────────────────────────────────────────

export interface MarketingKPI {
  label: string;
  value: number;
  previous_value: number | null;
  change_pct: number | null;
  unit: "number" | "currency" | "percent";
}

export interface FunnelStage {
  stage: string;
  count: number;
  previous_count?: number | null;
  conversion_rate: number;
  previous_conversion_rate?: number | null;
  value: number;
}

export interface ChannelAttribution {
  channel: string;
  leads: number;
  opportunities: number;
  deals_won: number;
  revenue: number;
  cost: number;
  roi: number;
}

export interface MarketingReport {
  id: string;
  tenant_id: string;
  name: string;
  type: "mensal" | "trimestral" | "campanha" | "canal" | "custom";
  period_start: string;
  period_end: string;
  data: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
}
