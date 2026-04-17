// ============================================================================
// TBO OS — Edge Function: Send Cadence Step
//
// Dispara (via Mailchimp) um cadence_send que está em status='draft'.
// Resolve merge tags {{primeiro_nome}} e {{empresa}} com dados do deal,
// renderiza com template TBO, cria campanha Mailchimp e envia.
//
// Ao finalizar com sucesso:
//   - cadence_sends.status = 'sent', sent_at = now(), mailchimp_campaign_id
//   - cadence_enrollments.current_step_order += 1
//   - Se current_step_order ultrapassa steps → status = 'completed'
//
// Disparo é MANUAL (chamado pelo frontend quando o usuário clica "Enviar").
//
// Auth: verify_jwt: false. Usa SERVICE_ROLE.
//
// Env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//           MAILCHIMP_API_KEY, MAILCHIMP_SERVER_PREFIX, MAILCHIMP_OUTBOUND_LIST_ID
// ============================================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Md5 } from "https://deno.land/std@0.160.0/hash/md5.ts";

import { buildEmailHtml } from "./template.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MC_API_KEY = Deno.env.get("MAILCHIMP_API_KEY") || "";
const MC_SERVER = Deno.env.get("MAILCHIMP_SERVER_PREFIX") || "us21";
const MC_LIST_ID = Deno.env.get("MAILCHIMP_OUTBOUND_LIST_ID") || "3b6d78581f";
const MC_BASE = `https://${MC_SERVER}.api.mailchimp.com/3.0`;
const MC_AUTH = "Basic " + btoa(`anystring:${MC_API_KEY}`);

