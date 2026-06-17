"use client";

import { motion } from "framer-motion";

interface Deliverable {
  text: string;
  tags?: { format?: string; res?: string; channel?: string };
  iconColor?: "ref" | "model" | "render" | "check" | "brand";
}

interface Phase {
  step: string;
  title: string;
  subtitle: string;
  description: string;
  deliverables: Deliverable[];
  tag: "INPUT" | "PRODUÇÃO" | "OUTPUT";
  owner: string;
  variant?: "start" | "end";
  gateAfter?: { label: string; action: string; approved?: boolean };
}

const PHASES: Phase[] = [
  {
    step: "00",
    title: "Briefing Estratégico",
    subtitle: "Kickoff",
    description:
      "Recebimento do briefing do empreendimento, análise de posicionamento, público-alvo, diferenciais e alinhamento de expectativas com a incorporadora.",
    deliverables: [
      { text: "Briefing do empreendimento" },
      { text: "Posicionamento + público-alvo" },
      { text: "Referências visuais do cliente" },
      { text: "Projeto arquitetônico (plantas/fachadas)" },
    ],
    tag: "INPUT",
    owner: "Cliente + TBO",
    variant: "start",
  },
  {
    step: "01",
    title: "Pesquisa + Conceito",
    subtitle: "Imersão estratégica",
    description:
      "Análise de mercado, concorrência e tendências. Construção do território de marca: conceito, narrativa e diretrizes visuais iniciais.",
    deliverables: [
      { text: "Análise de mercado + concorrência", iconColor: "ref" },
      { text: "Moodboard conceitual", iconColor: "ref" },
      { text: "Território de marca + narrativa", iconColor: "ref" },
    ],
    tag: "PRODUÇÃO",
    owner: "TBO",
  },
  {
    step: "02",
    title: "Naming + Identidade",
    subtitle: "Criação da marca",
    description:
      "Desenvolvimento do naming (quando aplicável), logotipo, paleta cromática, tipografia e elementos gráficos da identidade do empreendimento.",
    deliverables: [
      { text: "Logotipo + variações", iconColor: "brand", tags: { format: "AI / SVG / PNG", res: "Vetorial" } },
      { text: "Paleta cromática + tipografia", iconColor: "brand" },
      { text: "Elementos gráficos / patterns", iconColor: "brand" },
      { text: "Brandboard resumo", iconColor: "brand", tags: { format: "PDF", channel: "Google Drive" } },
    ],
    tag: "PRODUÇÃO",
    owner: "TBO",
    gateAfter: { label: "Entrega ao cliente", action: "Aprovação da Identidade" },
  },
  {
    step: "03",
    title: "Key Visual",
    subtitle: "Direção de arte aplicada",
    description:
      "Construção do key visual da campanha: composição de peça-chave com identidade, renders e linguagem visual que guiará todos os desdobramentos.",
    deliverables: [
      { text: "Key visual master", iconColor: "model", tags: { format: "PSD / AI", res: "Alta resolução" } },
      { text: "Composição com renders 3D", iconColor: "model" },
      { text: "Headline + tom de voz da campanha", iconColor: "model" },
    ],
    tag: "PRODUÇÃO",
    owner: "TBO",
    gateAfter: { label: "Entrega ao cliente", action: "Aprovação Key Visual" },
  },
  {
    step: "04",
    title: "Book de Vendas",
    subtitle: "Material comercial",
    description:
      "Diagramação do book de vendas com plantas humanizadas, renders, diferenciais, ficha técnica e tabela de unidades. Material principal do corretor.",
    deliverables: [
      { text: "Book digital (interativo)", iconColor: "render", tags: { format: "PDF", res: "Web 72dpi", channel: "Google Drive" } },
      { text: "Book impresso (gráfica)", iconColor: "render", tags: { format: "PDF / INDD", res: "300dpi CMYK" } },
      { text: "Plantas humanizadas integradas", iconColor: "render" },
    ],
    tag: "PRODUÇÃO",
    owner: "TBO",
  },
  {
    step: "05",
    title: "Materiais Gráficos",
    subtitle: "Campanha + PDV",
    description:
      "Desdobramento do key visual em peças de campanha, sinalização de PDV, tapume, outdoor, folder, convite e demais materiais gráficos de lançamento.",
    deliverables: [
      { text: "Folder / lâmina", iconColor: "model", tags: { format: "PDF / AI", res: "300dpi CMYK" } },
      { text: "Tapume + outdoor + bandeira", iconColor: "model" },
      { text: "Sinalização de PDV / stand", iconColor: "model" },
      { text: "Convite de lançamento", iconColor: "model" },
    ],
    tag: "PRODUÇÃO",
    owner: "TBO",
    gateAfter: { label: "Entrega ao cliente", action: "Considerações sobre Materiais" },
  },
  {
    step: "06",
    title: "Social Media + Web",
    subtitle: "Digital",
    description:
      "Criação de criativos para redes sociais, landing page do empreendimento e templates de stories/reels para a campanha digital.",
    deliverables: [
      { text: "Grid de lançamento (feed)", iconColor: "render", tags: { format: "PNG / JPG", res: "1080×1080" } },
      { text: "Templates stories / reels", iconColor: "render", tags: { format: "PSD / Canva", res: "1080×1920" } },
      { text: "Landing page", iconColor: "render", tags: { format: "HTML / Figma", channel: "Web" } },
      { text: "Criativos de tráfego pago", iconColor: "render" },
    ],
    tag: "PRODUÇÃO",
    owner: "TBO",
  },
  {
    step: "07",
    title: "R01",
    subtitle: "1ª Rodada de Ajustes",
    description:
      "Ajustes em todos os materiais com base nas considerações do cliente. Refinamento de textos, imagens, cores e composições.",
    deliverables: [
      { text: "Ajustes de identidade (se necessário)", iconColor: "check" },
      { text: "Revisão book de vendas", iconColor: "check" },
      { text: "Revisão materiais gráficos + PDV", iconColor: "check" },
      { text: "Revisão social media + landing page", iconColor: "check" },
    ],
    tag: "PRODUÇÃO",
    owner: "TBO",
    gateAfter: { label: "Entrega ao cliente", action: "Considerações sobre R01" },
  },
  {
    step: "08",
    title: "R02",
    subtitle: "2ª Rodada — Final",
    description:
      "Últimos ajustes pontuais. Fechamento de arquivos para gráfica, web e digital. Máximo de 1 rodada de correções após esta entrega.",
    deliverables: [
      { text: "Correções pontuais finais", iconColor: "check" },
      { text: "Fechamento para gráfica", iconColor: "render", tags: { format: "PDF / AI", res: "CMYK 300dpi" } },
      { text: "Máx. 1 rodada adicional de ajustes", iconColor: "check" },
    ],
    tag: "PRODUÇÃO",
    owner: "TBO",
    gateAfter: { label: "Entrega ao cliente", action: "Aprovação final", approved: true },
  },
  {
    step: "09",
    title: "Entrega Final",
    subtitle: "Kit de Lançamento",
    description:
      "Empacotamento e entrega de todos os assets finais aprovados. Organização no Drive com estrutura padrão TBO por categoria de material.",
    deliverables: [
      { text: "Identidade visual completa", tags: { format: "AI / SVG / PNG / PDF", res: "Vetorial + Bitmap" } },
      { text: "Book de vendas (digital + gráfica)", tags: { format: "PDF / INDD", res: "72dpi + 300dpi" } },
      { text: "Materiais gráficos fechados", tags: { format: "PDF / AI", res: "CMYK 300dpi" } },
      { text: "Kit social media + landing page", tags: { format: "PNG / PSD / HTML", channel: "Web + Redes" } },
      { text: "Arquivos-fonte + brandboard", tags: { channel: "Google Drive" } },
    ],
    tag: "OUTPUT",
    owner: "Cliente",
    variant: "end",
  },
];

