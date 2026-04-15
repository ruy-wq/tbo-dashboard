// ============================================================================
// TBO OS — Edge Function: Send Email Campaign
// Feature #90 — Resolve segmento → deals com email → envia via Resend
// Trigger: chamada do frontend via useSupabase.functions.invoke()
// ============================================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const APP_URL = Deno.env.get("APP_URL") || "https://os.wearetbo.com.br";

interface SendRequest {
  campaign_id: string;
}

serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
        },
      });
    }

    const { campaign_id } = (await req.json()) as SendRequest;
    if (!campaign_id) {
      return new Response(JSON.stringify({ error: "campaign_id obrigatório" }), { status: 400 });
    }

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY não configurada" }), { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // 1. Buscar campanha
    const { data: campaign, error: campaignError } = await supabase
      .from("email_campaigns")
      .select("*")
      .eq("id", campaign_id)
      .single();

    if (campaignError || !campaign) {
      return new Response(JSON.stringify({ error: "Campanha não encontrada" }), { status: 404 });
    }

    if (campaign.status !== "draft" && campaign.status !== "scheduled") {
      return new Response(
        JSON.stringify({ error: `Campanha com status '${campaign.status}' não pode ser enviada` }),
        { status: 400 },
      );
    }

    // 2. Buscar template
    let htmlContent = "";
    if (campaign.template_id) {
      const { data: template } = await supabase
        .from("email_templates")
        .select("html_content")
        .eq("id", campaign.template_id)
        .single();
      htmlContent = template?.html_content || "";
    }

    if (!htmlContent) {
      htmlContent = `<html><body><h1>${campaign.subject}</h1><p>Conteúdo da campanha</p></body></html>`;
    }

    // 3. Resolver lista de destinatários via segmento
    let recipients: { email: string; name: string }[] = [];

    if (campaign.segment_id) {
      const { data: segment } = await supabase
        .from("email_segments")
        .select("rules, segment_type, static_deal_ids")
        .eq("id", campaign.segment_id)
        .single();

      if (segment) {
        if (segment.segment_type === "static" && segment.static_deal_ids?.length > 0) {
          const { data: deals } = await supabase
            .from("crm_deals")
            .select("contact_email, contact_name")
            .in("id", segment.static_deal_ids)
            .not("contact_email", "is", null)
            .neq("contact_email", "");
          recipients = (deals || []).map((d: Record<string, string>) => ({
            email: d.contact_email,
            name: d.contact_name || "",
          }));
        } else {
          // Segmento dinâmico — aplicar regras
          recipients = await resolveSegmentRecipients(supabase, segment.rules);
        }
      }
    }

    if (recipients.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum destinatário encontrado no segmento" }),
        { status: 400 },
      );
    }

    // 4. Filtrar descadastrados
    const { data: unsubscribed } = await supabase
      .from("email_unsubscribes")
      .select("email")
      .eq("tenant_id", campaign.tenant_id);

    const unsubEmails = new Set((unsubscribed || []).map((u: { email: string }) => u.email.toLowerCase()));
    recipients = recipients.filter((r) => !unsubEmails.has(r.email.toLowerCase()));

    if (recipients.length === 0) {
      return new Response(
        JSON.stringify({ error: "Todos os destinatários estão descadastrados" }),
        { status: 400 },
      );
    }

    // 5. Marcar campanha como "sending"
    await supabase
      .from("email_campaigns")
      .update({ status: "sending" })
      .eq("id", campaign_id);

    // 6. Criar registro de envio
    const { data: sendRecord } = await supabase
      .from("email_sends")
      .insert({
        campaign_id,
        campaign_name: campaign.name,
        recipient_count: recipients.length,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        unsubscribed: 0,
        status: "sending",
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    const sendId = sendRecord?.id;

    // 7. Enviar emails em batches via Resend
    let delivered = 0;
    let bounced = 0;
    const BATCH_SIZE = 50;

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE);

      const promises = batch.map(async (recipient) => {
        try {
          // Injetar tracking pixel e link de unsubscribe no HTML
          const trackingPixel = `<img src="${APP_URL}/api/email/track/open?sid=${sendId}&e=${encodeURIComponent(recipient.email)}&cid=${campaign_id}" width="1" height="1" style="display:none" alt="" />`;
          const unsubLink = `${APP_URL}/unsubscribe?e=${encodeURIComponent(recipient.email)}&cid=${campaign_id}&tid=${campaign.tenant_id}`;
          const finalHtml = htmlContent
            .replace("</body>", `${trackingPixel}<p style="text-align:center;font-size:11px;color:#999;margin-top:32px;"><a href="${unsubLink}" style="color:#999;">Descadastrar deste email</a></p></body>`);

          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "TBO OS <noreply@agenciatbo.com.br>",
              to: recipient.email,
              subject: campaign.subject,
              html: finalHtml,
            }),
          });

          if (res.ok) {
            delivered++;
          } else {
            bounced++;
          }
        } catch {
          bounced++;
        }
      });

      await Promise.all(promises);

      // Atualizar progresso parcial
      if (sendId) {
        await supabase
          .from("email_sends")
          .update({ delivered, bounced })
          .eq("id", sendId);
      }
    }

    // 8. Finalizar
    const finalStatus = bounced === recipients.length ? "failed" : "completed";

    if (sendId) {
      await supabase
        .from("email_sends")
        .update({
          delivered,
          bounced,
          status: finalStatus,
          completed_at: new Date().toISOString(),
        })
        .eq("id", sendId);
    }

    await supabase
      .from("email_campaigns")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", campaign_id);

    return new Response(
      JSON.stringify({
        success: true,
        recipients: recipients.length,
        delivered,
        bounced,
        status: finalStatus,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erro interno" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});

// ── Resolver recipients de segmento dinâmico ──────────────────────────

async function resolveSegmentRecipients(
  supabase: ReturnType<typeof createClient>,
  rules: { rules: Array<{ field: string; operator: string; value: unknown }>; match: string },
): Promise<{ email: string; name: string }[]> {
  let query = supabase
    .from("crm_deals")
    .select("contact_email, contact_name")
    .not("contact_email", "is", null)
    .neq("contact_email", "");

  for (const rule of rules.rules) {
    switch (rule.field) {
      case "funnel_stage":
        if (rule.operator === "equals" && typeof rule.value === "string") {
          query = query.eq("stage", rule.value);
        } else if (rule.operator === "in" && Array.isArray(rule.value)) {
          query = query.in("stage", rule.value);
        } else if (rule.operator === "not_equals" && typeof rule.value === "string") {
          query = query.neq("stage", rule.value);
        } else if (rule.operator === "not_in" && Array.isArray(rule.value)) {
          query = query.not("stage", "in", `(${(rule.value as string[]).join(",")})`);
        }
        break;
      case "deal_source":
        if (rule.operator === "equals" && typeof rule.value === "string") {
          query = query.eq("source", rule.value);
        } else if (rule.operator === "in" && Array.isArray(rule.value)) {
          query = query.in("source", rule.value);
        }
        break;
      case "deal_value_min":
        if (typeof rule.value === "number") query = query.gte("value", rule.value);
        break;
      case "deal_value_max":
        if (typeof rule.value === "number") query = query.lte("value", rule.value);
        break;
      case "created_after":
        if (typeof rule.value === "string") query = query.gte("created_at", rule.value);
        break;
      case "created_before":
        if (typeof rule.value === "string") query = query.lte("created_at", rule.value);
        break;
      case "bu":
        if (rule.operator === "equals" && typeof rule.value === "string") {
          query = query.eq("bu", rule.value);
        } else if (rule.operator === "in" && Array.isArray(rule.value)) {
          query = query.in("bu", rule.value);
        }
        break;
    }
  }

  const { data } = await query;
  // Deduplicar por email
  const seen = new Set<string>();
  const result: { email: string; name: string }[] = [];
  for (const deal of data || []) {
    const d = deal as Record<string, string>;
    const email = d.contact_email?.toLowerCase();
    if (email && !seen.has(email)) {
      seen.add(email);
      result.push({ email: d.contact_email, name: d.contact_name || "" });
    }
  }
  return result;
}
