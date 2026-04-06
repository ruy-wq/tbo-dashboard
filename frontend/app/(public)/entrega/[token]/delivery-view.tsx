"use client";

import React, { useCallback, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconFolder,
  IconFileTypePdf,
  IconRuler,
  IconPhoto,
  IconVideo,
  IconExternalLink,
  IconFileZip,
  IconDownload,
  IconLock,
  IconArrowRight,
  IconArrowUpRight,
} from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// ── Types ──────────────────────────────────────────────────
interface Deliverable {
  title: string;
  description: string;
  type: string;
  url: string;
  icon?: string;
  file_size?: string;
}

interface DeliveryViewProps {
  title: string;
  description: string | null;
  clientName: string | null;
  clientCompany: string | null;
  projectName: string | null;
  deliveredBy: string | null;
  deliveryDate: string | null;
  deliverables: Deliverable[];
  heroSubtitle: string | null;
  accentColor: string;
  coverImageUrl: string | null;
  personalMessage: string | null;
  isFirstAccess: boolean;
  accessPassword: string | null;
}

// ── Constants ──────────────────────────────────────────────
const EASE_OUT = [0.0, 0.0, 0.2, 1] as const;
const CURTAIN_EASE = [0.76, 0, 0.24, 1] as const;

const TYPE_ICONS: Record<string, typeof IconFolder> = {
  folder: IconFolder,
  pdf: IconFileTypePdf,
  dwg: IconRuler,
  image: IconPhoto,
  video: IconVideo,
  link: IconExternalLink,
  zip: IconFileZip,
};

function formatDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getDirectDownloadUrl(url: string): string | null {
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) return `https://drive.google.com/uc?export=download&id=${fileMatch[1]}`;
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && !url.includes("/folders/")) return `https://drive.google.com/uc?export=download&id=${idMatch[1]}`;
  return null;
}

function isDownloadable(type: string): boolean {
  return ["pdf", "dwg", "image", "zip", "video"].includes(type);
}

// ── Password Screen ────────────────────────────────────────
function PasswordScreen({
  accessPassword,
  onUnlock,
  coverImageUrl,
}: {
  accessPassword: string;
  onUnlock: () => void;
  coverImageUrl: string | null;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (password.trim().toLowerCase() === accessPassword.toLowerCase()) {
        onUnlock();
      } else {
        setError(true);
      }
    },
    [password, accessPassword, onUnlock],
  );

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {coverImageUrl ? (
        <div className="absolute inset-0 z-0">
          <Image src={coverImageUrl} alt="" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-zinc-900/70 backdrop-blur-sm" />
        </div>
      ) : (
        <div className="absolute inset-0 z-0 bg-zinc-900" />
      )}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT }}
        className="relative z-10 text-center max-w-sm w-full"
      >
        <Image src="/logo-tbo-dark.svg" alt="TBO" width={80} height={32} className="h-7 w-auto mx-auto opacity-60 mb-10" />
        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6">
          <IconLock size={20} className="text-white/50" />
        </div>
        <h2 className="text-lg font-semibold text-white mb-1">Entrega protegida</h2>
        <p className="text-sm text-white/40 mb-8">Digite a senha de acesso fornecida pela TBO.</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="password"
            placeholder="Senha de acesso"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            className={`text-center h-12 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-white/30 ${error ? "border-red-400" : ""}`}
            autoFocus
          />
          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-red-400">
              Senha incorreta. Tente novamente.
            </motion.p>
          )}
          <Button type="submit" className="w-full h-12 bg-white text-stone-900 hover:bg-white/90 font-semibold">
            Acessar entrega
          </Button>
        </form>
        <p className="text-[10px] text-white/20 mt-10">TBO | Lançamentos Imobiliários</p>
      </motion.div>
    </div>
  );
}

// ── Reveal Animation ───────────────────────────────────────
function RevealAnimation({ projectName, onComplete }: { projectName: string | null; onComplete: () => void }) {
  return (
    <motion.div className="fixed inset-0 z-50 pointer-events-none" exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
      <motion.div className="absolute top-0 left-0 right-0 h-1/2 bg-zinc-900 z-50" initial={{ y: 0 }} animate={{ y: "-100%" }} transition={{ duration: 0.8, delay: 2.2, ease: CURTAIN_EASE }} />
      <motion.div className="absolute bottom-0 left-0 right-0 h-1/2 bg-zinc-900 z-50" initial={{ y: 0 }} animate={{ y: "100%" }} transition={{ duration: 0.8, delay: 2.2, ease: CURTAIN_EASE }} onAnimationComplete={onComplete} />
      <div className="absolute inset-0 z-[51] flex flex-col items-center justify-center bg-zinc-900">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.3 }} className="flex flex-col items-center">
          <Image src="/logo-tbo-dark.svg" alt="TBO" width={100} height={40} className="h-8 w-auto opacity-60 mb-6" />
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.8 }} className="text-white text-3xl sm:text-5xl font-bold tracking-tight">
            {projectName ?? "Seu projeto"}
          </motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 1.2 }} className="text-white/40 text-sm mt-2 tracking-widest uppercase">
            está pronto
          </motion.p>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.5, delay: 1.5 }} className="w-16 h-[2px] bg-[#E85102] mt-4 origin-center" />
        </motion.div>
      </div>
    </motion.div>
  );
}

