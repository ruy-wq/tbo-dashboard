"use client";

import { useMemo, useState } from "react";
import {
  IconMailbox,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlayerStop,
  IconPlus,
  IconRefresh,
  IconSend,
  IconSparkles,
  IconCheck,
  IconClock,
  IconExternalLink,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  useCadences,
  useCadenceDetail,
  useCadenceEnrollments,
  useCadenceSends,
  useEnrollDeal,
  useGenerateCadenceStep,
  useSendCadenceStep,
  useUpdateCadenceSendDraft,
  useUpdateEnrollmentStatus,
  type Cadence,
  type CadenceEnrollment,
  type CadenceSend,
} from "../hooks/use-cadences";
import type { Database } from "@/lib/supabase/types";

type DealRow = Database["public"]["Tables"]["crm_deals"]["Row"];

interface Props {
  deal: DealRow;
}

const STAGE_LABEL: Record<string, string> = {
  lead: "Lead / Prospecção",
  qualificacao: "Qualificação / Oportunidade",
  proposta: "Proposta em Aberto",
  negociacao: "Negociação",
  fechado_ganho: "Cliente (ganho)",
  fechado_perdido: "Lost / Reativação",
};

export function CadenceSection({ deal }: Props) {
  const { data: cadences = [], isLoading: loadingCadences } = useCadences();
  const { data: enrollments = [], isLoading: loadingEn } = useCadenceEnrollments(deal.id);
  const enrollMutation = useEnrollDeal();

  const [selectedCadenceId, setSelectedCadenceId] = useState<string>("");

  // Cadências compatíveis: mesmo stage do deal + não matriculado ainda (ou já concluído/cancelado)
  const activeEnrollmentCadenceIds = useMemo(
    () => new Set(enrollments.filter((e) => e.status === "active" || e.status === "paused").map((e) => e.cadence_id)),
    [enrollments],
  );

  const availableCadences = useMemo(
    () => cadences.filter((c) => c.stage_trigger === deal.stage && !activeEnrollmentCadenceIds.has(c.id)),
    [cadences, deal.stage, activeEnrollmentCadenceIds],
  );

  function handleEnroll() {
    if (!selectedCadenceId || !deal.tenant_id) return;
    enrollMutation.mutate(
      { dealId: deal.id, cadenceId: selectedCadenceId, tenantId: deal.tenant_id },
      { onSuccess: () => setSelectedCadenceId("") },
    );
  }

  const activeEnrollments = enrollments.filter((e) => e.status === "active" || e.status === "paused");
  const pastEnrollments = enrollments.filter((e) => e.status === "completed" || e.status === "cancelled");

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <IconMailbox className="h-4 w-4 text-violet-500" />
          <h3 className="text-sm font-semibold">Cadências de e-mail</h3>
          {activeEnrollments.length > 0 && (
            <Badge variant="outline" className="text-[10px] h-4 px-1.5">
              {activeEnrollments.length} ativa{activeEnrollments.length === 1 ? "" : "s"}
            </Badge>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
          stage: {STAGE_LABEL[deal.stage] ?? deal.stage}
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Matricular em nova cadência */}
        {availableCadences.length > 0 && (
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">
                Matricular em cadência compatível com a etapa atual
              </label>
              <Select value={selectedCadenceId} onValueChange={setSelectedCadenceId}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Selecione uma cadência…" />
                </SelectTrigger>
                <SelectContent>
                  {availableCadences.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-sm">
                      {c.name}
                      {c.bu && <span className="text-muted-foreground ml-1.5 text-xs">· {c.bu}</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              size="sm"
              onClick={handleEnroll}
              disabled={!selectedCadenceId || enrollMutation.isPending || !deal.tenant_id}
              className="h-9 gap-1.5"
            >
              <IconPlus className="h-3.5 w-3.5" />
              Matricular
            </Button>
          </div>
        )}

        {availableCadences.length === 0 && !loadingCadences && activeEnrollments.length === 0 && (
          <p className="text-xs text-muted-foreground py-2">
            Nenhuma cadência compatível com a etapa <strong>{STAGE_LABEL[deal.stage] ?? deal.stage}</strong>. Mova o
            deal para outra etapa ou crie uma cadência em /comercial/cadencias.
          </p>
        )}

        {/* Enrollments ativos */}
        {loadingEn && <p className="text-xs text-muted-foreground">Carregando cadências…</p>}
        {activeEnrollments.map((en) => (
          <EnrollmentCard key={en.id} enrollment={en as never} dealContactEmail={deal.contact_email ?? null} />
        ))}

        {/* Histórico de enrollments */}
        {pastEnrollments.length > 0 && (
          <Collapsible>
            <CollapsibleTrigger className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
              Histórico ({pastEnrollments.length})
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-1">
              {pastEnrollments.map((en) => (
                <div
                  key={en.id}
                  className="flex items-center justify-between text-xs border border-border rounded-md px-3 py-2"
                >
                  <span className="text-muted-foreground">
                    {(en as unknown as { cadence: Cadence }).cadence.name} ·{" "}
                    {formatDistanceToNow(new Date(en.created_at), { locale: ptBR, addSuffix: true })}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      en.status === "completed" ? "text-emerald-600 border-emerald-300" : "text-muted-foreground"
                    }`}
                  >
                    {en.status === "completed" ? "concluída" : "cancelada"}
                  </Badge>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  );
}

interface EnrollmentCardProps {
  enrollment: CadenceEnrollment & { cadence: Cadence };
  dealContactEmail: string | null;
}

function EnrollmentCard({ enrollment, dealContactEmail }: EnrollmentCardProps) {
  const { data: cadenceDetail } = useCadenceDetail(enrollment.cadence_id);
  const { data: sends = [] } = useCadenceSends(enrollment.id);
  const updateStatus = useUpdateEnrollmentStatus();
  const generate = useGenerateCadenceStep();

  const [guidance, setGuidance] = useState("");
  const steps = cadenceDetail?.steps ?? [];
  const totalSteps = steps.length;

  // Draft pendente pra o step atual (se existe)
  const currentDraft = sends.find(
    (s) => s.step_order === enrollment.current_step_order && s.status === "draft",
  );

  const canGenerate = enrollment.status === "active" && enrollment.current_step_order <= totalSteps && !currentDraft;
  const canSendDraft = enrollment.status === "active" && !!currentDraft && !!dealContactEmail;

  function handleGenerate() {
    generate.mutate(
      { enrollmentId: enrollment.id, userGuidance: guidance.trim() || undefined },
      { onSuccess: () => setGuidance("") },
    );
  }

  return (
    <div className="rounded-md border border-border bg-background">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b bg-muted/20">
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{enrollment.cadence.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Badge
              variant="outline"
              className={`text-[9px] h-3.5 px-1 ${
                enrollment.status === "active" ? "text-violet-600 border-violet-300" :
                enrollment.status === "paused" ? "text-amber-600 border-amber-300" :
                "text-muted-foreground"
              }`}
            >
              {enrollment.status === "active" ? "ativa" : enrollment.status === "paused" ? "pausada" : enrollment.status}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              step {Math.min(enrollment.current_step_order, totalSteps)} de {totalSteps}
            </span>
            {enrollment.cadence.bu && (
              <span className="text-[10px] text-muted-foreground">· {enrollment.cadence.bu}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {enrollment.status === "active" && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-[11px] gap-1"
              onClick={() => updateStatus.mutate({ id: enrollment.id, status: "paused", dealId: enrollment.deal_id })}
            >
              <IconPlayerPause className="h-3 w-3" />
              Pausar
            </Button>
          )}
          {enrollment.status === "paused" && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-[11px] gap-1"
              onClick={() => updateStatus.mutate({ id: enrollment.id, status: "active", dealId: enrollment.deal_id })}
            >
              <IconPlayerPlay className="h-3 w-3" />
              Retomar
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-[11px] gap-1 text-destructive hover:text-destructive"
            onClick={() => updateStatus.mutate({ id: enrollment.id, status: "cancelled", dealId: enrollment.deal_id })}
          >
            <IconPlayerStop className="h-3 w-3" />
            Cancelar
          </Button>
        </div>
      </div>

      {/* Timeline dos steps */}
      <div className="px-3 py-2 space-y-1.5">
        {steps.map((step) => {
          const send = sends.find((s) => s.step_order === step.step_order);
          const isCurrent = step.step_order === enrollment.current_step_order;
          const isPast = step.step_order < enrollment.current_step_order || send?.status === "sent";
          return (
            <div
              key={step.id}
              className={`flex items-center gap-2 text-xs py-1 ${isCurrent ? "font-medium" : ""}`}
            >
              <div
                className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 ${
                  isPast ? "bg-emerald-500 border-emerald-500 text-white" :
                  isCurrent ? "bg-violet-500 border-violet-500 text-white" :
                  "bg-background border-muted-foreground/30 text-muted-foreground"
                }`}
              >
                {isPast ? <IconCheck className="h-3 w-3" /> : <span className="text-[10px]">{step.step_order}</span>}
              </div>
              <span className={`truncate ${isCurrent ? "text-foreground" : isPast ? "text-muted-foreground line-through" : "text-muted-foreground"}`}>
                {step.name}
              </span>
              {send?.sent_at && (
                <span className="text-[10px] text-muted-foreground ml-auto shrink-0 inline-flex items-center gap-1">
                  <IconClock className="h-2.5 w-2.5" />
                  {formatDistanceToNow(new Date(send.sent_at), { locale: ptBR, addSuffix: true })}
                  {send.mailchimp_campaign_id && (
                    <IconExternalLink className="h-2.5 w-2.5" />
                  )}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Ação para o step atual */}
      {enrollment.status === "active" && enrollment.current_step_order <= totalSteps && (
        <div className="border-t px-3 py-3 bg-muted/10 space-y-2">
          {canGenerate && (
            <>
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground block">
                Briefing opcional pra este step
              </label>
              <Textarea
                value={guidance}
                onChange={(e) => setGuidance(e.target.value)}
                placeholder="Algo específico a ajustar neste e-mail? (opcional — deixe em branco pra usar o template puro)"
                className="min-h-[56px] text-xs resize-none"
                disabled={generate.isPending}
              />
              <Button
                size="sm"
                onClick={handleGenerate}
                disabled={generate.isPending}
                className="gap-1.5 w-full"
              >
                {generate.isPending ? (
                  <>
                    <IconRefresh className="h-3.5 w-3.5 animate-spin" />
                    Gerando com Opus 4.7…
                  </>
                ) : (
                  <>
                    <IconSparkles className="h-3.5 w-3.5" />
                    Gerar rascunho do step {enrollment.current_step_order}
                  </>
                )}
              </Button>
            </>
          )}

          {currentDraft && (
            <CadenceSendDraftCard
              send={currentDraft}
              enrollmentId={enrollment.id}
              dealId={enrollment.deal_id}
              canSend={canSendDraft}
              dealContactEmail={dealContactEmail}
            />
          )}
        </div>
      )}

      {enrollment.status === "active" && enrollment.current_step_order > totalSteps && (
        <div className="border-t px-3 py-3 bg-emerald-50 dark:bg-emerald-950 text-xs text-emerald-700 dark:text-emerald-300">
          Todos os steps foram disparados. Cadência será marcada como concluída após o último envio.
        </div>
      )}
    </div>
  );
}

interface CadenceSendDraftCardProps {
  send: CadenceSend;
  enrollmentId: string;
  dealId: string;
  canSend: boolean;
  dealContactEmail: string | null;
}

function CadenceSendDraftCard({ send, enrollmentId, dealId, canSend, dealContactEmail }: CadenceSendDraftCardProps) {
  const [editing, setEditing] = useState(false);
  const [subject, setSubject] = useState(send.final_subject ?? "");
  const [body, setBody] = useState(send.final_body ?? "");
  const updateDraft = useUpdateCadenceSendDraft();
  const sendStep = useSendCadenceStep();

  function handleSaveEdit() {
    updateDraft.mutate(
      { sendId: send.id, enrollmentId, patch: { final_subject: subject, final_body: body } },
      { onSuccess: () => setEditing(false) },
    );
  }

  function handleSend() {
    sendStep.mutate({
      sendId: send.id,
      enrollmentId,
      dealId,
      subject: editing ? subject : undefined,
      body: editing ? body : undefined,
    });
  }

  return (
    <div className="rounded border border-violet-200 bg-violet-50/50 dark:bg-violet-950/30 dark:border-violet-800 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-violet-700 dark:text-violet-300">
          Rascunho pronto pra envio
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 text-[11px]"
          onClick={() => {
            if (editing) {
              setSubject(send.final_subject ?? "");
              setBody(send.final_body ?? "");
            }
            setEditing(!editing);
          }}
        >
          {editing ? "Cancelar" : "Editar"}
        </Button>
      </div>

      {editing ? (
        <>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Assunto"
            className="h-8 text-xs"
          />
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Corpo"
            className="min-h-[180px] text-xs font-mono resize-y"
          />
          <div className="flex gap-1.5">
            <Button
              size="sm"
              onClick={handleSaveEdit}
              disabled={updateDraft.isPending}
              className="h-7 text-xs gap-1"
            >
              <IconCheck className="h-3 w-3" />
              Salvar edição
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-xs font-medium">{send.final_subject || "(sem assunto)"}</p>
          <pre className="text-[11px] font-mono whitespace-pre-wrap text-muted-foreground border-l-2 border-violet-300 pl-2 max-h-[200px] overflow-y-auto">
            {send.final_body || "(sem corpo)"}
          </pre>
        </>
      )}

      <div className="flex items-center justify-between gap-2 pt-1">
        {!dealContactEmail ? (
          <p className="text-[10px] text-destructive flex-1">
            Deal sem <code>contact_email</code> — preenche no cadastro do deal antes de enviar.
          </p>
        ) : (
          <p className="text-[10px] text-muted-foreground flex-1 truncate">
            Envio via Mailchimp pra <strong>{dealContactEmail}</strong>
          </p>
        )}
        <Button
          size="sm"
          onClick={handleSend}
          disabled={!canSend || sendStep.isPending || editing}
          className="h-7 text-xs gap-1 shrink-0"
        >
          {sendStep.isPending ? (
            <>
              <IconRefresh className="h-3 w-3 animate-spin" />
              Enviando…
            </>
          ) : (
            <>
              <IconSend className="h-3 w-3" />
              Enviar agora
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
