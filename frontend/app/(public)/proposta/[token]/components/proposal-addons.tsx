"use client";

import { motion } from "framer-motion";
import { IconCheck, IconSparkles, IconPlus } from "@tabler/icons-react";

export interface AddonOption {
  id: string;
  label: string;
  from_price?: string;
  to_price: string;
  description?: string;
  recommended?: boolean;
}

export interface AddonsData {
  section_title: string;
  section_description?: string;
  options: AddonOption[];
}

interface ProposalAddonsProps {
  addons: AddonsData | null;
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export function ProposalAddons({ addons, selectedIds, onToggle }: ProposalAddonsProps) {
  if (!addons || !addons.options || addons.options.length === 0) return null;

  const selectedSet = new Set(selectedIds);

  return (
    <section id="section-addons" className="scroll-mt-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.4 }}
        className="relative rounded-2xl overflow-hidden border border-[#E85102]/20 bg-gradient-to-br from-[#FFF7F1] via-white to-[#FFF7F1] shadow-sm"
      >
        {/* Header */}
        <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-[#E85102]/10">
          <div className="flex items-center gap-2 mb-1.5">
            <IconSparkles size={18} className="text-[#E85102]" />
            <span className="text-[10px] sm:text-xs font-bold text-[#E85102] uppercase tracking-wider">
              Compra Estendida — Adicione ao pacote
            </span>
          </div>
          <h2 className="text-base sm:text-xl font-bold text-zinc-900 mb-0.5 sm:mb-1">
            {addons.section_title}
          </h2>
          {addons.section_description && (
            <p className="text-[11px] sm:text-sm text-zinc-600 leading-relaxed">
              {addons.section_description}
            </p>
          )}
        </div>

        {/* Cards */}
        <div className="p-3 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {addons.options.map((opt, idx) => {
              const isSelected = selectedSet.has(opt.id);
              return (
                <motion.button
                  key={opt.id}
                  type="button"
                  onClick={() => onToggle(opt.id)}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: idx * 0.08 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative text-left rounded-xl border p-3.5 sm:p-4 transition-all duration-200 ${
                    isSelected
                      ? "border-[#E85102] bg-white shadow-md ring-2 ring-[#E85102]/20"
                      : "border-zinc-200 bg-white hover:border-[#E85102]/40 hover:shadow-sm"
                  }`}
                >
                  {opt.recommended && !isSelected && (
                    <div className="absolute -top-2 right-3">
                      <span className="bg-[#E85102] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                        Recomendado
                      </span>
                    </div>
                  )}

                  {/* Checkbox */}
                  <div className="absolute top-3 right-3">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-[#E85102] border-[#E85102] text-white"
                          : "bg-white border-zinc-300 text-zinc-300"
                      }`}
                    >
                      {isSelected ? (
                        <IconCheck size={12} strokeWidth={3} />
                      ) : (
                        <IconPlus size={12} strokeWidth={2.5} />
                      )}
                    </div>
                  </div>

                  <div className="pr-7">
                    <p className="text-[10px] sm:text-xs font-bold text-[#E85102] uppercase tracking-wide mb-1">
                      {opt.label}
                    </p>
                    {opt.from_price && (
                      <p className="text-[11px] sm:text-xs text-zinc-400 line-through mb-0.5">
                        {opt.from_price}
                      </p>
                    )}
                    <p className="text-zinc-900 font-bold text-sm sm:text-base mb-1.5">
                      {opt.to_price}
                    </p>
                    {opt.description && (
                      <p className="text-[10px] sm:text-xs text-zinc-500 leading-relaxed">
                        {opt.description}
                      </p>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {selectedIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 sm:mt-4 flex items-start gap-2 px-3 py-2.5 sm:px-4 sm:py-3 bg-[#E85102]/5 border border-[#E85102]/30 rounded-lg"
            >
              <IconCheck size={16} className="text-[#E85102] shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-[11px] sm:text-sm font-semibold text-zinc-900 mb-0.5">
                  {selectedIds.length}{" "}
                  {selectedIds.length === 1 ? "adicional selecionado" : "adicionais selecionados"}
                </p>
                <p className="text-[10px] sm:text-xs text-zinc-600">
                  {addons.options
                    .filter((o) => selectedSet.has(o.id))
                    .map((o) => o.label)
                    .join(" · ")}
                </p>
                <p className="text-[10px] sm:text-xs text-[#E85102] mt-1 font-medium">
                  Os adicionais selecionados serão incluídos no contrato ao aprovar a proposta.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </section>
  );
}
