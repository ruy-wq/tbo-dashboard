// ============================================================================
// TBO OS — Edge Function: Send Email Campaign (via Mailchimp)
// Resolve segmento → deals → upsert em audience → cria segment + campaign → envia
// Trigger: chamada do frontend via supabase.functions.invoke("send-email-campaign")
//
// Env vars obrigatórias:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//   MAILCHIMP_API_KEY              (ex: 6d4c88d...-us21)
//   MAILCHIMP_SERVER_PREFIX        (ex: us21)
//   MAILCHIMP_OUTBOUND_LIST_ID     (ex: 3b6d78581f)
// ============================================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Md5 } from "https://deno.land/std@0.160.0/hash/md5.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MC_API_KEY = Deno.env.get("MAILCHIMP_API_KEY") || "";
const MC_SERVER = Deno.env.get("MAILCHIMP_SERVER_PREFIX") || "us21";
const MC_LIST_ID = Deno.env.get("MAILCHIMP_OUTBOUND_LIST_ID") || "3b6d78581f"; // "TBO - Prospeccao Outbound"
const MC_BASE = `https://${MC_SERVER}.api.mailchimp.com/3.0`;
const MC_AUTH = "Basic " + btoa(`anystring:${MC_API_KEY}`);

interface SendRequest {
  campaign_id: string;
}

interface DealRow {
  contact_email: string;
  contact: string | null;
  company: string | null;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
};

function firstName(fullName: string | null): string {
  const trimmed = (fullName || "").trim();
  if (!trimmed) return "";
  return trimmed.split(/\s+/)[0];
}

function md5Lower(email: string): string {
  const md5 = new Md5();
  md5.update(email.trim().toLowerCase());
  return md5.toString();
}