const ICON_BG: Record<string, string> = {
  ref: "bg-blue-500/10 text-blue-600",
  model: "bg-[#E85102]/10 text-[#E85102]",
  render: "bg-emerald-500/10 text-emerald-600",
  check: "bg-amber-500/10 text-amber-600",
  brand: "bg-purple-500/10 text-purple-600",
};

const TAG_BG: Record<string, string> = {
  INPUT: "bg-blue-500/10 text-blue-600",
  PRODUÇÃO: "bg-[#E85102]/10 text-[#E85102]",
  OUTPUT: "bg-emerald-500/10 text-emerald-600",
};

const SPEC_TAG: Record<string, string> = {
  format: "bg-blue-500/10 text-blue-600",
  res: "bg-purple-500/10 text-purple-600",
  channel: "bg-emerald-500/10 text-emerald-600",
};

export function ProposalBrandingFlow() {
  return (
    <section id="section-branding-flow" className="scroll-mt-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] sm:text-xs font-bold text-[#E85102] uppercase tracking-wider">
              Pipeline · Branding
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mb-1 sm:mb-2">
            Branding Imobiliário — Fluxo de Projeto
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500">
            Pipeline completo: do briefing estratégico à entrega final do kit de lançamento.
          </p>
        </div>

        <div className="mb-5 sm:mb-6 bg-white rounded-xl border shadow-sm p-3 sm:p-5 flex gap-4 sm:gap-6">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-zinc-900">10</div>
            <div className="text-[10px] sm:text-xs text-zinc-400 uppercase tracking-wide mt-1">Fases</div>
          </div>
          <div className="border-l border-zinc-200" />
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-zinc-900">5</div>
            <div className="text-[10px] sm:text-xs text-zinc-400 uppercase tracking-wide mt-1">Entregas</div>
          </div>
          <div className="border-l border-zinc-200" />
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-zinc-900">3</div>
            <div className="text-[10px] sm:text-xs text-zinc-400 uppercase tracking-wide mt-1">Rodadas</div>
          </div>
        </div>

        {/* Cards horizontal scroll */}
        <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-3 min-w-max">
            {PHASES.map((phase, idx) => {
              const isStart = phase.variant === "start";
              const isEnd = phase.variant === "end";
              const cardBg = isStart
                ? "bg-[#E85102] border-[#E85102]"
                : isEnd
                ? "bg-zinc-900 border-zinc-900"
                : "bg-white border-zinc-200";
              const titleColor = isStart || isEnd ? "text-white" : "text-zinc-900";
              const subtitleColor = isStart ? "text-white/65" : isEnd ? "text-white/45" : "text-zinc-400";
              const descColor = isStart ? "text-white/75" : isEnd ? "text-white/55" : "text-zinc-600";
              const stepBg = isStart
                ? "bg-white/20 text-white border-white/15"
                : isEnd
                ? "bg-white/10 text-white/60 border-white/8"
                : "bg-zinc-50 text-zinc-600 border-zinc-200";
              const delivBg = isStart
                ? "bg-white/8 border-white/12 text-white/70"
                : isEnd
                ? "bg-white/5 border-white/8 text-white/60"
                : "bg-zinc-50 border-zinc-100 text-zinc-600";
              const footerBorder = isStart
                ? "border-white/12"
                : isEnd
                ? "border-white/8"
                : "border-zinc-100";
              const tagClass = isStart
                ? "bg-white/15 text-white"
                : isEnd
                ? "bg-emerald-500/15 text-emerald-300"
                : TAG_BG[phase.tag];

              return (
                <div key={idx} className="flex items-stretch">
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                    className={`${cardBg} border rounded-2xl shadow-sm hover:shadow-md transition-all w-[170px] sm:w-[185px] flex-shrink-0 flex flex-col overflow-hidden`}
                  >
                    <div className="px-3.5 pt-3.5 sm:px-4 sm:pt-4 flex items-start gap-2.5">
                      <div className={`${stepBg} w-6 h-6 rounded border flex items-center justify-center text-[11px] font-bold flex-shrink-0`}>
                        {phase.step}
                      </div>
                      <div className="flex-1">
                        <div className={`${titleColor} text-[13px] font-bold leading-tight`}>{phase.title}</div>
                        <div className={`${subtitleColor} text-[10px] mt-0.5`}>{phase.subtitle}</div>
                      </div>
                    </div>

                    <div className="px-3.5 pt-2.5 pb-3 sm:px-4 flex flex-col gap-1">
                      {phase.deliverables.slice(0, 3).map((d, di) => (
                        <div
                          key={di}
                          className={`${delivBg} flex items-center gap-2 px-2 py-1 rounded text-[10.5px]`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isStart || isEnd ? "bg-white/60" : "bg-[#E85102]"}`} />
                          <div className="flex-1 leading-tight">{d.text}</div>
                        </div>
                      ))}
                    </div>

                    <div className={`mt-auto px-3.5 py-2.5 sm:px-4 border-t ${footerBorder} flex items-center justify-between`}>
                      <span className={`${tagClass} text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wide`}>
                        {phase.tag}
                      </span>
                      <span className={`text-[10px] ${isStart ? "text-white/50" : isEnd ? "text-white/40" : "text-zinc-400"}`}>
                        {phase.owner}
                      </span>
                    </div>
                  </motion.div>

                  {phase.gateAfter && (
                    <div className="flex flex-col items-center justify-center px-2 sm:px-3 min-w-[100px] sm:min-w-[120px]">
                      <div
                        className={`w-8 h-8 rounded-md ${
                          phase.gateAfter.approved
                            ? "bg-emerald-500/15 border-emerald-500/30"
                            : "bg-amber-500/15 border-amber-500/30"
                        } border flex items-center justify-center mb-1.5`}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M12 2L22 12L12 22L2 12Z"
                            fill={phase.gateAfter.approved ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)"}
                            stroke={phase.gateAfter.approved ? "#10B981" : "#F59E0B"}
                            strokeWidth="1.5"
                          />
                        </svg>
                      </div>
                      <div className="text-[9px] text-zinc-400 uppercase tracking-wide text-center">
                        {phase.gateAfter.label}
                      </div>
                      <div
                        className={`text-[10px] font-medium text-center mt-0.5 leading-tight ${
                          phase.gateAfter.approved ? "text-emerald-600" : "text-amber-600"
                        }`}
                      >
                        {phase.gateAfter.action}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-[10px] sm:text-xs text-zinc-400 mt-3 sm:mt-4 text-center">
          Cada entrega ao cliente (Identidade, Key Visual, Materiais, R01, R02) requer aprovação formal antes de iniciar a próxima fase. Rodadas além da R02 são escopo extra.
        </p>
      </motion.div>
    </section>
  );
}
