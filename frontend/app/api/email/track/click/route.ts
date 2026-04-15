// Feature #90 — Tracking de cliques em links de email
// Registra evento e redireciona para URL original

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const sid = req.nextUrl.searchParams.get("sid");
  const email = req.nextUrl.searchParams.get("e");
  const cid = req.nextUrl.searchParams.get("cid");
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Registrar evento de clique
  if (sid && email) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      );

      await supabase.from("email_tracking_events").insert({
        send_id: sid,
        campaign_id: cid || null,
        recipient_email: email,
        event_type: "click",
        metadata: {
          clicked_url: url,
          user_agent: req.headers.get("user-agent") || "",
          timestamp: new Date().toISOString(),
        },
      });

      // Incrementar contador de clicks no email_sends
      await supabase.rpc("increment_email_send_clicks", { send_uuid: sid });
    } catch {
      // Silenciar — não bloquear redirect
    }
  }

  return NextResponse.redirect(url);
}
