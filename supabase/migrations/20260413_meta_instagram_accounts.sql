-- ============================================================================
-- TBO OS — Meta Instagram Multi-Account Integration
-- Tracks individual Instagram Business accounts connected via Meta OAuth
-- Supports TBO's own accounts + client accounts
-- ============================================================================

-- ── meta_instagram_accounts ─────────────────────────────────────────────────
-- Each row = one IG Business Account connected for a tenant.
-- A tenant can have multiple: own profiles + client profiles.
CREATE TABLE IF NOT EXISTS meta_instagram_accounts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    -- Meta/Facebook OAuth data
    fb_user_id          TEXT NOT NULL,
    fb_page_id          TEXT,
    ig_user_id          TEXT NOT NULL,
    -- Instagram profile data (synced from API)
    username            TEXT NOT NULL,
    name                TEXT,
    profile_picture_url TEXT,
    biography           TEXT,
    website             TEXT,
    followers_count     INT DEFAULT 0,
    follows_count       INT DEFAULT 0,
    media_count         INT DEFAULT 0,
    -- Token management
    access_token        TEXT NOT NULL,
    token_expires_at    TIMESTAMPTZ,
    token_refreshed_at  TIMESTAMPTZ,
    -- Organization
    account_type        TEXT NOT NULL DEFAULT 'own'
                        CHECK (account_type IN ('own', 'client')),
    client_name         TEXT,
    client_id           UUID,
    tags                TEXT[] NOT NULL DEFAULT '{}',
    -- Link to rsm_accounts for unified view
    rsm_account_id      UUID REFERENCES rsm_accounts(id) ON DELETE SET NULL,
    -- Sync metadata
    last_sync_at        TIMESTAMPTZ,
    last_sync_status    TEXT DEFAULT 'pending'
                        CHECK (last_sync_status IN ('pending', 'syncing', 'success', 'error')),
    last_sync_error     TEXT,
    sync_frequency      TEXT DEFAULT 'daily'
                        CHECK (sync_frequency IN ('hourly', 'daily', 'weekly', 'manual')),
    is_active           BOOLEAN DEFAULT true,
    connected_by        UUID REFERENCES auth.users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, ig_user_id)
);

-- ── meta_instagram_insights ─────────────────────────────────────────────────
-- Daily snapshots of account-level insights from the API
CREATE TABLE IF NOT EXISTS meta_instagram_insights (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    account_id          UUID NOT NULL REFERENCES meta_instagram_accounts(id) ON DELETE CASCADE,
    date                DATE NOT NULL,
    -- Account metrics
    followers           INT DEFAULT 0,
    follows             INT DEFAULT 0,
    media_count         INT DEFAULT 0,
    -- Daily insights from API
    reach               INT DEFAULT 0,
    impressions         INT DEFAULT 0,
    profile_views       INT DEFAULT 0,
    accounts_engaged    INT DEFAULT 0,
    website_clicks      INT DEFAULT 0,
    -- Engagement
    total_interactions  INT DEFAULT 0,
    likes               INT DEFAULT 0,
    comments            INT DEFAULT 0,
    saves               INT DEFAULT 0,
    shares              INT DEFAULT 0,
    -- Computed
    engagement_rate     NUMERIC(6,3) DEFAULT 0,
    follower_change     INT DEFAULT 0,
    -- Audience (daily snapshot)
    audience_data       JSONB DEFAULT '{}',
    -- Raw API response for debugging
    raw_data            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(account_id, date)
);

