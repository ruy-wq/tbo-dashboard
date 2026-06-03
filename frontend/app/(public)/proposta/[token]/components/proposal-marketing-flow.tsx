"use client";

import { motion } from "framer-motion";

interface Phase {
  title: string;
  subtitle?: string;
  description?: string;
  deliverables?: string[];
  variant?: "accent" | "warm" | "elevated" | "campaign";
  width?: "default" | "wide";
}

interface Gate {
  type: "gate";
  label: string;
  approved?: boolean;
}

type Item = Phase | Gate;

const isGate = (i: Item): i is Gate => (i as Gate).type === "gate";

// Fase 1 — Setup do Cliente
const FASE_1: Item[] = [
  { title: "Contrato Assinado", description: "Contrato assinado → cliente operando dentro de casa · valor cobrado ao cliente.", variant: "accent" },
  { title: "1. Passagem de bastão", subtitle: "Ruy / Gustavo → Equipe", description: "Briefing comercial, público-alvo e expectativas do cliente." },
  { title: "2. Cronograma geral", subtitle: "Carol · Marco · Rafa", description: "Datas, dependências e o que o cliente precisa entregar + briefings internos por núcleo." },
  { title: "3. Reunião interna de equipe", subtitle: "Carol · Marco · Rafa → BUs", description: "Apresentação do cronograma geral + solicitação de briefing por BU." },
  { title: "4. Unificação dos briefings", subtitle: "Carol", description: "Carol consolida todos os briefings dos BUs em documento único." },
  {
    title: "5. Onboarding: Dream Team",
    subtitle: "Carol lidera · toda equipe + cliente",
    variant: "warm",
    width: "wide",
    deliverables: [
      "Apresentação da equipe e papéis",
      "Ponto de contato por BU",
      "Cronograma + briefing ao cliente",
      "Todos com câmera aberta",
    ],
  },
  { title: "6. Execução interna", description: "Cada BU executa com briefing em mãos." },
  { title: "Setup Completo", description: "Cliente configurado, equipe alinhada, briefings distribuídos. Pronto para iniciar a estratégia.", variant: "accent" },
];

// Fase 2 — Estratégia & Desenvolvimento
const FASE_2: Item[] = [
  { title: "Fechamento do Contrato", description: "Assinatura do contrato de prestação de serviços de marketing.", variant: "accent" },
  { title: "Briefing", description: "Reunião de imersão com o cliente para levantamento de informações, objetivos, público-alvo e contexto do empreendimento." },
  { title: "Pesquisas", description: "Pesquisa de mercado, concorrência, cenário macroeconômico, público e comportamento. Base: Brain, Mundo Datastore e dados do cliente." },
  {
    title: "Entrega Diagnóstico",
    subtitle: "Entregável ao cliente",
    variant: "elevated",
    width: "wide",
    deliverables: [
      "Análise de público",
      "Análise de concorrentes",
      "Cenário macroeconômico",
      "Potenciais personas",
      "Pesquisa de mercado (Brain, Mundo Datastore)",
      "Diagnóstico completo do que o cliente tem",
    ],
  },
  { type: "gate", label: "Validação Diagnóstico" },
  {
    title: "Desenvolvimento da Campanha",
    subtitle: "Criação estratégica + visual",
    variant: "warm",
    width: "wide",
    deliverables: [
      "Estratégia (premissas e diferenciais)",
      "Conceito criativo",
      "Manifesto de marca",
      "Tagline",
      "Arquitetura de mensagens",
      "Referência estética",
      "Guia de tom de voz",
      "Identidade visual (paleta, tipografia, grid)",
      "Key Visual (KV) principal",
      "KV por fase (Breve → Lançamento → Sustentação)",
      "Sistema de ícones / texturas",
      "Mockups de aplicação",
      "Roteiro",
      "Filme Monstro",
    ],
  },
  { type: "gate", label: "Aprovado", approved: true },
  { title: "Plano de Mídias", description: "Definição dos canais ON + OFF, mix de mídia, cronograma de veiculação e budget por fase da campanha.", variant: "elevated" },
];

// Fase 3 — Aprovações de Mídia (vertical)
const FASE_3 = [
  { title: "Planilha de Alocação de Verba", gate: false },
  { title: "Validação", gate: true },
  { title: "Planilha de Fornecedores de Mídias", gate: false },
  { title: "Validação", gate: true },
];