async function mcFetch(method: string, path: string, body?: unknown): Promise<Response> {
  return fetch(`${MC_BASE}${path}`, {
    method,
    headers: {
      Authorization: MC_AUTH,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const { campaign_id } = (await req.json()) as SendRequest;
    if (!campaign_id) return jsonResponse({ error: "campaign_id obrigatório" }, 400);
    if (!MC_API_KEY) return jsonResponse({ error: "MAILCHIMP_API_KEY não configurada" }, 500);
    if (!MC_LIST_ID) return jsonResponse({ error: "MAILCHIMP_OUTBOUND_LIST_ID não configurada" }, 500);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // 1. Campanha
    const { data: campaign, error: cErr } = await supabase
      .from("email_campaigns")
      .select("*")
      .eq("id", campaign_id)
      .single();
    if (cErr || !campaign) return jsonResponse({ error: "Campanha não encontrada" }, 404);
    if (campaign.status !== "draft" && campaign.status !== "scheduled") {
      return jsonResponse({ error: `Status '${campaign.status}' não pode ser enviado` }, 400);
    }

    // 2. Template
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

    // 3. Destinatários via segmento Supabase
    let deals: DealRow[] = [];
    if (campaign.segment_id) {
      const { data: segment } = await supabase
        .from("email_segments")
        .select("segment_type, static_deal_ids")
        .eq("id", campaign.segment_id)
        .single();

      if (segment?.segment_type === "static" && segment.static_deal_ids?.length > 0) {
        const { data: rows } = await supabase
          .from("crm_deals")
          .select("contact_email, contact, company")
          .in("id", segment.static_deal_ids)
          .not("contact_email", "is", null)
          .neq("contact_email", "");
        deals = (rows || []) as unknown as DealRow[];
      }
    }
    if (deals.length === 0) return jsonResponse({ error: "Nenhum destinatário no segmento" }, 400);

    // Dedup por email
    const seen = new Set<string>();
    const recipients = deals.filter((d) => {
      const e = d.contact_email.toLowerCase().trim();
      if (seen.has(e)) return false;
      seen.add(e);
      return true;
    });

    // 4. Upsert cada membro na audience (PUT é idempotente)
    let upserted = 0;
    let upsertFailed = 0;
    for (const r of recipients) {
      const hash = md5Lower(r.contact_email);
      const res = await mcFetch("PUT", `/lists/${MC_LIST_ID}/members/${hash}`, {
        email_address: r.contact_email.trim().toLowerCase(),
        status_if_new: "subscribed",
        status: "subscribed",
        merge_fields: {
          FNAME: firstName(r.contact) || "",
          COMPANY: r.company || "",
        },
      });
      if (res.ok) upserted++;
      else {
        upsertFailed++;
        const err = await res.text();
        console.error(`Upsert failed ${r.contact_email}:`, res.status, err);
      }
    }
    if (upserted === 0) {
      return jsonResponse({ error: "Falha ao sincronizar leads no Mailchimp", upsertFailed }, 502);
    }

    // 5. Static segment com esses emails
    const emails = recipients.map((r) => r.contact_email.trim().toLowerCase());
    const segRes = await mcFetch("POST", `/lists/${MC_LIST_ID}/segments`, {
      name: `${campaign.name} — ${campaign.id.slice(0, 8)}`,
      static_segment: emails,
    });
    if (!segRes.ok) {
      const err = await segRes.text();
      return jsonResponse({ error: "Falha ao criar segment no Mailchimp", detail: err }, 502);
    }
    const segJson = await segRes.json();
    const mcSegmentId: number = segJson.id;

    // 6. Criar campanha
    const campRes = await mcFetch("POST", `/campaigns`, {
      type: "regular",
      recipients: {
        list_id: MC_LIST_ID,
        segment_opts: { saved_segment_id: mcSegmentId },
      },
      settings: {
        subject_line: campaign.subject,
        preview_text: "",
        title: campaign.name,
        from_name: "TBO",
        reply_to: "contato@agenciatbo.com.br",
        to_name: "*|FNAME|*",
        auto_footer: false,
        inline_css: true,
        authenticate: true,
      },
    });
    if (!campRes.ok) {
      const err = await campRes.text();
      return jsonResponse({ error: "Falha ao criar campaign no Mailchimp", detail: err }, 502);
    }
    const campJson = await campRes.json();
    const mcCampaignId: string = campJson.id;
    const mcWebId: number = campJson.web_id;

    // 7. Set content HTML
    const contentRes = await mcFetch("PUT", `/campaigns/${mcCampaignId}/content`, {
      html: htmlContent,
    });
    if (!contentRes.ok) {
      const err = await contentRes.text();
      return jsonResponse({ error: "Falha ao setar conteúdo no Mailchimp", detail: err }, 502);
    }

    // 8. Marcar campanha como "sending" no Supabase
    await supabase
      .from("email_campaigns")
      .update({
        status: "sending",
        mailchimp_campaign_id: mcCampaignId,
        mailchimp_segment_id: mcSegmentId,
        mailchimp_list_id: MC_LIST_ID,
        mailchimp_web_id: mcWebId,
      })
      .eq("id", campaign_id);

    // 9. Registrar envio no Supabase
    const { data: sendRow } = await supabase
      .from("email_sends")
      .insert({
        campaign_id,
        campaign_name: campaign.name,
        recipient_count: recipients.length,
        status: "sending",
        sent_at: new Date().toISOString(),
        mailchimp_campaign_id: mcCampaignId,
      })
      .select()
      .single();

    // 10. Enviar!
    const sendRes = await mcFetch("POST", `/campaigns/${mcCampaignId}/actions/send`);
    if (!sendRes.ok) {
      const err = await sendRes.text();
      // Reverte status
      await supabase.from("email_campaigns").update({ status: "draft" }).eq("id", campaign_id);
      if (sendRow?.id) {
        await supabase
          .from("email_sends")
          .update({ status: "failed", completed_at: new Date().toISOString() })
          .eq("id", sendRow.id);
      }
      return jsonResponse({ error: "Falha ao disparar campanha no Mailchimp", detail: err }, 502);
    }

    // 11. Sucesso — Mailchimp aceitou. O envio em si é assíncrono no lado deles.
    await supabase
      .from("email_campaigns")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", campaign_id);

    if (sendRow?.id) {
      await supabase
        .from("email_sends")
        .update({
          status: "completed",
          delivered: recipients.length,
          completed_at: new Date().toISOString(),
        })
        .eq("id", sendRow.id);
    }

    return jsonResponse({
      success: true,
      recipients: recipients.length,
      upserted,
      upsertFailed,
      mailchimp_campaign_id: mcCampaignId,
      mailchimp_web_id: mcWebId,
      mailchimp_dashboard_url: `https://${MC_SERVER}.admin.mailchimp.com/campaigns/show/?id=${mcWebId}`,
    });
  } catch (err) {
    console.error(err);
    return jsonResponse(
      { error: err instanceof Error ? err.message : "Erro interno" },
      500,
    );
  }
});