// ── Highlight Card (featured deliverable) ──────────────────
function HighlightCard({ deliverable, accentColor }: { deliverable: Deliverable; accentColor: string }) {
  return (
    <motion.a
      href={deliverable.url}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
      transition={{ duration: 0.2 }}
      className="group md:col-span-12 bg-zinc-900 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 cursor-pointer relative overflow-hidden min-h-[140px]"
    >
      {/* Gradient accent glow */}
      <div
        className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: accentColor }}
      />
      <div className="relative z-10 flex items-center gap-5 flex-1">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${accentColor}20` }}
        >
          <IconExternalLink size={26} style={{ color: accentColor }} />
        </div>
        <div>
          <p className="text-[10px] text-white/30 tracking-widest uppercase mb-1">Destaque desta entrega</p>
          <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight">{deliverable.title}</h3>
          {deliverable.description && (
            <p className="text-sm text-white/40 mt-1 leading-relaxed max-w-xl">{deliverable.description}</p>
          )}
        </div>
      </div>
      <div className="relative z-10 flex items-center gap-2 text-white/40 group-hover:text-white transition-colors shrink-0">
        <span className="text-sm font-medium">Acessar</span>
        <IconArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
      </div>
    </motion.a>
  );
}

// ── Section Label ──────────────────────────────────────────
function SectionLabel({ label, count }: { label: string; count: number }) {
  return (
    <div className="md:col-span-12 flex items-center gap-3 pt-2">
      <span className="text-[11px] font-semibold text-stone-500 tracking-widest uppercase">{label}</span>
      <div className="flex-1 h-[1px] bg-stone-200" />
      <span className="text-[11px] text-stone-300">{count} {count === 1 ? "item" : "itens"}</span>
    </div>
  );
}

// ── Deliverable Card (Bento) ────────────────────────────────
function DeliverableCard({ deliverable, accentColor, span }: { deliverable: Deliverable; accentColor: string; span?: number }) {
  const Icon = TYPE_ICONS[deliverable.type] ?? IconExternalLink;
  const canDownload = isDownloadable(deliverable.type);
  const directUrl = getDirectDownloadUrl(deliverable.url);
  const downloadUrl = canDownload && directUrl ? directUrl : null;

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (downloadUrl) {
        e.preventDefault();
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = "";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    },
    [downloadUrl],
  );

  const colClass = span === 6 ? "md:col-span-6" : span === 3 ? "md:col-span-3" : "md:col-span-4";

  return (
    <motion.a
      href={downloadUrl ?? deliverable.url}
      target={downloadUrl ? undefined : "_blank"}
      rel="noopener noreferrer"
      onClick={handleClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={`${colClass} group bg-white rounded-2xl p-6 flex flex-col justify-between min-h-[200px] cursor-pointer transition-shadow duration-300 hover:shadow-xl`}
    >
      <div>
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
          style={{ backgroundColor: `${accentColor}12` }}
        >
          <Icon size={22} style={{ color: accentColor }} />
        </div>
        <h3 className="text-base font-bold text-stone-900 leading-tight">
          {deliverable.title}
        </h3>
        {deliverable.description && (
          <p className="text-[13px] text-stone-400 mt-2 leading-relaxed line-clamp-3">
            {deliverable.description}
          </p>
        )}
      </div>
      <div className="flex items-center justify-between mt-5 pt-4 border-t border-stone-100">
        <span className="text-[11px] text-stone-300 font-medium uppercase tracking-wider">
          {deliverable.type === "folder" ? "Pasta" : deliverable.type === "link" ? "Link" : deliverable.type.toUpperCase()}
          {deliverable.file_size && ` · ${deliverable.file_size}`}
        </span>
        <div className="w-8 h-8 rounded-full bg-stone-100 group-hover:bg-zinc-900 flex items-center justify-center transition-colors duration-300">
          {downloadUrl ? (
            <IconDownload size={14} className="text-stone-400 group-hover:text-white transition-colors" />
          ) : (
            <IconArrowUpRight size={14} className="text-stone-400 group-hover:text-white transition-colors" />
          )}
        </div>
      </div>
    </motion.a>
  );
}

// ── Grid helpers ────────────────────────────────────────────
/** Returns the optimal col-span for items in a row that sums to 12 */
function getSpansForGroup(count: number): number[] {
  if (count === 1) return [12];
  if (count === 2) return [6, 6];
  if (count === 3) return [4, 4, 4];
  if (count === 4) return [3, 3, 3, 3];
  if (count === 5) return [4, 4, 4, 6, 6];
  if (count === 6) return [4, 4, 4, 4, 4, 4];
  // For 7+, first row 4-4-4, rest 4-4-4, last row fill
  const spans: number[] = [];
  const fullRows = Math.floor(count / 3);
  const remainder = count % 3;
  for (let i = 0; i < fullRows * 3; i++) spans.push(4);
  if (remainder === 1) spans.push(12);
  else if (remainder === 2) { spans.push(6); spans.push(6); }
  return spans;
}

/** Categorize deliverables by prefix pattern (e.g. "Digital 3D — Fachada" → "Digital 3D") */
function groupDeliverables(items: Deliverable[]): { highlight: Deliverable | null; sections: { label: string; items: Deliverable[] }[] } {
  let highlight: Deliverable | null = null;
  const sectionMap = new Map<string, Deliverable[]>();

  for (const d of items) {
    // First "link" type = highlight
    if (!highlight && d.type === "link") {
      highlight = d;
      continue;
    }

    // Detect section from title prefix "Section — Detail"
    const dashIdx = d.title.indexOf("—");
    const label = dashIdx > 0 ? d.title.slice(0, dashIdx).trim() : inferSection(d);

    if (!sectionMap.has(label)) sectionMap.set(label, []);
    sectionMap.get(label)!.push(d);
  }

  return {
    highlight,
    sections: Array.from(sectionMap.entries()).map(([label, items]) => ({ label, items })),
  };
}

function inferSection(d: Deliverable): string {
  if (d.type === "video") return "Audiovisual";
  return "Geral";
}

// ── Main View ────────────────────────────────────────────────
export function DeliveryView({
  title,
  description,
  clientName,
  clientCompany,
  projectName,
  deliveredBy,
  deliveryDate,
  deliverables,
  heroSubtitle,
  accentColor,
  coverImageUrl,
  personalMessage,
  isFirstAccess,
  accessPassword,
}: DeliveryViewProps) {
  void clientName;
  void title;

  const [unlocked, setUnlocked] = useState(false);
  const [revealComplete, setRevealComplete] = useState(!isFirstAccess);

  if (accessPassword && !unlocked) {
    return <PasswordScreen accessPassword={accessPassword} onUnlock={() => setUnlocked(true)} coverImageUrl={coverImageUrl} />;
  }

  return (
    <main className="min-h-screen bg-[#f0ede9]">
      <AnimatePresence>
        {!revealComplete && <RevealAnimation projectName={projectName} onComplete={() => setRevealComplete(true)} />}
      </AnimatePresence>

      {/* ── Outer shell with padding ── */}
      <div className="p-3 sm:p-4 md:p-5">

        {/* ── Header bar ── */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-3">
            <a href="https://wearetbo.com.br" target="_blank" rel="noopener noreferrer">
              <Image src="/logo-tbo.svg" alt="TBO" width={80} height={32} className="h-6 sm:h-7 w-auto" priority />
            </a>
            <div className="hidden sm:block w-[1px] h-4 bg-zinc-300" />
            <span className="hidden sm:block text-xs text-stone-400">Lançamentos Imobiliários</span>
          </div>
          <div className="flex items-center gap-3">
            {deliveryDate && (
              <span className="text-[11px] text-stone-400 bg-white rounded-full px-3 py-1.5 font-medium">
                {formatDate(deliveryDate)}
              </span>
            )}
            {deliveredBy && (
              <span className="hidden md:block text-[11px] text-stone-400 bg-white rounded-full px-3 py-1.5">
                {deliveredBy}
              </span>
            )}
          </div>
        </motion.header>

        {/* ── Bento Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4">

          {/* ── Hero Card (dark, wide) — spans 8 cols ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="md:col-span-8 relative rounded-3xl overflow-hidden min-h-[360px] sm:min-h-[440px] flex flex-col justify-end"
          >
            {coverImageUrl ? (
              <>
                <Image src={coverImageUrl} alt="" fill className="object-cover" priority />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/30 to-transparent" />
              </>
            ) : (
              <div className="absolute inset-0 bg-zinc-900" />
            )}
            <div className="relative z-10 p-6 sm:p-8">
              {heroSubtitle && (
                <p className="text-[11px] text-white/40 tracking-widest uppercase mb-3">
                  {heroSubtitle}
                </p>
              )}
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight leading-[0.95]">
                {projectName ?? "Projeto"}
              </h1>
              {clientCompany && (
                <p className="text-sm text-white/40 mt-3 font-light">{clientCompany}</p>
              )}
            </div>
          </motion.div>

          {/* ── Accent Card (orange) — spans 4 cols ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="md:col-span-4 rounded-3xl p-6 sm:p-8 flex flex-col justify-between min-h-[200px]"
            style={{ background: accentColor }}
          >
            <div>
              <p className="text-[11px] text-white/50 tracking-widest uppercase mb-4">
                Versão Final
              </p>
              <p className="text-xl sm:text-2xl font-bold text-white leading-tight">
                {description
                  ? description.length > 120
                    ? description.slice(0, 120) + "…"
                    : description
                  : "Entrega completa do projeto"}
              </p>
            </div>
            <div className="flex items-center gap-2 mt-6">
              <div className="w-6 h-[1px] bg-white/30" />
              <span className="text-xs text-white/50">think, build, own</span>
            </div>
          </motion.div>

          {/* ── Personal Message Card (if present) — full width ── */}
          {personalMessage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="md:col-span-12 bg-white rounded-3xl p-6 sm:p-8"
            >
              <p className="text-lg sm:text-xl text-stone-600 leading-relaxed font-light italic max-w-3xl">
                &ldquo;{personalMessage}&rdquo;
              </p>
              {deliveredBy && (
                <div className="flex items-center gap-3 mt-5">
                  <div className="w-8 h-[2px] rounded-full" style={{ background: accentColor }} />
                  <span className="text-sm font-semibold text-stone-500">{deliveredBy}</span>
                </div>
              )}
            </motion.div>
          )}

          {/* ── Deliverable Cards (grouped with hierarchy) ── */}
          {(() => {
            const { highlight, sections } = groupDeliverables(deliverables);
            let delayIdx = 0;
            return (
              <>
                {/* Highlight card (featured deliverable) */}
                {highlight && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 + delayIdx++ * 0.1 }}
                    className="md:col-span-12"
                  >
                    <HighlightCard deliverable={highlight} accentColor={accentColor} />
                  </motion.div>
                )}

                {/* Grouped sections */}
                {sections.map((section) => {
                  const spans = getSpansForGroup(section.items.length);
                  return (
                    <React.Fragment key={section.label}>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.5 + delayIdx++ * 0.1 }}
                        className="md:col-span-12"
                      >
                        <SectionLabel label={section.label} count={section.items.length} />
                      </motion.div>
                      {section.items.map((d, i) => {
                        const span = spans[i] ?? 4;
                        const colCls = span === 12 ? "md:col-span-12" : span === 6 ? "md:col-span-6" : span === 3 ? "md:col-span-3" : "md:col-span-4";
                        return (
                          <motion.div
                            key={`${d.title}-${i}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.5 + delayIdx++ * 0.1 }}
                            className={colCls}
                          >
                            <DeliverableCard deliverable={d} accentColor={accentColor} span={span} />
                          </motion.div>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </>
            );
          })()}

          {/* ── CTA / Website Card — spans full width ── */}
          <motion.a
            href="https://wearetbo.com.br"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            whileHover={{ scale: 1.005 }}
            className="md:col-span-12 bg-zinc-900 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <Image src="/logo-tbo-dark.svg" alt="TBO" width={60} height={24} className="h-5 w-auto opacity-50 group-hover:opacity-80 transition-opacity" />
              <div className="w-[1px] h-6 bg-white/10 hidden sm:block" />
              <p className="text-sm text-white/40 group-hover:text-white/60 transition-colors">
                Aproveite e conheça mais o nosso website e nossos serviços.
              </p>
            </div>
            <div className="flex items-center gap-2 text-white/40 group-hover:text-white transition-colors shrink-0">
              <span className="text-sm font-medium">wearetbo.com.br</span>
              <IconArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.a>

        </div>

        {/* ── Footer ── */}
        <footer className="flex items-center justify-between mt-4 px-2 pb-2">
          <p className="text-[10px] text-stone-400">contato@agenciatbo.com.br</p>
          <p className="text-[10px] text-stone-300">Gerado pelo TBO OS</p>
        </footer>

      </div>
    </main>
  );
}