interface SendRequest {
  send_id: string;
  // Opcional: se o usuário editou o subject/body antes de enviar
  override_subject?: string;
  override_body?: string;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

function md5Lower(s: string): string {
  return new Md5().update(s).toString();
}

async function mcFetch(method: string, path: string, body?: unknown): Promise<Response> {
  return fetch(`${MC_BASE}${path}`, {
    method,
    headers: { Authorization: MC_AUTH, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function firstName(contact: string | null | undefined): string {
  const c = (contact ?? "").trim();
  if (!c) return "";
  return c.split(/\s+/)[0] ?? "";
}

function resolveMergeTags(text: string, first_name: string, company: string): string {
  return text
    .replace(/\{\{\s*primeiro_nome\s*\}\}/g, first_name || "")
    .replace(/\{\{\s*empresa\s*\}\}/g, company || "");
}

function greetingEyebrow(): string {
  const h = new Date().getHours();
  if (h < 12) return "BOM DIA";
  if (h < 18) return "BOA TARDE";
  return "BOA NOITE";
}

async function sendViaMailchimp(args: {
  email: string;
  first_name: string;
  company: string;
  subject: string;
  html: string;
  preheader: string;
  title: string;
}): Promise<{ mcCampaignId: string; mcWebId: number }> {
  const email = args.email.trim().toLowerCase();
  const hash = md5Lower(email);

  // 1. Upsert subscriber
  const upsertRes = await mcFetch("PUT", `/lists/${MC_LIST_ID}/members/${hash}`, {
    email_address: email,
    status_if_new: "subscribed",
    status: "subscribed",
    merge_fields: { FNAME: args.first_name, COMPANY: args.company },
  });
  if (!upsertRes.ok) {
    throw new Error(`Upsert subscriber ${email}: ${upsertRes.status} ${(await upsertRes.text()).slice(0, 200)}`);
  }

  // 2. Static segment (1 email só)
  const timestamp = Date.now();
  const segRes = await mcFetch("POST", `/lists/${MC_LIST_ID}/segments`, {
    name: `Cadência · ${args.title.slice(0, 40)} · ${timestamp}`,
    static_segment: [email],
  });
  if (!segRes.ok) throw new Error(`Create segment: ${segRes.status} ${(await segRes.text()).slice(0, 200)}`);
  const segmentId: number = (await segRes.json()).id;

  // 3. Criar campanha
  const campRes = await mcFetch("POST", `/campaigns`, {
    type: "regular",
    recipients: { list_id: MC_LIST_ID, segment_opts: { saved_segment_id: segmentId } },
    settings: {
      subject_line: args.subject,
      preview_text: args.preheader,
      title: args.title,
      from_name: "TBO",
      reply_to: "contato@agenciatbo.com.br",
      to_name: "*|FNAME|*",
      auto_footer: false,
      inline_css: true,
      authenticate: true,
    },
  });
  if (!campRes.ok) throw new Error(`Create campaign: ${campRes.status} ${(await campRes.text()).slice(0, 200)}`);
  const campJson = await campRes.json();
  const mcCampaignId: string = campJson.id;
  const mcWebId: number = campJson.web_id;

  // 4. PUT HTML
  const contentRes = await mcFetch("PUT", `/campaigns/${mcCampaignId}/content`, { html: args.html });
  if (!contentRes.ok) throw new Error(`Upload content: ${contentRes.status} ${(await contentRes.text()).slice(0, 200)}`);

  // 5. Send
  const sendRes = await mcFetch("POST", `/campaigns/${mcCampaignId}/actions/send`);
  if (!sendRes.ok) throw new Error(`Send: ${sendRes.status} ${(await sendRes.text()).slice(0, 200)}`);

  return { mcCampaignId, mcWebId };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { send_id, override_subject, override_body } = (await req.json()) as SendRequest;
    if (!send_id) return jsonResponse({ error: "send_id obrigatório" }, 400);
    if (!MC_API_KEY) return jsonResponse({ error: "MAILCHIMP_API_KEY não configurada" }, 500);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // 1. Send draft
    const { data: send, error: sendErr } = await supabase
      .from("cadence_sends")
      .select("*")
      .eq("id", send_id)
      .single();
    if (sendErr || !send) return jsonResponse({ error: "Send não encontrado" }, 404);
    if (send.status !== "draft") return jsonResponse({ error: `Send está ${send.status}, não draft` }, 400);

    // 2. Enrollment + cadence
    const { data: enrollment, error: enErr } = await supabase
      .from("cadence_enrollments")
      .select("*, cadences!inner(name, slug)")
      .eq("id", send.enrollment_id)
      .single();
    if (enErr || !enrollment) return jsonResponse({ error: "Enrollment não encontrado" }, 404);
    if (enrollment.status !== "active") return jsonResponse({ error: `Enrollment está ${enrollment.status}` }, 400);

    // 3. Deal
    const { data: deal, error: dealErr } = await supabase
      .from("crm_deals")
      .select("id, name, contact, company, contact_email")
      .eq("id", enrollment.deal_id)
      .single();
    if (dealErr || !deal) return jsonResponse({ error: "Deal não encontrado" }, 404);
    if (!deal.contact_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(deal.contact_email)) {
      return jsonResponse({ error: `Deal sem e-mail válido (${deal.contact_email ?? "vazio"})` }, 400);
    }

    // 4. Total de steps dessa cadência (pra saber se terminou)
    const { count: totalSteps } = await supabase
      .from("cadence_steps")
      .select("id", { count: "exact", head: true })
      .eq("cadence_id", enrollment.cadence_id);

    // 5. Resolve merge tags
    const fname = firstName(deal.contact);
    const company = (deal.company ?? "").trim();
    const rawSubject = override_subject ?? send.final_subject ?? "";
    const rawBody = override_body ?? send.final_body ?? "";
    const subject = resolveMergeTags(rawSubject, fname, company);
    const body = resolveMergeTags(rawBody, fname, company);

    if (!subject.trim() || !body.trim()) {
      return jsonResponse({ error: "Subject ou body vazio após resolução de merge tags" }, 400);
    }

    // 6. Render HTML com template TBO
    const html = buildEmailHtml({
      subject,
      body,
      preheader: subject,
      eyebrow: greetingEyebrow(),
    });

    // 7. Envio Mailchimp
    const mc = await sendViaMailchimp({
      email: deal.contact_email,
      first_name: fname,
      company,
      subject,
      html,
      preheader: subject,
      title: `${enrollment.cadences.name} · step ${send.step_order} · ${deal.name ?? "sem nome"}`.slice(0, 100),
    });

    // 8. Atualiza cadence_sends
    const { error: updSendErr } = await supabase
      .from("cadence_sends")
      .update({
        status: "sent",
        final_subject: subject,
        final_body: body,
        sent_at: new Date().toISOString(),
        mailchimp_campaign_id: mc.mcCampaignId,
      })
      .eq("id", send.id);
    if (updSendErr) {
      return jsonResponse({ error: "Envio feito mas falha ao atualizar send", detail: updSendErr.message, mcCampaignId: mc.mcCampaignId }, 500);
    }

    // 9. Avança enrollment
    const newStepOrder = send.step_order + 1;
    const isCompleted = typeof totalSteps === "number" && newStepOrder > totalSteps;
    const enrollmentPatch: Record<string, unknown> = {
      current_step_order: isCompleted ? send.step_order : newStepOrder,
    };
    if (isCompleted) {
      enrollmentPatch.status = "completed";
      enrollmentPatch.completed_at = new Date().toISOString();
    }
    await supabase.from("cadence_enrollments").update(enrollmentPatch).eq("id", enrollment.id);

    return jsonResponse({
      success: true,
      send_id: send.id,
      mailchimp_campaign_id: mc.mcCampaignId,
      mailchimp_dashboard_url: `https://${MC_SERVER}.admin.mailchimp.com/campaigns/show/?id=${mc.mcWebId}`,
      enrollment_completed: isCompleted,
      next_step_order: isCompleted ? null : newStepOrder,
    });
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: err instanceof Error ? err.message : "Erro interno" }, 500);
  }
});
