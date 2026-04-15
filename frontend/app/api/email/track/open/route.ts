// Feature #90 — Tracking pixel de abertura de email
// Retorna um GIF 1x1 transparente e registra o evento

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

export async function GET(req: NextRequest) {
  const sid = req.nextUrl.searchParams.get("sid");
  const email = req.nextUrl.searchParams.get("e");
  const cid = req.nextUrl.searchParams.get("cid");

  // Registrar evento em background — não bloquear resposta
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
        event_type: "open",
        metadata: {
          user_agent: req.headers.get("user-agent") || "",
          ip: req.headers.get("x-forwarded-for") || "",
          timestamp: new Date().toISOString(),
        },
      });

      // Incrementar contador de opens no email_sends
      await supabase.rpc("increment_email_send_opens", { send_uuid: sid });
    } catch {
      // Silenciar erros — tracking não pode quebrar experiência do usuário
    }
  }

  return new NextResponse(TRANSPARENT_GIF, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
