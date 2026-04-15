// Feature #90 — API de descadastro de email (LGPD)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, tenant_id, campaign_id, reason } = body;

    if (!email || !tenant_id) {
      return NextResponse.json(
        { error: "email e tenant_id obrigatórios" },
        { status: 400 },
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Upsert — idempotente (mesmo email pode clicar múltiplas vezes)
    const { error } = await supabase.from("email_unsubscribes").upsert(
      {
        tenant_id,
        email: email.toLowerCase().trim(),
        reason: reason || null,
        campaign_id: campaign_id || null,
        unsubscribed_at: new Date().toISOString(),
      },
      { onConflict: "tenant_id,email" },
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Registrar evento de tracking se tiver campaign_id
    if (campaign_id) {
      try {
        await supabase.from("email_tracking_events").insert({
          send_id: campaign_id,
          campaign_id,
          recipient_email: email,
          event_type: "unsubscribe",
          metadata: { reason },
        });
      } catch {
        // Silenciar — tracking não pode bloquear unsubscribe
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Erro interno ao processar descadastro" },
      { status: 500 },
    );
  }
}
