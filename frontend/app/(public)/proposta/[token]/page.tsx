"use client";

import { useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  IconThumbUp,
  IconThumbDown,
  IconFileText,
  IconUser,
  IconMapPin,
  IconBriefcase,
  IconCalendar,
  IconAlertCircle,
  IconLoader2,
  IconMail,
  IconPhone,
  IconLock,
  IconDownload,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { createClient } from "@/lib/supabase/client";
import {
  getProposalByToken,
  submitClientDecision,
  type ClientLinkProposal,
} from "@/features/comercial/services/proposal-client-link";
import { useQuery, useMutation } from "@tanstack/react-query";

import { ProposalNav } from "./components/proposal-nav";
import { ProposalD3DFlow } from "./components/proposal-d3d-flow";
import { ProposalWhyTBO } from "./components/proposal-why-tbo";
import { ProposalTimeline } from "./components/proposal-timeline";
import { ProposalPaymentOptions } from "./components/proposal-payment-options";
import type { PaymentConditionOption } from "@/features/comercial/services/proposals";
import Image from "next/image";

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

// ─── Extended type with password field ───────────────────────────────────────

type ExtendedProposal = ClientLinkProposal & {
  access_password?: string | null;
};

// ─── Status mapping (DB uses Portuguese, UI uses both) ──────────────────────

function isDecidedStatus(status: string) {
  return ["approved", "rejected", "aprovada", "recusada"].includes(status);
}

function isApproved(status: string) {
  return status === "approved" || status === "aprovada";
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function ProposalSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-zinc-200 rounded-xl" />
          <div className="h-6 bg-zinc-200 rounded-lg w-1/2" />
          <div className="h-32 bg-zinc-200 rounded-xl" />
          <div className="h-64 bg-zinc-200 rounded-xl" />
          <div className="h-20 bg-zinc-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ─── Decided state ────────────────────────────────────────────────────────────

function DecidedState({ decision }: { decision: "approved" | "rejected" }) {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center max-w-sm"
      >
        <div
          className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4 ${
            decision === "approved" ? "bg-emerald-100" : "bg-red-100"
          }`}
        >
          {decision === "approved" ? (
            <IconThumbUp size={32} className="text-emerald-600" />
          ) : (
            <IconThumbDown size={32} className="text-red-500" />
          )}
        </div>
        <h2 className="text-xl font-bold text-zinc-900 mb-2">
          {decision === "approved" ? "Proposta Aprovada!" : "Proposta Recusada"}
        </h2>
        <p className="text-zinc-500 text-sm">
          {decision === "approved"
            ? "Obrigado! Nossa equipe entrará em contato em breve para dar início ao projeto."
            : "Agradecemos pela consideração. Se mudar de ideia ou quiser renegociar, entre em contato."}
        </p>
        <div className="mt-6 text-xs text-zinc-400 space-y-1">
          <p className="font-semibold text-zinc-600">TBO | Lançamentos Imobiliários</p>
          <p>contato@agenciatbo.com.br · +55 41 9669-6918</p>
          <a
            href="https://wearetbo.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#E85102] hover:underline"
          >
            wearetbo.com.br
          </a>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Password gate ──────────────────────────────────────────────────────────

function PasswordGate({
  onUnlock,
}: {
  onUnlock: () => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm"
      >
        <div className="bg-white rounded-xl border shadow-sm p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4">
            <IconLock size={24} className="text-zinc-400" />
          </div>
          <h2 className="text-lg font-bold text-zinc-900 mb-1">
            Proposta protegida
          </h2>
          <p className="text-sm text-zinc-500 mb-6">
            Digite a senha de acesso fornecida pela TBO.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setChecking(true);
              setError(false);
              // Small delay for UX
              setTimeout(() => {
                onUnlock();
                setChecking(false);
              }, 300);
            }}
            className="space-y-3"
          >
            <Input
              type="password"
              placeholder="Senha de acesso"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              className={`text-center ${error ? "border-red-300 focus-visible:ring-red-200" : ""}`}
              autoFocus
            />
            {error && (
              <p className="text-xs text-red-500">Senha incorreta. Tente novamente.</p>
            )}
            <Button
              type="submit"
              className="w-full bg-[#18181B] hover:bg-zinc-800"
              disabled={!password.trim() || checking}
            >
              {checking ? "Verificando..." : "Acessar proposta"}
            </Button>
          </form>
        </div>
        <p className="text-center text-xs text-zinc-400 mt-4">
          TBO | Lançamentos Imobiliários
        </p>
      </motion.div>
    </div>
  );
}

// ─── Section: Introduction / Context ────────────────────────────────────────

function SectionIntroduction({ text }: { text: string }) {
  return (
    <section id="section-context" className="scroll-mt-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-xl border shadow-sm p-4 sm:p-6"
      >
        <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mb-2 sm:mb-3">
          Contexto do Projeto
        </h2>
        <div className="text-sm text-zinc-600 leading-relaxed whitespace-pre-line">
          {text}
        </div>
      </motion.div>
    </section>
  );
}

// ─── Section: Scope items ───────────────────────────────────────────────────

function SectionScope({
  items,
}: {
  items: ExtendedProposal["items"];
}) {
  // Group items by BU
  const grouped = useMemo(() => {
    const map = new Map<string, typeof items>();
    items.forEach((item) => {
      const bu = item.bu || "Geral";
      const existing = map.get(bu) ?? [];
      existing.push(item);
      map.set(bu, existing);
    });
    return Array.from(map.entries());
  }, [items]);

  return (
    <section id="section-scope" className="scroll-mt-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mb-1 sm:mb-2">
          Escopo de Serviços
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 mb-4 sm:mb-6">
          Detalhamento das entregas e investimento por item.
        </p>

        <div className="space-y-3 sm:space-y-4">
          {grouped.map(([bu, groupItems]) => (
            <div
              key={bu}
              className="bg-white rounded-xl border shadow-sm overflow-hidden"
            >
              {grouped.length > 1 && (
                <div className="px-3 py-2 sm:px-5 sm:py-3 border-b bg-zinc-50">
                  <h3 className="font-semibold text-zinc-700 text-xs sm:text-sm">{bu}</h3>
                </div>
              )}
              <div className="divide-y">
                {groupItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="px-3 py-2.5 sm:px-5 sm:py-4 flex items-start justify-between gap-3 sm:gap-4 group hover:bg-zinc-50/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-900 text-sm">
                        {item.title}
                      </p>
                      {item.description && (
                        <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-zinc-900 text-sm">
                        {formatCurrency(item.subtotal)}
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {item.quantity}× {formatCurrency(item.unit_price)}
                        {item.discount_pct > 0 && (
                          <span className="text-red-500 ml-1">
                            −{item.discount_pct}%
                          </span>
                        )}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

// ─── Section: Totals ────────────────────────────────────────────────────────

function SectionTotals({ proposal }: { proposal: ExtendedProposal }) {
  return (
    <section id="section-investment" className="scroll-mt-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-xl border shadow-sm p-4 sm:p-6"
      >
        <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mb-3 sm:mb-4">Investimento</h2>
        <div className="flex flex-col gap-2 max-w-xs ml-auto">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Subtotal</span>
            <span className="font-medium">{formatCurrency(proposal.subtotal)}</span>
          </div>
          {proposal.discount_amount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Desconto</span>
              <span className="text-red-500 font-medium">
                − {formatCurrency(proposal.discount_amount)}
              </span>
            </div>
          )}
          {proposal.urgency_flag && (
            <div className="flex justify-between text-sm">
              <span className="text-amber-600 font-medium">
                ⚡ Urgência aplicada
              </span>
            </div>
          )}
          <Separator className="my-1" />
          <div className="flex justify-between items-center">
            <span className="font-bold text-zinc-900">Valor Total</span>
            <span className="font-bold text-[#E85102] text-2xl">
              {formatCurrency(proposal.value)}
            </span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

// ─── Section: Notes / Observações ───────────────────────────────────────────

function SectionNotes({ notes }: { notes: string }) {
  return (
    <section id="section-notes" className="scroll-mt-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-xl border shadow-sm p-4 sm:p-6"
      >
        <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mb-2 sm:mb-3">
          Observações e Garantias
        </h2>
        <p className="text-sm text-zinc-600 whitespace-pre-line leading-relaxed">
          {notes}
        </p>
      </motion.div>
    </section>
  );
}

// ─── Main Proposal View ─────────────────────────────────────────────────────

function ProposalView({
  proposal,
  token,
  onDecide,
  isSubmitting,
}: {
  proposal: ExtendedProposal;
  token: string;
  onDecide: (decision: "approved" | "rejected", feedback: string) => void;
  isSubmitting: boolean;
}) {
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadPdf = useCallback(async () => {
    setDownloadingPdf(true);
    try {
      const res = await fetch(`/api/comercial/proposal-pdf?token=${encodeURIComponent(token)}`);
      if (!res.ok) throw new Error("Falha ao gerar PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `proposta-${proposal.ref_code ?? "tbo"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // silently fail — could add toast here
    } finally {
      setDownloadingPdf(false);
    }
  }, [token, proposal.ref_code]);

  const isDecided = isDecidedStatus(proposal.status);
  const showD3D = proposal.show_d3d_flow ?? false;
  const paymentOptions: PaymentConditionOption[] = Array.isArray(
    proposal.payment_conditions,
  )
    ? proposal.payment_conditions
    : [];

  // Build nav items based on content
  const navItems = useMemo(() => {
    const items: { id: string; label: string }[] = [];
    items.push({ id: "section-header", label: "Proposta" });
    if (proposal.introduction) {
      items.push({ id: "section-context", label: "Contexto" });
    }
    if (showD3D) {
      items.push({ id: "section-d3d", label: "Processo D3D" });
    }
    items.push({ id: "section-scope", label: "Escopo" });
    items.push({ id: "section-investment", label: "Investimento" });
    if (paymentOptions.length > 0) {
      items.push({ id: "section-payment", label: "Pagamento" });
    }
    if (showD3D) {
      items.push({ id: "section-why", label: "Por que TBO" });
      items.push({ id: "section-timeline", label: "Timeline" });
    }
    if (proposal.notes) {
      items.push({ id: "section-notes", label: "Observações" });
    }
    items.push({ id: "section-decision", label: "Decisão" });
    return items;
  }, [proposal, showD3D, paymentOptions.length]);

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* ── TBO Header bar ── */}
      <div className="bg-[#18181B] text-white">
        <div className="max-w-3xl mx-auto px-4 py-3 sm:py-5 flex items-center justify-between">
          <a
            href="https://wearetbo.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 hover:opacity-90 transition-opacity"
          >
            <Image
              src="/logo-tbo-dark.svg"
              alt="TBO"
              width={80}
              height={28}
              className="h-7 w-auto"
            />
            <div className="hidden sm:block">
              <p className="text-[10px] text-zinc-500 tracking-[0.15em] uppercase leading-none">
                Lançamentos Imobiliários
              </p>
            </div>
          </a>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              title="Baixar PDF"
            >
              {downloadingPdf ? (
                <IconLoader2 size={14} className="animate-spin" />
              ) : (
                <IconDownload size={14} />
              )}
              <span className="hidden sm:inline">PDF</span>
            </button>
            <div className="text-right">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">
                Proposta Comercial
              </p>
              {proposal.ref_code && (
                <p className="text-[#E85102] font-bold font-mono text-sm">
                  {proposal.ref_code}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky nav ── */}
      <ProposalNav items={navItems} />

      {/* ── Content ── */}
      <div className="max-w-3xl mx-auto px-4 py-5 sm:py-8 space-y-5 sm:space-y-8">
        {/* Decided banner */}
        {isDecided && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl p-4 flex items-center gap-3 ${
              isApproved(proposal.status)
                ? "bg-emerald-50 border border-emerald-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            {isApproved(proposal.status) ? (
              <IconThumbUp size={20} className="text-emerald-600 shrink-0" />
            ) : (
              <IconThumbDown size={20} className="text-red-500 shrink-0" />
            )}
            <div>
              <p
                className={`font-semibold ${isApproved(proposal.status) ? "text-emerald-700" : "text-red-600"}`}
              >
                {isApproved(proposal.status)
                  ? "Proposta aprovada"
                  : "Proposta recusada"}
              </p>
              {proposal.client_decided_at && (
                <p className="text-xs text-zinc-400 mt-0.5">
                  Decisão em {formatDate(proposal.client_decided_at)}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Header section ── */}
        <section id="section-header" className="scroll-mt-20">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl border shadow-sm overflow-hidden"
          >
            {/* Project banner */}
            <div className="bg-gradient-to-r from-[#18181B] to-[#27272A] px-4 py-4 sm:px-6 sm:py-5">
              <h1 className="text-lg sm:text-xl font-bold text-white mb-1">
                {proposal.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                {proposal.project_type && (
                  <span className="flex items-center gap-1 text-xs text-zinc-400">
                    <IconFileText size={12} />
                    {proposal.project_type}
                  </span>
                )}
                {proposal.project_location && (
                  <span className="flex items-center gap-1 text-xs text-zinc-400">
                    <IconMapPin size={12} />
                    {proposal.project_location}
                  </span>
                )}
                {proposal.company && (
                  <span className="flex items-center gap-1 text-xs text-zinc-400">
                    <IconBriefcase size={12} />
                    {proposal.company}
                  </span>
                )}
              </div>
            </div>

            {/* Meta info */}
            <div className="px-4 py-3 sm:px-6 sm:py-4 flex flex-wrap items-center justify-between gap-2 sm:gap-4">
              <div className="flex flex-wrap gap-2 sm:gap-4">
                {proposal.contact_name && (
                  <span className="flex items-center gap-1.5 text-xs sm:text-sm text-zinc-600">
                    <IconUser size={14} className="text-zinc-400" />
                    {proposal.contact_name}
                  </span>
                )}
                {proposal.contact_email && (
                  <a
                    href={`mailto:${proposal.contact_email}`}
                    className="flex items-center gap-1.5 text-xs sm:text-sm text-[#E85102] hover:underline"
                  >
                    <IconMail size={14} />
                    <span className="hidden sm:inline">{proposal.contact_email}</span>
                    <span className="sm:hidden">Email</span>
                  </a>
                )}
                {proposal.contact_phone && (
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-xs sm:text-sm text-zinc-600">
                      <IconPhone size={14} className="text-zinc-400" />
                      {proposal.contact_phone}
                    </span>
                    <a
                      href={`https://wa.me/${proposal.contact_phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá! Vi a proposta ${proposal.ref_code ?? ""} do projeto ${proposal.name} e gostaria de conversar sobre os próximos passos.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#1FB855] text-white text-xs font-medium px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      <span className="hidden sm:inline">WhatsApp</span>
                    </a>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-[10px] sm:text-xs text-zinc-400">
                  <IconCalendar size={12} className="inline mr-1" />
                  {formatDate(proposal.created_at)}
                </span>
                {proposal.valid_days > 0 && (
                  <Badge variant="outline" className="text-[10px] sm:text-xs">
                    {proposal.valid_days}d
                  </Badge>
                )}
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── Introduction / Context ── */}
        {proposal.introduction && (
          <SectionIntroduction text={proposal.introduction} />
        )}

        {/* ── D3D Flow ── */}
        {showD3D && <ProposalD3DFlow />}

        {/* ── Scope ── */}
        <SectionScope items={proposal.items} />

        {/* ── Totals ── */}
        <SectionTotals proposal={proposal} />

        {/* ── Payment conditions ── */}
        {paymentOptions.length > 0 && (
          <ProposalPaymentOptions
            options={paymentOptions}
            totalValue={proposal.value}
          />
        )}

        {/* ── Why TBO ── */}
        {showD3D && <ProposalWhyTBO />}

        {/* ── Timeline ── */}
        {showD3D && <ProposalTimeline />}

        {/* ── Notes ── */}
        {proposal.notes && <SectionNotes notes={proposal.notes} />}

        {/* ── Decision section ── */}
        <section id="section-decision" className="scroll-mt-20">
          {!isDecided && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl border shadow-sm p-4 sm:p-6"
            >
              <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mb-1">
                Próximos Passos
              </h2>
              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-5">
                {[
                  "Confirme esta proposta clicando em Aprovar",
                  "Receba o boleto e cronograma em 48h",
                  "Kickoff com briefing na semana seguinte",
                ].map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2 sm:gap-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#E85102]/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[#E85102] text-[10px] sm:text-xs font-bold">
                        {idx + 1}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-600">{step}</p>
                  </div>
                ))}
              </div>

              <Separator className="mb-4 sm:mb-5" />

              <p className="text-xs sm:text-sm text-zinc-500 mb-3 sm:mb-4">
                Revise a proposta e indique sua decisão.
              </p>
              <div className="flex gap-3">
                <Button
                  className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white h-11"
                  onClick={() => setApproveOpen(true)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <IconLoader2 size={16} className="animate-spin" />
                  ) : (
                    <IconThumbUp size={16} />
                  )}
                  Aprovar proposta
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2 border-red-200 text-red-600 hover:bg-red-50 h-11"
                  onClick={() => setRejectOpen(true)}
                  disabled={isSubmitting}
                >
                  <IconThumbDown size={16} />
                  Recusar
                </Button>
              </div>
            </motion.div>
          )}

          {/* Client feedback (if already decided) */}
          {isDecided && proposal.client_feedback && (
            <div className="bg-zinc-50 rounded-xl border p-4">
              <p className="text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wide">
                Seu feedback
              </p>
              <p className="text-sm text-zinc-700">{proposal.client_feedback}</p>
            </div>
          )}
        </section>

        {/* ── CTA Website ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="bg-[#18181B] rounded-xl p-4 sm:p-6 text-center"
        >
          <p className="text-sm text-zinc-400 mb-3">
            Conheça mais sobre nossos serviços e portfólio
          </p>
          <a
            href="https://wearetbo.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#E85102] hover:bg-[#D04800] text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            Visite wearetbo.com.br
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg>
          </a>
        </motion.div>

        {/* ── Footer ── */}
        <div className="text-center py-5 sm:py-8 space-y-2 sm:space-y-3">
          <a
            href="https://wearetbo.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block hover:opacity-80 transition-opacity"
          >
            <Image
              src="/logo-tbo.svg"
              alt="TBO"
              width={64}
              height={22}
              className="h-5 w-auto mx-auto"
            />
          </a>
          <p className="text-xs font-medium text-zinc-500">
            TBO | Lançamentos Imobiliários
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-400">
            <a
              href="mailto:contato@agenciatbo.com.br"
              className="hover:text-[#E85102] transition-colors"
            >
              contato@agenciatbo.com.br
            </a>
            <span className="text-zinc-300">·</span>
            <a
              href="https://wa.me/554196696918"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#E85102] transition-colors"
            >
              +55 41 9669-6918
            </a>
            <span className="text-zinc-300">·</span>
            <a
              href="https://wearetbo.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#E85102] transition-colors"
            >
              wearetbo.com.br
            </a>
          </div>
          <p className="text-[10px] text-zinc-300 pt-1">
            Válida por {proposal.valid_days} dias a partir da emissão
          </p>
        </div>
      </div>

      {/* ── Approve dialog ── */}
      <AlertDialog open={approveOpen} onOpenChange={setApproveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <IconThumbUp size={20} className="text-emerald-600" />
              Aprovar proposta?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Ao aprovar, nossa equipe será notificada e entrará em contato para
              dar início ao projeto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Deixe um comentário ou observação (opcional)..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            className="mt-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setFeedback("")}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => {
                onDecide("approved", feedback);
                setApproveOpen(false);
              }}
            >
              Confirmar aprovação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Reject dialog ── */}
      <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <IconAlertCircle size={20} className="text-red-500" />
              Recusar proposta?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Podemos renegociar os termos se necessário. Deixe um comentário
              explicando sua decisão.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Motivo da recusa ou sugestão de ajuste (opcional)..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            className="mt-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setFeedback("")}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                onDecide("rejected", feedback);
                setRejectOpen(false);
              }}
            >
              Confirmar recusa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProposalPublicPage() {
  const params = useParams();
  const token = params.token as string;

  const [decidedStatus, setDecidedStatus] = useState<
    "approved" | "rejected" | null
  >(null);
  const [unlocked, setUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  const {
    data: proposal,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["proposal-by-token-public", token],
    queryFn: async () => {
      const supabase = createClient();
      return getProposalByToken(supabase, token);
    },
    enabled: !!token,
    retry: false,
    staleTime: 1000 * 60,
  });

  const decideMutation = useMutation({
    mutationFn: async ({
      decision,
      feedback,
    }: {
      decision: "approved" | "rejected";
      feedback: string;
    }) => {
      const supabase = createClient();
      return submitClientDecision(supabase, token, { decision, feedback }, extProposal);
    },
    onSuccess: (_data, { decision }) => {
      setDecidedStatus(decision);
    },
  });

  const extProposal = proposal as ExtendedProposal | null;
  const needsPassword = extProposal?.access_password && !unlocked;

  const handlePasswordSubmit = useCallback(() => {
    if (!extProposal?.access_password) return;
    if (passwordInput.trim().toLowerCase() === extProposal.access_password.toLowerCase()) {
      setUnlocked(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  }, [passwordInput, extProposal?.access_password]);

  if (isLoading) return <ProposalSkeleton />;

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <IconAlertCircle size={40} className="text-zinc-300 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-zinc-900 mb-1">
            Link inválido
          </h2>
          <p className="text-zinc-500 text-sm">
            Esta proposta não foi encontrada ou o link expirou. Entre em contato
            com a TBO.
          </p>
          <p className="mt-4 text-xs text-zinc-400">contato@agenciatbo.com.br</p>
        </div>
      </div>
    );
  }

  // Password gate
  if (needsPassword) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-sm"
        >
          <div className="bg-white rounded-xl border shadow-sm p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4">
              <IconLock size={24} className="text-zinc-400" />
            </div>
            <h2 className="text-lg font-bold text-zinc-900 mb-1">
              Proposta protegida
            </h2>
            <p className="text-sm text-zinc-500 mb-6">
              Digite a senha de acesso fornecida pela TBO.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handlePasswordSubmit();
              }}
              className="space-y-3"
            >
              <Input
                type="password"
                placeholder="Senha de acesso"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError(false);
                }}
                className={`text-center ${passwordError ? "border-red-300 focus-visible:ring-red-200" : ""}`}
                autoFocus
              />
              {passwordError && (
                <p className="text-xs text-red-500">
                  Senha incorreta. Tente novamente.
                </p>
              )}
              <Button
                type="submit"
                className="w-full bg-[#18181B] hover:bg-zinc-800"
                disabled={!passwordInput.trim()}
              >
                Acessar proposta
              </Button>
            </form>
          </div>
          <p className="text-center text-xs text-zinc-400 mt-4">
            TBO | Lançamentos Imobiliários
          </p>
        </motion.div>
      </div>
    );
  }

  if (decidedStatus) {
    return <DecidedState decision={decidedStatus} />;
  }

  return (
    <ProposalView
      proposal={extProposal as ExtendedProposal}
      token={token}
      onDecide={(decision, feedback) =>
        decideMutation.mutate({ decision, feedback })
      }
      isSubmitting={decideMutation.isPending}
    />
  );
}
