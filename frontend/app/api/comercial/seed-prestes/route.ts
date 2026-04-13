import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * ONE-TIME seed route to create the Prestes proposal.
 * Redirects to /comercial/propostas after creation.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createServiceClient();

  // Check if already created (idempotent)
  const { data: existingProposal } = await supabase
    .from("proposals" as never)
    .select("id")
    .eq("client_token", "prestes-mcmv-curitiba-2026")
    .maybeSingle();

  if (existingProposal) {
    return NextResponse.redirect(
      new URL("/comercial/propostas", "https://os.wearetbo.com.br"),
    );
  }

  // Get tenant_id from an existing proposal
  const { data: existing } = await supabase
    .from("proposals" as never)
    .select("tenant_id")
    .limit(1)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "No existing proposals to derive tenant_id" }, { status: 400 });
  }

  const tenantId = (existing as Record<string, string>).tenant_id;

  // Count existing proposals for ref_code
  const { count } = await supabase
    .from("proposals" as never)
    .select("id", { count: "exact", head: true });

  const refNum = String((count ?? 0) + 1).padStart(3, "0");
  const refCode = `TBO-2026-${refNum}`;

  const now = new Date().toISOString();

  // Create proposal — only non-generated columns
  const { data: proposal, error: proposalError } = await supabase
    .from("proposals" as never)
    .insert({
      tenant_id: tenantId,
      name: "Prestes — Empreendimento MCMV Curitiba",
      client: "Prestes Construtora",
      company: "Prestes Construtora",
      contact_name: "Hayanne",
      project_type: "Visualização Arquitetônica",
      project_location: "Curitiba, PR",
      ref_code: refCode,
      valid_days: 15,
      urgency_flag: false,
      package_discount_flag: false,
      notes: "• Valores referentes a produção de imagens estáticas em alta resolução (TIFF/PNG 300dpi) e versão web (JPG 72dpi).\n• A modelagem 3D é compartilhada entre todas as imagens — investimento único.\n• Prazo estimado de entrega: 6 a 8 semanas a partir do recebimento do material técnico (plantas, cortes, fachadas).\n• Inclui até 2 rodadas de revisão por imagem após a emissão inicial.\n• Alterações de escopo ou câmeras adicionais após aprovação do clay serão orçadas separadamente.\n• Formatos de entrega: TIFF/PNG 300dpi (impressão) + JPG 72dpi (digital) via Google Drive.",
      introduction: "A produção de imagens para empreendimentos do programa MCMV exige o mesmo cuidado técnico e visual que projetos de alto padrão — o comprador precisa se enxergar morando ali.\n\nPara o empreendimento da Prestes em Curitiba, comercializado pela COHAB, propomos um pacote de visualização que valorize as áreas comuns e a implantação do condomínio, traduzindo qualidade de vida e pertencimento para o público faixa 2.",
      show_d3d_flow: false,
      payment_conditions: [
        {
          label: "Parcelado em 3x",
          description: "3x de R$ 3.000,00",
          highlight: true,
          details: "1ª parcela na aprovação (entrada) + 2 parcelas mensais subsequentes",
        },
        {
          label: "À vista",
          description: "R$ 9.000,00",
          highlight: false,
          details: "Pagamento integral na aprovação da proposta",
        },
      ],
      client_token: "prestes-mcmv-curitiba-2026",
      created_at: now,
      updated_at: now,
    } as never)
    .select()
    .single();

  if (proposalError) {
    return NextResponse.json({ error: proposalError.message }, { status: 500 });
  }

  const prop = proposal as Record<string, unknown>;
  const proposalId = prop.id as string;

  // Create items
  const items = [
    {
      title: "Modelagem 3D do Empreendimento",
      description: "Construção do modelo 3D completo: volumetria, paisagismo, áreas comuns e entorno",
      bu: "3D",
      quantity: 1,
      unit_price: 2000,
      discount_pct: 0,
    },
    {
      title: "Imagem — Portaria",
      description: "Render da portaria/acesso principal do empreendimento",
      bu: "3D",
      quantity: 1,
      unit_price: 1100,
      discount_pct: 0,
    },
    {
      title: "Imagem — Praça de Estar / Boulevard com Quiosques",
      description: "Render da praça de estar com boulevard e quiosques",
      bu: "3D",
      quantity: 1,
      unit_price: 1100,
      discount_pct: 0,
    },
    {
      title: "Imagem — Espaço Pet",
      description: "Render do espaço pet com equipamentos e paisagismo",
      bu: "3D",
      quantity: 1,
      unit_price: 1100,
      discount_pct: 0,
    },
    {
      title: "Imagem — Playground",
      description: "Render do playground com equipamentos e ambientação",
      bu: "3D",
      quantity: 1,
      unit_price: 1100,
      discount_pct: 0,
    },
    {
      title: "Implantação Humanizada",
      description: "Vista aérea do empreendimento com paisagismo, vias e entorno urbanístico",
      bu: "3D",
      quantity: 1,
      unit_price: 1500,
      discount_pct: 0,
    },
  ];

  const itemRows = items.map((item, i) => ({
    ...item,
    proposal_id: proposalId,
    tenant_id: tenantId,
    sort_order: i,
    subtotal: item.quantity * item.unit_price * (1 - item.discount_pct / 100),
  }));

  const { error: itemsError } = await supabase
    .from("proposal_items" as never)
    .insert(itemRows as never);

  if (itemsError) {
    // Clean up the proposal if items fail
    await supabase.from("proposals" as never).delete().eq("id", proposalId);
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  // Redirect to proposals page
  return NextResponse.redirect(
    new URL("/comercial/propostas", "https://os.wearetbo.com.br"),
  );
}
