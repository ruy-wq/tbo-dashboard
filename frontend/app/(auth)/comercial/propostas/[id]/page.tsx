"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Image from "next/image";
import {
  IconArrowLeft,
  IconEdit,
  IconLink,
  IconSend,
  IconCopy,
  IconExternalLink,
  IconFileText,
  IconUser,
  IconMapPin,
  IconBriefcase,
  IconCalendar,
  IconMail,
  IconPhone,
  IconLoader2,
  IconEye,
  IconArrowBackUp,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { useAuthStore } from "@/stores/auth-store";
import { hasMinRole } from "@/lib/permissions";
import { useProposal, useUpdateProposal } from "@/features/comercial/hooks/use-proposals";
import { ProposalEditorDialog } from "@/features/comercial/components/proposal-editor-dialog";
import { createClient } from "@/lib/supabase/client";
import { generateClientToken } from "@/features/comercial/services/proposal-client-link";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ProposalNav } from "@/app/(public)/proposta/[token]/components/proposal-nav";
import { ProposalD3DFlow } from "@/app/(public)/proposta/[token]/components/proposal-d3d-flow";
import { ProposalWhyTBO } from "@/app/(public)/proposta/[token]/components/proposal-why-tbo";
import { ProposalTimeline } from "@/app/(public)/proposta/[token]/components/proposal-timeline";
import { ProposalPaymentOptions } from "@/app/(public)/proposta/[token]/components/proposal-payment-options";
import type { PaymentConditionOption, ProposalStatus, ProposalWithItems } from "@/features/comercial/services/proposals";

/** Extended proposal with client-link fields that exist in DB but not in base type */
type ProposalExt = ProposalWithItems & {
  client_token?: string | null;
  client_viewed_at?: string | null;
  client_decided_at?: string | null;
  client_feedback?: string | null;
  sent_at?: string | null;
  access_password?: string | null;
};

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