// Fase 4 — Gestão de Campanhas
const FASE_4: Phase[] = [
  { title: "Gestão do Plano de Mídias", subtitle: "ON + OFF", description: "Execução e acompanhamento do plano de mídias aprovado. Gestão de fornecedores, veiculação e otimização.", variant: "accent" },
  { title: "Breve", subtitle: "30 dias", description: "Campanha de antecipação: teaser, awareness, captação inicial de leads e ativação de canais.", variant: "campaign" },
  { title: "Pré Lançamento", subtitle: "30 dias", description: "Campanha de aquecimento: revelação de peças, tráfego de conversão, e-mail marketing e ações offline.", variant: "campaign" },
  { title: "Lançamento", subtitle: "60 dias", description: "Campanha principal: War Room, kit social completo, blast e-mail, tráfego, social media, influenciadores e material offline.", variant: "campaign" },
];

function PhaseCard({ phase, delay = 0 }: { phase: Phase; delay?: number }) {
  const isAccent = phase.variant === "accent";
  const isWarm = phase.variant === "warm";
  const isElevated = phase.variant === "elevated";
  const isCampaign = phase.variant === "campaign";
  const isWide = phase.width === "wide";

  const cardClass = isAccent
    ? "bg-[#E85102] border-[#E85102]"
    : isWarm
    ? "bg-gradient-to-br from-zinc-50 to-white border-[#E85102]/30 border-t-2 border-t-[#E85102]"
    : isCampaign
    ? "bg-white border-[#E85102]/20 border-t-2 border-t-[#E85102]"
    : isElevated
    ? "bg-zinc-50 border-zinc-300"
    : "bg-white border-zinc-200";

  const titleColor = isAccent ? "text-white" : "text-zinc-900";
  const subtitleColor = isAccent ? "text-white/70" : isCampaign ? "text-[#E85102]" : "text-zinc-500";
  const descColor = isAccent ? "text-white/80" : "text-zinc-600";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay }}
      className={`${cardClass} border rounded-xl shadow-sm hover:shadow-md transition-all ${
        isWide ? "min-w-[260px] max-w-[300px]" : "min-w-[180px] max-w-[220px]"
      } flex-shrink-0 flex flex-col overflow-hidden`}
    >
      <div className="px-4 pt-4">
        <div className={`${titleColor} text-sm font-bold leading-tight`}>{phase.title}</div>
        {phase.subtitle && <div className={`${subtitleColor} text-[11px] mt-1`}>{phase.subtitle}</div>}
      </div>
      {phase.description && (
        <div className="px-4 pt-2 pb-4 flex-1">
          <p className={`${descColor} text-[12px] leading-relaxed`}>{phase.description}</p>
        </div>
      )}
      {phase.deliverables && (
        <div className="px-4 pt-3 pb-4 flex flex-col gap-1.5">
          {phase.deliverables.map((d, i) => (
            <div
              key={i}
              className={`text-[11px] leading-snug px-2.5 py-1.5 rounded-md border ${
                isAccent
                  ? "bg-white/10 border-white/15 text-white/85"
                  : isWarm
                  ? "bg-white/60 border-[#E85102]/15 text-zinc-700"
                  : "bg-white border-zinc-200 text-zinc-600"
              }`}
            >
              {d}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function ConnectorH() {
  return (
    <div className="flex items-center flex-shrink-0 w-7 relative">
      <div className="absolute left-0 right-0 top-1/2 h-px bg-zinc-300" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-zinc-400" />
    </div>
  );
}

function GateCard({ gate }: { gate: Gate }) {
  const color = gate.approved ? "emerald" : "amber";
  return (
    <div className="flex flex-col items-center justify-center px-2 min-w-[100px] relative">
      <div className="absolute left-0 right-0 top-1/2 h-px bg-zinc-300 z-0" />
      <div
        className={`relative z-10 w-8 h-8 rounded-md border flex items-center justify-center mb-1.5 bg-${color}-500/10 border-${color}-500/30`}
        style={{
          backgroundColor: gate.approved ? "rgba(16,185,129,0.1)" : "rgba(251,191,36,0.1)",
          borderColor: gate.approved ? "rgba(16,185,129,0.3)" : "rgba(251,191,36,0.3)",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2L22 12L12 22L2 12Z"
            fill={gate.approved ? "rgba(16,185,129,0.2)" : "rgba(251,191,36,0.2)"}
            stroke={gate.approved ? "#10B981" : "#F59E0B"}
            strokeWidth="1.5"
          />
        </svg>
      </div>
      <div
        className="relative z-10 bg-zinc-50 px-2 text-[10px] font-bold text-center uppercase tracking-wide"
        style={{ color: gate.approved ? "#10B981" : "#F59E0B" }}
      >
        {gate.label}
      </div>
    </div>
  );
}

function FaseRow({ items, label }: { items: Item[]; label: string }) {
  return (
    <div>
      <div className="px-4 sm:px-0 py-3 flex items-center gap-2">
        <span className="w-4 h-px bg-zinc-300" />
        <span className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex items-stretch gap-0 min-w-max">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-stretch">
              {isGate(item) ? (
                <GateCard gate={item} />
              ) : (
                <>
                  <PhaseCard phase={item} delay={idx * 0.04} />
                  {idx < items.length - 1 && !isGate(items[idx + 1]) && <ConnectorH />}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProposalMarketingFlow() {
  return (
    <section id="section-marketing-flow" className="scroll-mt-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.4 }}
        className="bg-zinc-50/40 rounded-2xl border border-zinc-200 p-4 sm:p-6"
      >
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] sm:text-xs font-bold text-[#E85102] uppercase tracking-wider">
              Marketing · Fluxo de Projeto
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mb-1 sm:mb-2">
            Marketing ON / OFF — Fluxo de Projeto
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 max-w-2xl">
            Pipeline completo de um projeto de marketing na TBO: do fechamento do contrato à gestão de campanhas, passando por diagnóstico, desenvolvimento criativo, plano de mídias e execução por fases.
          </p>
        </div>

        <div className="mb-5 sm:mb-6 bg-white rounded-xl border shadow-sm p-3 sm:p-5 flex gap-4 sm:gap-6 max-w-md">
          <div className="text-center flex-1">
            <div className="text-2xl sm:text-3xl font-bold text-zinc-900">4</div>
            <div className="text-[10px] sm:text-xs text-zinc-400 uppercase tracking-wide mt-1">Fases</div>
          </div>
          <div className="border-l border-zinc-200" />
          <div className="text-center flex-1">
            <div className="text-2xl sm:text-3xl font-bold text-zinc-900">120</div>
            <div className="text-[10px] sm:text-xs text-zinc-400 uppercase tracking-wide mt-1">Dias</div>
          </div>
          <div className="border-l border-zinc-200" />
          <div className="text-center flex-1">
            <div className="text-lg sm:text-2xl font-bold text-zinc-900">ON+OFF</div>
            <div className="text-[10px] sm:text-xs text-zinc-400 uppercase tracking-wide mt-1">Canais</div>
          </div>
        </div>

        <FaseRow label="Fase 1 — Setup do Cliente na TBO" items={FASE_1} />
        <FaseRow label="Fase 2 — Estratégia & Desenvolvimento" items={FASE_2} />

        {/* Fase 3 — Vertical */}
        <div className="py-3">
          <div className="px-4 sm:px-0 py-3 flex items-center gap-2">
            <span className="w-4 h-px bg-zinc-300" />
            <span className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider">Fase 3 — Aprovações de Mídia</span>
          </div>
          <div className="flex flex-col items-center gap-0 max-w-sm mx-auto">
            {FASE_3.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center">
                {idx > 0 && (
                  <div className="relative h-6 w-px bg-zinc-300">
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-zinc-400" />
                  </div>
                )}
                <div
                  className={`px-5 py-3 rounded-lg border min-w-[220px] text-center ${
                    item.gate ? "bg-zinc-100 border-zinc-200" : "bg-white border-zinc-300"
                  }`}
                >
                  <span className={`text-xs font-bold uppercase tracking-wide ${item.gate ? "text-zinc-500" : "text-zinc-900"}`}>
                    {item.title}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-[11px] sm:text-xs text-zinc-500 max-w-md mx-auto mt-4">
            A gestão do plano de mídias ON e OFF começa a partir do momento que a planilha de orçamentos é validada.
          </p>
        </div>

        <FaseRow label="Fase 4 — Gestão de Campanhas" items={FASE_4 as Item[]} />

        <p className="text-[10px] sm:text-xs text-zinc-500 mt-3 sm:mt-4 max-w-2xl">
          <span className="font-bold text-zinc-700">Observações:</span> Fase 1 = Setup (~1 semana). Fases de campanha: Breve (30 dias) → Pré Lançamento (30 dias) → Lançamento (60 dias) = 120 dias totais de gestão. A gestão do plano de mídias ON e OFF inicia após validação da planilha de orçamentos pelo cliente.
        </p>
      </motion.div>
    </section>
  );
}