-- ── meta_instagram_media ────────────────────────────────────────────────────
-- Individual media items with their insights
CREATE TABLE IF NOT EXISTS meta_instagram_media (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    account_id          UUID NOT NULL REFERENCES meta_instagram_accounts(id) ON DELETE CASCADE,
    -- Media identification
    ig_media_id         TEXT NOT NULL,
    -- Media data
    media_type          TEXT NOT NULL CHECK (media_type IN ('IMAGE', 'VIDEO', 'CAROUSEL_ALBUM', 'REELS')),
    media_product_type  TEXT,
    caption             TEXT,
    permalink           TEXT,
    media_url           TEXT,
    thumbnail_url       TEXT,
    timestamp           TIMESTAMPTZ,
    -- Metrics
    like_count          INT DEFAULT 0,
    comments_count      INT DEFAULT 0,
    reach               INT DEFAULT 0,
    impressions         INT DEFAULT 0,
    saved               INT DEFAULT 0,
    shares              INT DEFAULT 0,
    plays               INT DEFAULT 0,
    total_interactions  INT DEFAULT 0,
    engagement_rate     NUMERIC(6,3) DEFAULT 0,
    -- Reels specific
    reel_avg_watch_time NUMERIC(10,2),
    reel_total_play_time NUMERIC(10,2),
    reel_replays        INT DEFAULT 0,
    -- Metadata
    raw_insights        JSONB DEFAULT '{}',
    synced_at           TIMESTAMPTZ DEFAULT now(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(account_id, ig_media_id)
);

-- ── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_meta_ig_accounts_tenant
    ON meta_instagram_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_meta_ig_accounts_active
    ON meta_instagram_accounts(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_meta_ig_insights_account_date
    ON meta_instagram_insights(account_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_meta_ig_insights_tenant
    ON meta_instagram_insights(tenant_id);
CREATE INDEX IF NOT EXISTS idx_meta_ig_media_account
    ON meta_instagram_media(account_id);
CREATE INDEX IF NOT EXISTS idx_meta_ig_media_tenant
    ON meta_instagram_media(tenant_id);
CREATE INDEX IF NOT EXISTS idx_meta_ig_media_timestamp
    ON meta_instagram_media(account_id, timestamp DESC);

-- ── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE meta_instagram_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_instagram_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_instagram_media    ENABLE ROW LEVEL SECURITY;

-- meta_instagram_accounts
CREATE POLICY "meta_ig_accounts_select" ON meta_instagram_accounts
    FOR SELECT USING (tenant_id IN (SELECT get_user_tenant_ids()));
CREATE POLICY "meta_ig_accounts_insert" ON meta_instagram_accounts
    FOR INSERT WITH CHECK (tenant_id IN (SELECT get_user_tenant_ids()));
CREATE POLICY "meta_ig_accounts_update" ON meta_instagram_accounts
    FOR UPDATE USING (tenant_id IN (SELECT get_user_tenant_ids()));
CREATE POLICY "meta_ig_accounts_delete" ON meta_instagram_accounts
    FOR DELETE USING (tenant_id IN (SELECT get_user_tenant_ids()));

-- meta_instagram_insights
CREATE POLICY "meta_ig_insights_select" ON meta_instagram_insights
    FOR SELECT USING (tenant_id IN (SELECT get_user_tenant_ids()));
CREATE POLICY "meta_ig_insights_insert" ON meta_instagram_insights
    FOR INSERT WITH CHECK (tenant_id IN (SELECT get_user_tenant_ids()));
CREATE POLICY "meta_ig_insights_update" ON meta_instagram_insights
    FOR UPDATE USING (tenant_id IN (SELECT get_user_tenant_ids()));
CREATE POLICY "meta_ig_insights_delete" ON meta_instagram_insights
    FOR DELETE USING (tenant_id IN (SELECT get_user_tenant_ids()));

-- meta_instagram_media
CREATE POLICY "meta_ig_media_select" ON meta_instagram_media
    FOR SELECT USING (tenant_id IN (SELECT get_user_tenant_ids()));
CREATE POLICY "meta_ig_media_insert" ON meta_instagram_media
    FOR INSERT WITH CHECK (tenant_id IN (SELECT get_user_tenant_ids()));
CREATE POLICY "meta_ig_media_update" ON meta_instagram_media
    FOR UPDATE USING (tenant_id IN (SELECT get_user_tenant_ids()));
CREATE POLICY "meta_ig_media_delete" ON meta_instagram_media
    FOR DELETE USING (tenant_id IN (SELECT get_user_tenant_ids()));

-- ── Triggers ────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_meta_ig_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER meta_ig_accounts_updated_at
    BEFORE UPDATE ON meta_instagram_accounts
    FOR EACH ROW EXECUTE FUNCTION set_meta_ig_accounts_updated_at();

CREATE OR REPLACE FUNCTION set_meta_ig_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER meta_ig_media_updated_at
    BEFORE UPDATE ON meta_instagram_media
    FOR EACH ROW EXECUTE FUNCTION set_meta_ig_media_updated_at();
