import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const META_APP_ID = process.env.META_APP_ID || process.env.NEXT_PUBLIC_META_APP_ID!;
const META_APP_SECRET = process.env.META_APP_SECRET!;
const IG_GRAPH_URL = "https://graph.facebook.com/v21.0";

/**
 * GET /api/instagram/oauth/callback
 *
 * Handles the Facebook OAuth redirect. Flow:
 * 1. Exchange code for short-lived token
 * 2. Exchange for long-lived token
 * 3. Get user's Facebook Pages
 * 4. Get Instagram Business Account for each Page
 * 5. Store accounts in meta_instagram_accounts
 * 6. Redirect back to UI
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const stateParam = url.searchParams.get("state");
    const errorParam = url.searchParams.get("error");

    if (errorParam) {
      return redirectWithError(`Meta OAuth negado: ${errorParam}`);
    }

    if (!code || !stateParam) {
      return redirectWithError("Parametros OAuth ausentes");
    }

    // Parse state
    let state: { tenant_id: string; account_type: string; client_name?: string };
    try {
      state = JSON.parse(atob(stateParam));
    } catch {
      return redirectWithError("State invalido");
    }

    const redirectUri = `${url.origin}/api/instagram/oauth/callback`;

    // 1. Exchange code for short-lived token
    const tokenRes = await fetch(
      `${IG_GRAPH_URL}/oauth/access_token?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${META_APP_SECRET}&code=${code}`
    );

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("[instagram-oauth] Token exchange failed:", err);
      return redirectWithError("Falha ao trocar codigo por token");
    }

    const tokenData = (await tokenRes.json()) as { access_token: string };
    const shortLivedToken = tokenData.access_token;

    // 2. Exchange for long-lived token (60 days)
    const longTokenRes = await fetch(
      `${IG_GRAPH_URL}/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${shortLivedToken}`
    );

    let accessToken = shortLivedToken;
    if (longTokenRes.ok) {
      const longData = (await longTokenRes.json()) as { access_token: string; expires_in?: number };
      accessToken = longData.access_token;
    }

    // 3. Get FB user info
    const meRes = await fetch(`${IG_GRAPH_URL}/me?fields=id,name&access_token=${accessToken}`);
    if (!meRes.ok) {
      return redirectWithError("Falha ao obter dados do usuario Facebook");
    }
    const meData = (await meRes.json()) as { id: string; name: string };

    // 4. Get user's Pages with Instagram Business Accounts
    const pagesRes = await fetch(
      `${IG_GRAPH_URL}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,name,profile_picture_url,followers_count,follows_count,media_count,biography,website}&access_token=${accessToken}`
    );

    if (!pagesRes.ok) {
      return redirectWithError("Falha ao obter paginas do Facebook");
    }

    const pagesData = (await pagesRes.json()) as {
      data: Array<{
        id: string;
        name: string;
        access_token: string;
        instagram_business_account?: {
          id: string;
          username: string;
          name: string;
          profile_picture_url: string;
          followers_count: number;
          follows_count: number;
          media_count: number;
          biography: string;
          website: string;
        };
      }>;
    };

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    let connectedCount = 0;

    for (const page of pagesData.data) {
      const igAccount = page.instagram_business_account;
      if (!igAccount) continue;

      // Use the page-level access token (lasts longer and has page-specific permissions)
      const pageAccessToken = page.access_token;

      // Exchange page token for long-lived page token
      let longPageToken = pageAccessToken;
      try {
        const longPageRes = await fetch(
          `${IG_GRAPH_URL}/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${pageAccessToken}`
        );
        if (longPageRes.ok) {
          const longPageData = (await longPageRes.json()) as { access_token: string };
          longPageToken = longPageData.access_token;
        }
      } catch {
        // Use short-lived token as fallback
      }

      const { error: upsertErr } = await supabase
        .from("meta_instagram_accounts")
        .upsert(
          {
            tenant_id: state.tenant_id,
            fb_user_id: meData.id,
            fb_page_id: page.id,
            ig_user_id: igAccount.id,
            username: igAccount.username,
            name: igAccount.name || igAccount.username,
            profile_picture_url: igAccount.profile_picture_url || null,
            biography: igAccount.biography || null,
            website: igAccount.website || null,
            followers_count: igAccount.followers_count ?? 0,
            follows_count: igAccount.follows_count ?? 0,
            media_count: igAccount.media_count ?? 0,
            access_token: longPageToken,
            token_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
            account_type: state.account_type,
            client_name: state.client_name || null,
            is_active: true,
            last_sync_status: "pending",
          },
          { onConflict: "tenant_id,ig_user_id" }
        );

      if (upsertErr) {
        console.error("[instagram-oauth] Upsert error:", upsertErr.message);
      } else {
        connectedCount++;
      }
    }

    // Also store in integration_configs for backward compatibility with existing sync
    if (pagesData.data.length > 0 && pagesData.data[0].instagram_business_account) {
      const firstIg = pagesData.data[0].instagram_business_account;
      const firstPageToken = pagesData.data[0].access_token;

      await supabase.from("integration_configs").upsert(
        {
          tenant_id: state.tenant_id,
          provider: "instagram",
          is_active: true,
          settings: {
            access_token: firstPageToken,
            ig_user_id: firstIg.id,
            app_id: META_APP_ID,
            app_secret: META_APP_SECRET,
          },
        },
        { onConflict: "tenant_id,provider" }
      );
    }

    // Redirect back to the redes-sociais page with success
    const successUrl = new URL("/marketing/redes-sociais", url.origin);
    successUrl.searchParams.set("connected", String(connectedCount));
    successUrl.searchParams.set("fb_user", meData.name);

    return NextResponse.redirect(successUrl.toString());
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[instagram-oauth] Fatal:", msg);
    return redirectWithError(msg);
  }
}

function redirectWithError(message: string): NextResponse {
  const url = new URL("/marketing/redes-sociais", process.env.NEXT_PUBLIC_APP_URL || "https://os.wearetbo.com.br");
  url.searchParams.set("oauth_error", message);
  return NextResponse.redirect(url.toString());
}
