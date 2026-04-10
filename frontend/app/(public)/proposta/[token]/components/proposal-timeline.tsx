"use client";

import { motion } from "framer-motion";

const TIMELINE_STAGES = [
  {
    week: "Sem. 1–2",
    label: "Kickoff & Briefing",
    description: "Alinhamento com o cliente, análise do projeto arquitetônico, definição de câmeras e referências visuais",
    color: "#E85102",
  },
  {
    week: "Sem. 3–5",
    label: "Modelagem 3D",
    description: "Construção da maquete digital, volumetria, fachada, áreas comuns, paisagismo e entorno",
    color: "#3F3F46",
  },
  {
    week: "Sem. 5–7",
    label: "Iluminação & Render",
    description: "Setup de câmeras, iluminação fotorrealista, materiais, clay render para aprovação de composição",
    color: "#52525B",
  },
  {
    week: "Sem. 7–8",
    label: "Revisão — Rodada 1",
    description: "Primeira rodada de ajustes com base no feedback do cliente — correções de materialidade, enquadramento e paisagismo",
    color: "#71717A",
  },
  {
    week: "Sem. 8–9",
    label: "Revisão — Rodada 2",
    description: "Ajustes finais, pós-produção, color grading e tratamento de imagem",
    color: "#18181B",
  },
  {
    week: "Sem. 9–10",
    label: "Entrega Final",
    description: "Renderização em alta resolução (4K+), organização de assets, entrega JPEG + PNG via Drive",
    color: "#E85102",
  },
];

export function ProposalTimeline() {
  return (
    <section id="section-timeline" className="scroll-mt-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mb-1 sm:mb-2">
          Timeline Indicativa
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 mb-4 sm:mb-6">
          Cronograma estimado com marcos principais.
        </p>

        {/* Progress bar visual */}
        <div className="mb-5 sm:mb-8 bg-white rounded-xl border shadow-sm p-3 sm:p-5">
          <div className="flex rounded-lg overflow-hidden h-3 mb-3">
            {TIMELINE_STAGES.map((stage, idx) => (
              <motion.div
                key={idx}
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="origin-left"
                style={{
                  backgroundColor: stage.color,
                  flex: [2, 3, 3, 1, 1, 2][idx] ?? 1,
                }}
              />
            ))}
          </div>
          <div className="flex text-[10px] text-zinc-400 font-medium">
            {TIMELINE_STAGES.map((stage, idx) => (
              <div
                key={idx}
                className="text-center"
                style={{ flex: [2, 3, 3, 1, 1, 2][idx] ?? 1 }}
              >
                {stage.week}
              </div>
            ))}
          </div>
        </div>

        {/* Stage cards */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-zinc-200 hidden sm:block" />

          <div className="space-y-2.5 sm:space-y-4">
            {TIMELINE_STAGES.map((stage, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
                className="flex items-start gap-2.5 sm:gap-4 relative"
              >
                {/* Dot */}
                <div
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white text-[10px] sm:text-xs font-bold shrink-0 relative z-10"
                  style={{ backgroundColor: stage.color }}
                >
                  {String(idx + 1).padStart(2, "0")}
                </div>

                {/* Content */}
                <div className="flex-1 bg-white rounded-xl border shadow-sm p-3 sm:p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                    <p className="font-semibold text-zinc-900 text-xs sm:text-sm">
                      {stage.label}
                    </p>
                    <span
                      className="text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${stage.color}12`,
                        color: stage.color,
                      }}
                    >
                      {stage.week}
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-zinc-500">{stage.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
