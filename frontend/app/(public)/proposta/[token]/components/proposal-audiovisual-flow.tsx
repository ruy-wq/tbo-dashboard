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
    title: "Briefing + Imersão",
    subtitle: "Kickoff",
    description:
      "Recebimento do briefing do empreendimento, alinhamento de objetivos, mensagem-chave, público e referências audiovisuais com a incorporadora.",
    deliverables: [
      { text: "Briefing do empreendimento" },
      { text: "Referências audiovisuais" },
      { text: "Objetivo e mensagem-chave" },
      { text: "Cronograma + data de captação" },
    ],
    tag: "INPUT",
    owner: "Cliente + TBO",
    variant: "start",
  },
  {
    step: "01",
    title: "Roteiro + Storyboard",
    subtitle: "Pré-produção",
    description:
      "Desenvolvimento do roteiro, storyboard e direção narrativa. Estrutura das cenas, decupagem e plano de captação.",
    deliverables: [
      { text: "Roteiro do filme", iconColor: "ref" },
      { text: "Storyboard", iconColor: "ref" },
      { text: "Decupagem de cenas", iconColor: "ref" },
    ],
    tag: "PRODUÇÃO",
    owner: "TBO",
    gateAfter: { label: "Entrega ao cliente", action: "Aprovação do Roteiro" },
  },
  {
    step: "02",
    title: "PPM",
    subtitle: "Pre Production Meeting",
    description:
      "Reunião de pré-produção: alinhamento final de cenas, locações, elenco/entrevistados, cronograma de diária e logística de deslocamento.",
    deliverables: [
      { text: "Plano de captação + diária", iconColor: "model" },
      { text: "Logística e deslocamento", iconColor: "model" },
      { text: "Definição de entrevistados", iconColor: "model" },
    ],
    tag: "PRODUÇÃO",
    owner: "TBO",
  },
  {
    step: "03",
    title: "Captação",
    subtitle: "Diária de filmagem",
    description:
      "Diária de captação no local — imagens em movimento, tomadas aéreas com drone e entrevistas. Direção em set garantindo a narrativa planejada.",
    deliverables: [
      { text: "Captação principal + entrevistas", iconColor: "render", tags: { format: "4K", res: "RAW/LOG" } },
      { text: "Captação aérea (drone)", iconColor: "render" },
      { text: "Backup de material em set", iconColor: "render" },
    ],
    tag: "PRODUÇÃO",
    owner: "TBO",
  },
  {
    step: "04",
    title: "Animações 3D",
    subtitle: "Integração CGI",
    description:
      "Produção das animações 3D do empreendimento que serão integradas ao filme — conectando a captação real com a visualização do projeto.",
    deliverables: [
      { text: "Animações 3D (45s)", iconColor: "model" },
      { text: "Integração com captação real", iconColor: "model" },
    ],
    tag: "PRODUÇÃO",
    owner: "TBO",
  },
  {
    step: "05",
    title: "Áudio",
    subtitle: "Trilha + sound design",
    description:
      "Trilha sonora, mixagem, sound design e locução. A camada sonora que dá ritmo, emoção e identidade ao filme.",
    deliverables: [
      { text: "Trilha sonora + mixagem", iconColor: "brand" },
      { text: "Sound design", iconColor: "brand" },
      { text: "Locução", iconColor: "brand" },
    ],
    tag: "PRODUÇÃO",
    owner: "TBO",
  },
  {
    step: "06",
    title: "Edição + Pós",
    subtitle: "Montagem e finalização",
    description:
      "Montagem, lettering, color grading e assinaturas. Composição do Filme de Lançamento, da versão Redução e do Making Of.",
    deliverables: [
      { text: "Montagem + lettering", iconColor: "render" },
      { text: "Color grading", iconColor: "render" },
      { text: "Filme + Redução + Making Of", iconColor: "render", tags: { format: "MP4 / MOV", res: "4K + Web" } },
    ],
    tag: "PRODUÇÃO",
    owner: "TBO",
    gateAfter: { label: "Entrega ao cliente", action: "Aprovação Final" , approved: true },
  },
  {
    step: "07",
    title: "Entrega Final",
    subtitle: "Pacote de Vídeos",
    description:
      "Entrega de todos os vídeos finalizados em alta resolução e versões para web/redes. Organização no Drive com estrutura padrão TBO.",
    deliverables: [
      { text: "Filme de Lançamento", tags: { format: "MP4 / MOV", res: "4K" } },
      { text: "Versão Redução (mídias)", tags: { format: "MP4", res: "Web + Vertical" } },
      { text: "Making Of", tags: { format: "MP4", channel: "Google Drive" } },
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

export function ProposalAudiovisualFlow() {
  return (
    <section id="section-audiovisual-flow" className="scroll-mt-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] sm:text-xs font-bold text-[#E85102] uppercase tracking-wider">
              Pipeline · Audiovisual
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mb-1 sm:mb-2">
            Audiovisual — Fluxo de Projeto
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500">
            Pipeline completo: do briefing à entrega do Filme de Lançamento, Redução e Making Of.
          </p>
        </div>

        <div className="mb-5 sm:mb-6 bg-white rounded-xl border shadow-sm p-3 sm:p-5 flex gap-4 sm:gap-6">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-zinc-900">8</div>
            <div className="text-[10px] sm:text-xs text-zinc-400 uppercase tracking-wide mt-1">Fases</div>
          </div>
          <div className="border-l border-zinc-200" />
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-zinc-900">3</div>
            <div className="text-[10px] sm:text-xs text-zinc-400 uppercase tracking-wide mt-1">Entregáveis</div>
          </div>
          <div className="border-l border-zinc-200" />
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-zinc-900">1</div>
            <div className="text-[10px] sm:text-xs text-zinc-400 uppercase tracking-wide mt-1">Diária</div>
          </div>
        </div>

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
              const footerBorder = isStart ? "border-white/12" : isEnd ? "border-white/8" : "border-zinc-100";
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
                    className={`${cardBg} border rounded-2xl shadow-sm hover:shadow-md transition-all w-[240px] sm:w-[260px] flex-shrink-0 flex flex-col overflow-hidden`}
                  >
                    <div className="px-4 pt-4 sm:px-5 sm:pt-5 flex items-start gap-3">
                      <div className={`${stepBg} w-7 h-7 rounded border flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                        {phase.step}
                      </div>
                      <div className="flex-1">
                        <div className={`${titleColor} text-sm font-bold leading-tight`}>{phase.title}</div>
                        <div className={`${subtitleColor} text-[11px] mt-0.5`}>{phase.subtitle}</div>
                      </div>
                    </div>

                    <div className="px-4 pt-3 pb-2 sm:px-5">
                      <p className={`${descColor} text-[12px] leading-relaxed`}>{phase.description}</p>
                    </div>

                    <div className="px-4 pb-3 sm:px-5 flex flex-col gap-1.5">
                      {phase.deliverables.map((d, di) => (
                        <div key={di} className={`${delivBg} flex items-start gap-2 px-2.5 py-1.5 rounded-md border text-[11px]`}>
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 text-[9px] mt-0.5 ${
                              isStart || isEnd ? "bg-white/15 text-white" : d.iconColor ? ICON_BG[d.iconColor] : "bg-emerald-500/15 text-emerald-600"
                            }`}
                          >
                            ◆
                          </div>
                          <div className="flex-1">
                            <div>{d.text}</div>
                            {d.tags && (
                              <div className="flex gap-1 flex-wrap mt-1">
                                {d.tags.format && <span className={`${SPEC_TAG.format} text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide`}>{d.tags.format}</span>}
                                {d.tags.res && <span className={`${SPEC_TAG.res} text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide`}>{d.tags.res}</span>}
                                {d.tags.channel && <span className={`${SPEC_TAG.channel} text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide`}>{d.tags.channel}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className={`mt-auto px-4 py-3 sm:px-5 border-t ${footerBorder} flex items-center justify-between`}>
                      <span className={`${tagClass} text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide`}>{phase.tag}</span>
                      <span className={`text-[11px] ${isStart ? "text-white/50" : isEnd ? "text-white/40" : "text-zinc-400"}`}>{phase.owner}</span>
                    </div>
                  </motion.div>

                  {phase.gateAfter && (
                    <div className="flex flex-col items-center justify-center px-2 sm:px-3 min-w-[100px] sm:min-w-[120px]">
                      <div
                        className={`w-8 h-8 rounded-md ${phase.gateAfter.approved ? "bg-emerald-500/15 border-emerald-500/30" : "bg-amber-500/15 border-amber-500/30"} border flex items-center justify-center mb-1.5`}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M12 2L22 12L12 22L2 12Z" fill={phase.gateAfter.approved ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)"} stroke={phase.gateAfter.approved ? "#10B981" : "#F59E0B"} strokeWidth="1.5" />
                        </svg>
                      </div>
                      <div className="text-[9px] text-zinc-400 uppercase tracking-wide text-center">{phase.gateAfter.label}</div>
                      <div className={`text-[10px] font-medium text-center mt-0.5 leading-tight ${phase.gateAfter.approved ? "text-emerald-600" : "text-amber-600"}`}>
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
          Cada entrega ao cliente (Roteiro, Corte Final) requer aprovação formal antes de avançar. Rodadas adicionais de ajuste além das previstas são escopo extra.
        </p>
      </motion.div>
    </section>
  );
}
