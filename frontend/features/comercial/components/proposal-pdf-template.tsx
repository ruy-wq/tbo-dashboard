import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import type { ProposalWithItems } from "@/features/comercial/services/proposals";
import type {
  ProposalItemRow,
  PaymentConditionOption,
} from "@/features/comercial/services/proposals";

// ─── Brand tokens ─────────────────────────────────────────────────────────────

const COLORS = {
  primary: "#18181B",
  accent: "#E85102",
  accentLight: "#FFF7ED",
  gray50: "#FAFAFA",
  gray100: "#F4F4F5",
  gray200: "#E4E4E7",
  gray400: "#A1A1AA",
  gray500: "#71717A",
  gray600: "#52525B",
  gray700: "#3F3F46",
  gray900: "#18181B",
  white: "#FFFFFF",
  emerald50: "#ECFDF5",
  emerald700: "#047857",
  amber50: "#FFFBEB",
  amber800: "#92400E",
  violet50: "#EDE9FE",
  violet900: "#4C1D95",
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    backgroundColor: COLORS.white,
    paddingTop: 48,
    paddingBottom: 64,
    paddingHorizontal: 48,
    fontSize: 10,
    color: COLORS.gray900,
    lineHeight: 1.4,
  },

  // Header (fixed on every page)
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
    paddingBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  headerLeft: { flexDirection: "column", gap: 4 },
  brandName: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: COLORS.primary,
    letterSpacing: 1,
  },
  brandTagline: {
    fontSize: 8,
    color: COLORS.gray400,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  headerRight: { flexDirection: "column", alignItems: "flex-end", gap: 3 },
  refCode: { fontSize: 14, fontFamily: "Helvetica-Bold", color: COLORS.accent },
  headerDate: { fontSize: 9, color: COLORS.gray500 },

  // Section title
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLORS.accent,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 10,
    marginTop: 24,
  },

  // Proposal banner
  proposalBanner: {
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    padding: 14,
    marginBottom: 20,
  },
  proposalBannerTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: COLORS.white,
    marginBottom: 3,
  },
  proposalBannerSub: { fontSize: 9, color: COLORS.gray400 },

  // Client info
  clientSection: {
    backgroundColor: COLORS.gray50,
    borderRadius: 6,
    padding: 16,
    marginBottom: 4,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },
  clientGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  clientField: { flexDirection: "column", gap: 2, minWidth: 140, flex: 1 },
  clientLabel: {
    fontSize: 8,
    color: COLORS.gray400,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  clientValue: {
    fontSize: 10,
    color: COLORS.gray900,
    fontFamily: "Helvetica-Bold",
  },

  // Introduction
  introBox: {
    backgroundColor: COLORS.gray50,
    borderRadius: 6,
    padding: 14,
    marginBottom: 4,
  },
  introText: { fontSize: 9, color: COLORS.gray700, lineHeight: 1.7 },

  // Items table
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 2,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: COLORS.white,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  tableRowAlt: { backgroundColor: COLORS.gray50 },
  tableCell: { fontSize: 9, color: COLORS.gray700 },
  tableCellBold: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLORS.gray900,
  },

  // Column widths
  colTitle: { flex: 3 },
  colBU: { flex: 1 },
  colQty: { width: 36, textAlign: "right" as const },
  colUnit: { width: 72, textAlign: "right" as const },
  colDisc: { width: 42, textAlign: "right" as const },
  colSub: { width: 80, textAlign: "right" as const },

  // Totals
  totalsSection: { marginTop: 16, alignItems: "flex-end" as const },
  totalsBox: { width: 240 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  totalLabel: { fontSize: 9, color: COLORS.gray500 },
  totalValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLORS.gray900,
  },
  totalFinalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    padding: 10,
    marginTop: 6,
  },
  totalFinalLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COLORS.white,
  },
  totalFinalValue: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: COLORS.accent,
  },

  // Badges
  badge: {
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    alignSelf: "flex-start" as const,
  },
  badgeText: { fontSize: 8, fontFamily: "Helvetica-Bold" },

  // Notes
  notesBox: {
    backgroundColor: COLORS.gray50,
    borderRadius: 6,
    padding: 12,
  },
  notesText: { fontSize: 9, color: COLORS.gray700, lineHeight: 1.6 },

  // D3D Flow
  d3dPhaseRow: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
    alignItems: "flex-start",
  },
  d3dPhaseNum: {
    width: 24,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: COLORS.accent,
  },
  d3dPhaseTitle: {
    flex: 2,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLORS.gray900,
  },
  d3dPhaseDesc: { flex: 3, fontSize: 8, color: COLORS.gray500 },
  d3dPhaseDuration: {
    width: 60,
    fontSize: 8,
    color: COLORS.gray500,
    textAlign: "right" as const,
  },
  d3dGateRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: COLORS.accentLight,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
    alignItems: "center",
  },
  d3dGateText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: COLORS.accent,
  },

  // Payment conditions
  paymentCard: {
    backgroundColor: COLORS.gray50,
    borderRadius: 6,
    padding: 12,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.gray200,
  },
  paymentCardHighlight: {
    borderLeftColor: COLORS.accent,
    backgroundColor: COLORS.accentLight,
  },
  paymentLabel: {
    fontSize: 8,
    color: COLORS.gray500,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  paymentDescription: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: COLORS.gray900,
  },
  paymentDetails: { fontSize: 8, color: COLORS.gray500, marginTop: 2 },
  highlightBadge: {
    backgroundColor: COLORS.accent,
    borderRadius: 3,
    paddingVertical: 1,
    paddingHorizontal: 5,
    alignSelf: "flex-start" as const,
    marginBottom: 4,
  },
  highlightBadgeText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: COLORS.white,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Why TBO
  whyCard: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  whyNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.accent,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  whyNumText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLORS.white,
  },
  whyTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: COLORS.gray900,
    marginBottom: 2,
  },
  whyDesc: { fontSize: 8, color: COLORS.gray500, lineHeight: 1.5 },

  // Timeline
  timelineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 2,
    marginRight: 10,
  },
  timelineWeek: {
    width: 60,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: COLORS.gray500,
  },
  timelineTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLORS.gray900,
  },
  timelineDesc: { fontSize: 8, color: COLORS.gray500, marginTop: 1 },

  // Footer
  footer: {
    position: "absolute",
    bottom: 32,
    left: 48,
    right: 48,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: { fontSize: 8, color: COLORS.gray400 },
  pageNumber: { fontSize: 8, color: COLORS.gray400 },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function ClientField({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <View style={s.clientField}>
      <Text style={s.clientLabel}>{label}</Text>
      <Text style={s.clientValue}>{value}</Text>
    </View>
  );
}

// ─── D3D Flow Data ────────────────────────────────────────────────────────────

const D3D_PHASES: {
  num: string;
  title: string;
  desc: string;
  duration: string;
  gate?: boolean;
}[] = [
  {
    num: "00",
    title: "Briefing + Projeto Arq.",
    desc: "Plantas, cortes, fachadas, briefing de referências, definição de câmeras",
    duration: "1–2 dias",
  },
  {
    num: "01",
    title: "Direção Visual",
    desc: "Moodboard, paleta de materiais, definição de atmosfera",
    duration: "2–3 dias",
  },
  {
    num: "02",
    title: "Modelagem 3D",
    desc: "Construção do modelo estrutural, paisagismo, interiores e setup de cena",
    duration: "10–12 dias",
  },
  {
    num: "03",
    title: "Clay Render",
    desc: "Validação volumétrica — render sem materiais para aprovação de formas",
    duration: "até 5 dias",
  },
  {
    num: "",
    title: "Aprovação do Clay",
    desc: "Entrega ao cliente para validação",
    duration: "",
    gate: true,
  },
  {
    num: "04",
    title: "Emissão Inicial",
    desc: "1ª rodada de render com materiais, ambientação e humanização",
    duration: "15–20 dias",
  },
  {
    num: "",
    title: "Considerações sobre Emissão Inicial",
    desc: "Entrega ao cliente",
    duration: "",
    gate: true,
  },
  {
    num: "05",
    title: "R01 — 2ª Rodada",
    desc: "Ajustes de materiais, iluminação e vegetação detalhada",
    duration: "3–5 dias",
  },
  {
    num: "",
    title: "Considerações sobre R01",
    desc: "Entrega ao cliente",
    duration: "",
    gate: true,
  },
  {
    num: "06",
    title: "R02 — 3ª Rodada",
    desc: "Pós-produção, color grading, máx. 1 rodada de ajustes finais",
    duration: "3–5 dias",
  },
  {
    num: "",
    title: "Aprovação final",
    desc: "Entrega ao cliente para aprovação",
    duration: "",
    gate: true,
  },
  {
    num: "07",
    title: "Entrega Final",
    desc: "Renders alta resolução (TIFF/PNG 300dpi), web (JPG 72dpi), handoff AV",
    duration: "1–2 dias",
  },
];

// ─── Why TBO Data ─────────────────────────────────────────────────────────────

const WHY_TBO = [
  {
    title: "115+ projetos entregues",
    desc: "Portfólio consolidado em visualização para lançamentos imobiliários em Curitiba, Florianópolis, São Paulo e litoral.",
  },
  {
    title: "Equipe dedicada de artistas 3D",
    desc: "Time especializado exclusivamente em archviz imobiliário — não somos generalistas, somos especialistas em lançamento.",
  },
  {
    title: "Processo D3D com controle de qualidade",
    desc: "Metodologia proprietária com gates de aprovação em cada fase. Nada avança sem validação técnica e do cliente.",
  },
  {
    title: "Integração com branding e marketing",
    desc: "Entendemos de lançamento imobiliário, não só de render. Cada imagem é pensada para um canal e um objetivo comercial específico.",
  },
];

// ─── Timeline Data ────────────────────────────────────────────────────────────

const TIMELINE_STAGES = [
  {
    week: "Sem. 1–2",
    title: "Kickoff",
    desc: "Briefing, análise do projeto, definição de câmeras",
    color: COLORS.accent,
  },
  {
    week: "Sem. 3–5",
    title: "Modelagem",
    desc: "Construção 3D, texturas, iluminação base, clay render",
    color: COLORS.gray700,
  },
  {
    week: "Sem. 6–7",
    title: "Revisão",
    desc: "2 rodadas de ajustes, pós-produção, color grading",
    color: COLORS.gray600,
  },
  {
    week: "Sem. 8",
    title: "Entrega",
    desc: "Renderização final, organização de assets, backup",
    color: COLORS.primary,
  },
];

// ─── PDF Document ─────────────────────────────────────────────────────────────

interface ProposalPDFTemplateProps {
  proposal: ProposalWithItems;
  logoBase64?: string;
}

export function ProposalPDFTemplate({
  proposal,
  logoBase64,
}: ProposalPDFTemplateProps) {
  const {
    items,
    name,
    ref_code,
    client,
    company,
    contact_name,
    contact_email,
    contact_phone,
    project_type,
    project_location,
    subtotal,
    discount_amount,
    value,
    notes,
    introduction,
    show_d3d_flow,
    payment_conditions,
    valid_days,
    urgency_flag,
    package_discount_flag,
    created_at,
  } = proposal;

  const showD3D = show_d3d_flow ?? false;
  const paymentOptions: PaymentConditionOption[] = Array.isArray(
    payment_conditions,
  )
    ? payment_conditions
    : [];

  return (
    <Document
      title={`Proposta ${ref_code ?? name} — TBO`}
      author="TBO — The Branding Office"
      subject="Proposta Comercial"
      creator="TBO OS"
    >
      <Page size="A4" style={s.page}>
        {/* ── Header (fixed) ── */}
        <View style={s.header} fixed>
          <View style={s.headerLeft}>
            {logoBase64 ? (
              <Image
                src={logoBase64}
                style={{ width: 80, height: 24, objectFit: "contain" }}
              />
            ) : (
              <>
                <Text style={s.brandName}>TBO</Text>
                <Text style={s.brandTagline}>The Branding Office</Text>
              </>
            )}
          </View>
          <View style={s.headerRight}>
            {ref_code && <Text style={s.refCode}>{ref_code}</Text>}
            <Text style={s.headerDate}>
              Emitida em {formatDate(created_at)}
            </Text>
            {valid_days > 0 && (
              <Text style={s.headerDate}>Válida por {valid_days} dias</Text>
            )}
          </View>
        </View>

        {/* ── Proposal banner ── */}
        <View style={s.proposalBanner}>
          <Text style={s.proposalBannerTitle}>{name}</Text>
          <View
            style={{ flexDirection: "row", gap: 12, alignItems: "center" }}
          >
            {project_type && (
              <Text style={s.proposalBannerSub}>{project_type}</Text>
            )}
            {project_location && (
              <Text style={s.proposalBannerSub}>• {project_location}</Text>
            )}
          </View>
        </View>

        {/* ── Client info ── */}
        <Text style={s.sectionTitle}>Dados do Cliente</Text>
        <View style={s.clientSection}>
          <View style={s.clientGrid}>
            <ClientField label="Empresa" value={company ?? client} />
            <ClientField label="Contato" value={contact_name} />
            <ClientField label="E-mail" value={contact_email} />
            <ClientField label="Telefone" value={contact_phone} />
          </View>
        </View>

        {/* ── Introduction / Context ── */}
        {introduction && (
          <>
            <Text style={s.sectionTitle}>Contexto do Projeto</Text>
            <View style={s.introBox}>
              <Text style={s.introText}>{introduction}</Text>
            </View>
          </>
        )}

        {/* ── D3D Flow ── */}
        {showD3D && (
          <>
            <Text style={s.sectionTitle}>Processo D3D</Text>
            <View
              style={{
                borderWidth: 1,
                borderColor: COLORS.gray200,
                borderRadius: 6,
                overflow: "hidden",
              }}
            >
              {D3D_PHASES.map((phase, i) =>
                phase.gate ? (
                  <View key={`gate-${i}`} style={s.d3dGateRow}>
                    <Text style={s.d3dGateText}>
                      GATE — {phase.title}
                    </Text>
                  </View>
                ) : (
                  <View
                    key={`phase-${i}`}
                    style={[
                      s.d3dPhaseRow,
                      i % 2 === 0 && !phase.gate
                        ? { backgroundColor: COLORS.gray50 }
                        : {},
                    ]}
                  >
                    <Text style={s.d3dPhaseNum}>{phase.num}</Text>
                    <Text style={s.d3dPhaseTitle}>{phase.title}</Text>
                    <Text style={s.d3dPhaseDesc}>{phase.desc}</Text>
                    <Text style={s.d3dPhaseDuration}>{phase.duration}</Text>
                  </View>
                ),
              )}
            </View>
          </>
        )}

        {/* ── Scope table ── */}
        <Text style={s.sectionTitle}>Escopo de Serviços</Text>
        <View style={s.tableHeader}>
          <Text style={[s.tableHeaderCell, s.colTitle]}>Serviço</Text>
          <Text style={[s.tableHeaderCell, s.colBU]}>BU</Text>
          <Text style={[s.tableHeaderCell, s.colQty]}>Qtd</Text>
          <Text style={[s.tableHeaderCell, s.colUnit]}>Valor unit.</Text>
          <Text style={[s.tableHeaderCell, s.colDisc]}>Desc.</Text>
          <Text style={[s.tableHeaderCell, s.colSub]}>Subtotal</Text>
        </View>
        {items.map((item: ProposalItemRow, i: number) => (
          <View
            key={item.id}
            style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}
          >
            <View style={s.colTitle}>
              <Text style={s.tableCellBold}>{item.title}</Text>
              {item.description && (
                <Text
                  style={[s.tableCell, { marginTop: 2, color: COLORS.gray400 }]}
                >
                  {item.description}
                </Text>
              )}
            </View>
            <Text style={[s.tableCell, s.colBU]}>{item.bu ?? "—"}</Text>
            <Text style={[s.tableCell, s.colQty]}>{item.quantity}</Text>
            <Text style={[s.tableCell, s.colUnit]}>
              {formatCurrency(item.unit_price)}
            </Text>
            <Text style={[s.tableCell, s.colDisc]}>
              {item.discount_pct > 0 ? `${item.discount_pct}%` : "—"}
            </Text>
            <Text style={[s.tableCellBold, s.colSub]}>
              {formatCurrency(item.subtotal)}
            </Text>
          </View>
        ))}

        {/* ── Badges ── */}
        {(urgency_flag || package_discount_flag) && (
          <View style={{ flexDirection: "row", gap: 6, marginTop: 10 }}>
            {urgency_flag && (
              <View style={[s.badge, { backgroundColor: COLORS.amber50 }]}>
                <Text style={[s.badgeText, { color: COLORS.amber800 }]}>
                  URGENCIA APLICADA
                </Text>
              </View>
            )}
            {package_discount_flag && (
              <View style={[s.badge, { backgroundColor: COLORS.violet50 }]}>
                <Text style={[s.badgeText, { color: COLORS.violet900 }]}>
                  DESCONTO PACOTE
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── Totals ── */}
        <View style={s.totalsSection}>
          <View style={s.totalsBox}>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Subtotal</Text>
              <Text style={s.totalValue}>{formatCurrency(subtotal)}</Text>
            </View>
            {discount_amount > 0 && (
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Desconto</Text>
                <Text style={[s.totalValue, { color: "#EF4444" }]}>
                  - {formatCurrency(discount_amount)}
                </Text>
              </View>
            )}
            <View style={s.totalFinalRow}>
              <Text style={s.totalFinalLabel}>Valor Total</Text>
              <Text style={s.totalFinalValue}>{formatCurrency(value)}</Text>
            </View>
          </View>
        </View>

        {/* ── Payment conditions ── */}
        {paymentOptions.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Condições de Pagamento</Text>
            <Text style={{ fontSize: 9, color: COLORS.gray500, marginBottom: 8 }}>
              Investimento total de {formatCurrency(value)} com as seguintes
              opções:
            </Text>
            {paymentOptions.map(
              (opt: PaymentConditionOption, i: number) => (
                <View
                  key={i}
                  style={[
                    s.paymentCard,
                    opt.highlight ? s.paymentCardHighlight : {},
                  ]}
                >
                  {opt.highlight && (
                    <View style={s.highlightBadge}>
                      <Text style={s.highlightBadgeText}>Recomendado</Text>
                    </View>
                  )}
                  <Text style={s.paymentLabel}>{opt.label}</Text>
                  <Text style={s.paymentDescription}>{opt.description}</Text>
                  {opt.details && (
                    <Text style={s.paymentDetails}>{opt.details}</Text>
                  )}
                </View>
              ),
            )}
            <Text
              style={{
                fontSize: 8,
                color: COLORS.gray400,
                marginTop: 4,
              }}
            >
              Pagamento via boleto bancário emitido pela TBO, com vencimento
              vinculado aos marcos de entrega.
            </Text>
          </>
        )}

        {/* ── Why TBO ── */}
        {showD3D && (
          <>
            <Text style={s.sectionTitle}>Por que a TBO</Text>
            {WHY_TBO.map((item, i) => (
              <View key={i} style={s.whyCard}>
                <View style={s.whyNum}>
                  <Text style={s.whyNumText}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.whyTitle}>{item.title}</Text>
                  <Text style={s.whyDesc}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* ── Timeline ── */}
        {showD3D && (
          <>
            <Text style={s.sectionTitle}>Timeline Indicativa</Text>
            {TIMELINE_STAGES.map((stage, i) => (
              <View key={i} style={s.timelineRow}>
                <View
                  style={[s.timelineDot, { backgroundColor: stage.color }]}
                />
                <Text style={s.timelineWeek}>{stage.week}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.timelineTitle}>{stage.title}</Text>
                  <Text style={s.timelineDesc}>{stage.desc}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* ── Notes ── */}
        {notes && (
          <>
            <Text style={s.sectionTitle}>Observações e Garantias</Text>
            <View style={s.notesBox}>
              <Text style={s.notesText}>{notes}</Text>
            </View>
          </>
        )}

        {/* ── Footer (fixed) ── */}
        <View style={s.footer} fixed>
          <View>
            <Text style={s.footerText}>
              TBO — The Branding Office · contato@agenciatbo.com.br
            </Text>
            <Text style={s.footerText}>
              Esta proposta é válida por {valid_days} dias a partir da emissão.
            </Text>
          </View>
          <Text
            style={s.pageNumber}
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