const STATUS_CONFIG: Record<ProposalStatus, { label: string; color: string; bg: string }> = {
  draft: { label: "Rascunho", color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
  sent: { label: "Enviada", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  approved: { label: "Aprovada", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  rejected: { label: "Recusada", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  expired: { label: "Expirada", color: "#9ca3af", bg: "rgba(156,163,175,0.12)" },
  enviada: { label: "Enviada", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  aprovada: { label: "Aprovada", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  recusada: { label: "Recusada", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  rascunho: { label: "Rascunho", color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const proposalId = params.id as string;
  const queryClient = useQueryClient();

  const role = useAuthStore((s) => s.role);
  const canRevertStatus = hasMinRole(role, "admin");

  const { data: rawProposal, isLoading, error } = useProposal(proposalId);
  const proposal = rawProposal as ProposalExt | undefined;
  const updateMutation = useUpdateProposal();
  const [editorOpen, setEditorOpen] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [revertDialogOpen, setRevertDialogOpen] = useState(false);

  const generateLinkMutation = useMutation({
    mutationFn: async () => {
      setGeneratingLink(true);
      const supabase = createClient();
      const token = await generateClientToken(supabase, proposalId);
      return token;
    },
    onSuccess: (token) => {
      const url = `${window.location.origin}/proposta/${token}`;
      navigator.clipboard.writeText(url);
      toast.success("Link copiado!", {
        description: "Link da proposta copiado para a area de transferencia.",
      });
      queryClient.invalidateQueries({ queryKey: ["proposal", proposalId] });
    },
    onError: () => {
      toast.error("Erro ao gerar link");
    },
    onSettled: () => setGeneratingLink(false),
  });

  function handleCopyExistingLink() {
    if (!proposal?.client_token) return;
    const url = `${window.location.origin}/proposta/${proposal.client_token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  }

  function handleOpenPublic() {
    if (!proposal?.client_token) return;
    window.open(`/proposta/${proposal.client_token}`, "_blank");
  }

  function handleMarkSent() {
    updateMutation.mutate(
      { id: proposalId, updates: { status: "sent" } },
      { onSuccess: () => toast.success("Proposta marcada como enviada") },
    );
  }

  function handleRevertStatus() {
    const supabase = createClient();
    supabase
      .from("proposals" as never)
      .update({
        status: "rascunho",
        client_decided_at: null,
        client_feedback: null,
        approved_at: null,
        client_viewed_at: null,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", proposalId)
      .then(({ error: err }) => {
        if (err) {
          toast.error("Erro ao reverter status");
          return;
        }
        toast.success("Status revertido para Rascunho");
        queryClient.invalidateQueries({ queryKey: ["proposal", proposalId] });
        queryClient.invalidateQueries({ queryKey: ["proposals"] });
      });
    setRevertDialogOpen(false);
  }

  // Nav items for the sticky proposal nav
  const navItems = useMemo(() => {
    if (!proposal) return [];
    const showD3D = proposal.show_d3d_flow ?? false;
    const paymentOptions: PaymentConditionOption[] = Array.isArray(proposal.payment_conditions)
      ? proposal.payment_conditions
      : [];
    const items: { id: string; label: string }[] = [];
    items.push({ id: "section-header", label: "Proposta" });
    if (proposal.introduction) items.push({ id: "section-context", label: "Contexto" });
    if (showD3D) items.push({ id: "section-d3d", label: "Processo D3D" });
    items.push({ id: "section-scope", label: "Escopo" });
    items.push({ id: "section-investment", label: "Investimento" });
    if (paymentOptions.length > 0) items.push({ id: "section-payment", label: "Pagamento" });
    if (showD3D) {
      items.push({ id: "section-why", label: "Por que TBO" });
      items.push({ id: "section-timeline", label: "Timeline" });
    }
    if (proposal.notes) items.push({ id: "section-notes", label: "Observacoes" });
    return items;
  }, [proposal]);

  // Group items by BU (must be before early returns to respect Rules of Hooks)
  const groupedItems = useMemo(() => {
    const proposalItems = proposal?.items ?? [];
    const map = new Map<string, typeof proposalItems>();
    proposalItems.forEach((item) => {
      const bu = item.bu || "Geral";
      const existing = map.get(bu) ?? [];
      existing.push(item);
      map.set(bu, existing);
    });
    return Array.from(map.entries());
  }, [proposal?.items]);

  // ─── Loading ──────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto py-8">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <p className="text-muted-foreground">Proposta não encontrada.</p>
        <Button variant="outline" onClick={() => router.push("/comercial/propostas")}>
          <IconArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
      </div>
    );
  }

  const status = STATUS_CONFIG[proposal.status] ?? { label: proposal.status, color: "#6b7280", bg: "rgba(107,114,128,0.12)" };
  const showD3D = proposal.show_d3d_flow ?? false;
  const paymentOptions: PaymentConditionOption[] = Array.isArray(proposal.payment_conditions)
    ? proposal.payment_conditions
    : [];

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8">
      {/* ── Management toolbar ── */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/comercial/propostas")}
            >
              <IconArrowLeft className="h-4 w-4 mr-1" /> Propostas
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <Badge
              variant="secondary"
              className="text-xs"
              style={{ backgroundColor: status.bg, color: status.color }}
            >
              {status.label}
            </Badge>
            {proposal.ref_code && (
              <span className="text-xs text-muted-foreground font-mono hidden sm:inline">
                {proposal.ref_code}
              </span>
            )}
          </div>
          <TooltipProvider delayDuration={200}>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditorOpen(true)}>
                    <IconEdit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Editar proposta</TooltipContent>
              </Tooltip>

              {proposal.client_token ? (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopyExistingLink}>
                        <IconCopy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copiar link do cliente</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleOpenPublic}>
                        <IconExternalLink className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Abrir link publico</TooltipContent>
                  </Tooltip>
                </>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => generateLinkMutation.mutate()}
                      disabled={generatingLink}
                    >
                      {generatingLink ? (
                        <IconLoader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <IconLink className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Gerar link para cliente</TooltipContent>
                </Tooltip>
              )}

              {proposal.status === "draft" && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-blue-600"
                      onClick={handleMarkSent}
                    >
                      <IconSend className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Marcar como enviada</TooltipContent>
                </Tooltip>
              )}

              {proposal.client_token && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        const viewCount = proposal.client_viewed_at ? "Visualizada" : "Nao visualizada";
                        toast.info(viewCount, {
                          description: proposal.client_viewed_at
                            ? `Cliente acessou em ${formatDate(proposal.client_viewed_at)}`
                            : "O cliente ainda nao acessou o link.",
                        });
                      }}
                    >
                      <IconEye className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {proposal.client_viewed_at ? "Cliente visualizou" : "Nao visualizada"}
                  </TooltipContent>
                </Tooltip>
              )}

              {canRevertStatus && ["aprovada", "approved", "recusada", "rejected", "enviada", "sent"].includes(proposal.status) && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-amber-600"
                      onClick={() => setRevertDialogOpen(true)}
                    >
                      <IconArrowBackUp className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reverter para Rascunho</TooltipContent>
                </Tooltip>
              )}
            </div>
          </TooltipProvider>
        </div>
      </div>

      {/* ── Proposal preview (same layout as public page) ── */}
      <div className="bg-zinc-50 min-h-screen">
        {/* TBO Header bar */}
        <div className="bg-[#18181B] text-white">
          <div className="max-w-3xl mx-auto px-4 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/logo-tbo-dark.svg"
                alt="TBO"
                width={80}
                height={28}
                className="h-7 w-auto"
              />
              <div className="hidden sm:block">
                <p className="text-[10px] text-zinc-500 tracking-[0.15em] uppercase leading-none">
                  Lancamentos Imobiliarios
                </p>
              </div>
            </div>
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

        {/* Sticky nav */}
        <ProposalNav items={navItems} />

        {/* Content */}
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
          {/* Header section */}
          <section id="section-header" className="scroll-mt-20">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl border shadow-sm overflow-hidden"
            >
              <div className="bg-gradient-to-r from-[#18181B] to-[#27272A] px-6 py-5">
                <h1 className="text-xl font-bold text-white mb-1">
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

              <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-4">
                  {proposal.contact_name && (
                    <span className="flex items-center gap-1.5 text-sm text-zinc-600">
                      <IconUser size={14} className="text-zinc-400" />
                      {proposal.contact_name}
                    </span>
                  )}
                  {proposal.contact_email && (
                    <a
                      href={`mailto:${proposal.contact_email}`}
                      className="flex items-center gap-1.5 text-sm text-[#E85102] hover:underline"
                    >
                      <IconMail size={14} />
                      {proposal.contact_email}
                    </a>
                  )}
                  {proposal.contact_phone && (
                    <span className="flex items-center gap-1.5 text-sm text-zinc-600">
                      <IconPhone size={14} className="text-zinc-400" />
                      {proposal.contact_phone}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-400">
                    <IconCalendar size={12} className="inline mr-1" />
                    {formatDate(proposal.created_at)}
                  </span>
                  {proposal.valid_days > 0 && (
                    <Badge variant="outline" className="text-xs">
                      Valida por {proposal.valid_days} dias
                    </Badge>
                  )}
                </div>
              </div>
            </motion.div>
          </section>

          {/* Introduction */}
          {proposal.introduction && (
            <section id="section-context" className="scroll-mt-20">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4 }}
                className="bg-white rounded-xl border shadow-sm p-6"
              >
                <h2 className="text-xl font-bold text-zinc-900 mb-3">
                  Contexto do Projeto
                </h2>
                <div className="text-sm text-zinc-600 leading-relaxed whitespace-pre-line">
                  {proposal.introduction}
                </div>
              </motion.div>
            </section>
          )}

          {/* D3D Flow */}
          {showD3D && <ProposalD3DFlow />}

          {/* Scope */}
          <section id="section-scope" className="scroll-mt-20">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="text-xl font-bold text-zinc-900 mb-2">
                Escopo de Servicos
              </h2>
              <p className="text-sm text-zinc-500 mb-6">
                Detalhamento completo das entregas e investimento por item.
              </p>

              <div className="space-y-4">
                {groupedItems.map(([bu, groupItems]) => (
                  <div
                    key={bu}
                    className="bg-white rounded-xl border shadow-sm overflow-hidden"
                  >
                    {groupedItems.length > 1 && (
                      <div className="px-5 py-3 border-b bg-zinc-50">
                        <h3 className="font-semibold text-zinc-700 text-sm">{bu}</h3>
                      </div>
                    )}
                    <div className="divide-y">
                      {groupItems.map((item) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: 1 }}
                          viewport={{ once: true }}
                          className="px-5 py-4 flex items-start justify-between gap-4 group hover:bg-zinc-50/50 transition-colors"
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
                              {item.quantity}x {formatCurrency(item.unit_price)}
                              {item.discount_pct > 0 && (
                                <span className="text-red-500 ml-1">
                                  -{item.discount_pct}%
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

          {/* Totals */}
          <section id="section-investment" className="scroll-mt-20">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-xl border shadow-sm p-6"
            >
              <h2 className="text-xl font-bold text-zinc-900 mb-4">Investimento</h2>
              <div className="flex flex-col gap-2 max-w-xs ml-auto">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Subtotal</span>
                  <span className="font-medium">{formatCurrency(proposal.subtotal)}</span>
                </div>
                {proposal.discount_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Desconto</span>
                    <span className="text-red-500 font-medium">
                      - {formatCurrency(proposal.discount_amount)}
                    </span>
                  </div>
                )}
                {proposal.urgency_flag && (
                  <div className="flex justify-between text-sm">
                    <span className="text-amber-600 font-medium">Urgencia aplicada</span>
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

          {/* Payment conditions */}
          {paymentOptions.length > 0 && (
            <ProposalPaymentOptions
              options={paymentOptions}
              totalValue={proposal.value}
            />
          )}

          {/* Why TBO */}
          {showD3D && <ProposalWhyTBO />}

          {/* Timeline */}
          {showD3D && <ProposalTimeline />}

          {/* Notes */}
          {proposal.notes && (
            <section id="section-notes" className="scroll-mt-20">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4 }}
                className="bg-white rounded-xl border shadow-sm p-6"
              >
                <h2 className="text-xl font-bold text-zinc-900 mb-3">
                  Observacoes e Garantias
                </h2>
                <p className="text-sm text-zinc-600 whitespace-pre-line leading-relaxed">
                  {proposal.notes}
                </p>
              </motion.div>
            </section>
          )}

          {/* Footer */}
          <div className="text-center py-8 space-y-3">
            <Image
              src="/logo-tbo.svg"
              alt="TBO"
              width={64}
              height={22}
              className="h-5 w-auto mx-auto"
            />
            <p className="text-xs font-medium text-zinc-500">
              TBO | Lancamentos Imobiliarios
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-400">
              <span>contato@agenciatbo.com.br</span>
              <span className="text-zinc-300">.</span>
              <span>+55 41 9669-6918</span>
              <span className="text-zinc-300">.</span>
              <span>wearetbo.com.br</span>
            </div>
            <p className="text-[10px] text-zinc-300 pt-1">
              Valida por {proposal.valid_days} dias a partir da emissao
            </p>
          </div>
        </div>
      </div>

      {/* Editor dialog */}
      <ProposalEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        proposal={proposal}
      />

      {/* Revert status confirmation */}
      <AlertDialog open={revertDialogOpen} onOpenChange={setRevertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reverter status da proposta?</AlertDialogTitle>
            <AlertDialogDescription>
              A proposta <strong>"{proposal.name}"</strong> voltará para <strong>Rascunho</strong>.
              Os dados de visualização e decisão do cliente serão limpos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevertStatus}>
              Reverter para Rascunho
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
