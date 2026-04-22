"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconSparkles,
  IconArrowLeft,
  IconSend,
  IconRefresh,
  IconPlus,
  IconTrash,
  IconEye,
  IconCode,
  IconCheck,
  IconClock,
  IconSearch,
  IconExternalLink,
  IconBolt,
  IconUsers,
  IconMail,
  IconMailOff,
  IconBuilding,
  IconFilter,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { buildTboEmailHtml } from "@/lib/email-templates/tbo-outbound";
import { TboWysiwygEditor } from "@/features/marketing/components/email-studio/tbo-wysiwyg-editor";
import { RequireRole } from "@/features/auth/components/require-role";
import {
  useGenerateNewsletterDraft,
  useNewsletterDrafts,
  useUpdateNewsletterDraft,
  useDiscardNewsletterDraft,
} from "@/features/marketing/hooks/use-newsletter-drafts";
import { useCurateNewsletterThemes } from "@/features/marketing/hooks/use-newsletter-curator";
import {
  useEmailSegments,
  useSegmentLeads,
} from "@/features/marketing/hooks/use-email-segments";
import type { CuratedTheme } from "@/features/marketing/services/newsletter-curator";
import type { NewsletterDraft } from "@/features/marketing/services/newsletter-drafts";
import type { EmailSegment } from "@/features/marketing/types/marketing";

/* ─── Page ────────────────────────────────────────────────────────── */

function GerarNewsletterContent() {
  const [activeDraft, setActiveDraft] = useState<NewsletterDraft | null>(null);

  const { data: drafts = [], isLoading: loadingDrafts } = useNewsletterDrafts(8);
  const generate = useGenerateNewsletterDraft();

  const activeDrafts = useMemo(
    () =>
      drafts.filter(
        (d) => d.status !== "discarded" && d.status !== "sent",
      ),
    [drafts],
  );

  async function handleGenerate(briefing: {
    theme: string;
    tone?: string;
    audience_hint?: string;
    highlights?: string[];
    include_trending?: boolean;
    send_time?: "morning" | "afternoon" | "evening";
  }) {
    const draft = await generate.mutateAsync(briefing);
    setActiveDraft(draft);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link
              href="/marketing/newsletter"
              className="hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              <IconArrowLeft className="size-3" />
              Voltar para Newsletter
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <IconSparkles className="size-6 text-orange-500" />
            Gerar Newsletter com IA
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Briefing de tema + IA redigindo a edição inteira (abertura, trending, bloco
            principal, aspas). Revise e envie pra base.
          </p>
        </div>
      </div>

      {/* Main layout: briefing (left) + preview (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-4 min-h-[calc(100vh-260px)]">
        {/* LEFT: Briefing */}
        <div className="space-y-3">
          <BriefingPanel
            generating={generate.isPending}
            onGenerate={handleGenerate}
          />

          {/* Histórico de rascunhos */}
          <div className="rounded-lg border bg-card">
            <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Rascunhos recentes
              </p>
              <Badge variant="outline" className="text-[10px]">
                {activeDrafts.length}
              </Badge>
            </div>
            <ScrollArea className="max-h-[400px]">
              <div className="p-2 space-y-1">
                {loadingDrafts && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Carregando...
                  </p>
                )}
                {!loadingDrafts && drafts.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    Nenhum rascunho ainda. Gere o primeiro acima.
                  </p>
                )}
                {drafts.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setActiveDraft(d)}
                    className={`w-full text-left px-2.5 py-2 rounded-md transition-colors ${
                      activeDraft?.id === d.id
                        ? "bg-accent"
                        : "hover:bg-accent/50"
                    }`}
                  >
                    <p className="text-xs font-medium truncate">{d.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                      {d.subject}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <IconClock className="size-2.5 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(d.created_at), {
                          locale: ptBR,
                          addSuffix: true,
                        })}
                      </span>
                      <StatusBadge status={d.status} />
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* RIGHT: Preview + ações */}
        <div className="space-y-3 min-w-0">
          {activeDraft ? (
            <DraftPreview draft={activeDraft} onDraftChange={setActiveDraft} />
          ) : (
            <EmptyPreview isGenerating={generate.isPending} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Status badge ────────────────────────────────────────────────── */

function StatusBadge({ status }: { status: NewsletterDraft["status"] }) {
  const config = {
    pending_review: { label: "rascunho", color: "text-orange-600 border-orange-300" },
    edited: { label: "editado", color: "text-blue-600 border-blue-300" },
    scheduled: { label: "agendado", color: "text-violet-600 border-violet-300" },
    sent: { label: "enviado", color: "text-emerald-600 border-emerald-300" },
    discarded: { label: "descartado", color: "text-muted-foreground" },
  }[status];
  return (
    <Badge variant="outline" className={`text-[9px] h-3.5 px-1 ${config.color}`}>
      {config.label}
    </Badge>
  );
}

/* ─── Briefing panel ──────────────────────────────────────────────── */

interface BriefingPanelProps {
  onGenerate: (briefing: {
    theme: string;
    tone?: string;
    audience_hint?: string;
    highlights?: string[];
    include_trending?: boolean;
    send_time?: "morning" | "afternoon" | "evening";
  }) => Promise<void>;
  generating: boolean;
}

function BriefingPanel({ onGenerate, generating }: BriefingPanelProps) {
  const [theme, setTheme] = useState("");
  const [tone, setTone] = useState("informativo-denso");
  const [audience, setAudience] = useState("toda-base");
  const [highlights, setHighlights] = useState<string[]>([""]);
  const [includeTrending, setIncludeTrending] = useState(true);
  const [sendTime, setSendTime] = useState<"morning" | "afternoon" | "evening">(
    "afternoon",
  );
  const [curatorOpen, setCuratorOpen] = useState(false);

  const audienceMap: Record<string, string> = {
    "toda-base": "Toda a base (clientes, leads e inscritos)",
    "clientes-ativos": "Apenas clientes ativos",
    "leads-nutricao": "Apenas leads em nutrição",
    "incorporadoras-radar": "Incorporadoras no radar (outbound)",
  };

  async function handleGenerate() {
    if (!theme.trim()) {
      toast.error("Tema é obrigatório");
      return;
    }
    const cleanedHighlights = highlights.map((h) => h.trim()).filter(Boolean);

    await onGenerate({
      theme: theme.trim(),
      tone,
      audience_hint: audienceMap[audience],
      highlights: cleanedHighlights.length > 0 ? cleanedHighlights : undefined,
      include_trending: includeTrending,
      send_time: sendTime,
    });
  }

  function updateHighlight(idx: number, value: string) {
    setHighlights((prev) => prev.map((h, i) => (i === idx ? value : h)));
  }

  function addHighlight() {
    if (highlights.length >= 3) return;
    setHighlights((prev) => [...prev, ""]);
  }

  function removeHighlight(idx: number) {
    setHighlights((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label htmlFor="theme" className="text-xs font-semibold">
            Tema principal <span className="text-red-500">*</span>
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setCuratorOpen(true)}
            className="h-6 px-2 text-[10px] gap-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
          >
            <IconSparkles className="size-3" />
            Sugerir temas do dia
          </Button>
        </div>
        <Textarea
          id="theme"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          placeholder="Ex: marcas próprias virando protagonistas no varejo de luxo — e o que isso ensina pra incorporação premium"
          className="text-xs min-h-[90px] resize-y"
        />
        <p className="text-[10px] text-muted-foreground mt-1">
          Quanto mais específico, melhor. Descreva o ângulo editorial, não só a palavra-chave. Ou clique em{" "}
          <span className="text-orange-600 font-medium">Sugerir temas do dia</span> pra curadoria automática.
        </p>
      </div>

      <CurateThemesDialog
        open={curatorOpen}
        onClose={() => setCuratorOpen(false)}
        onUseTheme={(chosen) => {
          setTheme(chosen);
          setCuratorOpen(false);
          toast.success("Tema inserido — revise e gere a edição");
        }}
      />

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs font-semibold">Tom</Label>
          <Select value={tone} onValueChange={setTone}>
            <SelectTrigger className="mt-1 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="informativo-denso">Informativo denso</SelectItem>
              <SelectItem value="provocativo">Provocativo</SelectItem>
              <SelectItem value="reflexivo">Reflexivo</SelectItem>
              <SelectItem value="curioso">Curioso/descontraído</SelectItem>
              <SelectItem value="analitico">Analítico</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-semibold">Horário</Label>
          <Select
            value={sendTime}
            onValueChange={(v) => setSendTime(v as typeof sendTime)}
          >
            <SelectTrigger className="mt-1 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="morning">Manhã (BOM DIA)</SelectItem>
              <SelectItem value="afternoon">Tarde (BOA TARDE)</SelectItem>
              <SelectItem value="evening">Noite (BOA NOITE)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-xs font-semibold">Público</Label>
        <Select value={audience} onValueChange={setAudience}>
          <SelectTrigger className="mt-1 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(audienceMap).map(([value, label]) => (
              <SelectItem key={value} value={value} className="text-xs">
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold">
            Destaques (opcional, até 3)
          </Label>
          {highlights.length < 3 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addHighlight}
              className="h-6 text-[10px] gap-1"
            >
              <IconPlus className="size-3" />
              Adicionar
            </Button>
          )}
        </div>
        {highlights.map((h, idx) => (
          <div key={idx} className="flex gap-1.5">
            <Input
              value={h}
              onChange={(e) => updateHighlight(idx, e.target.value)}
              placeholder={`Destaque #${idx + 1} (ex: "Walmart redesenha Great Value")`}
              className="h-8 text-xs"
            />
            {highlights.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeHighlight(idx)}
                className="h-8 w-8 shrink-0"
              >
                <IconTrash className="size-3 text-muted-foreground" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-md border p-2.5">
        <div>
          <Label className="text-xs font-semibold">Seção Trending now</Label>
          <p className="text-[10px] text-muted-foreground">
            Bullets rápidos (usa blog TBO quando disponível)
          </p>
        </div>
        <Switch checked={includeTrending} onCheckedChange={setIncludeTrending} />
      </div>

      <Button
        onClick={handleGenerate}
        disabled={generating || !theme.trim()}
        className="w-full gap-2"
      >
        {generating ? (
          <>
            <IconRefresh className="size-4 animate-spin" />
            Gerando... (~10-20s)
          </>
        ) : (
          <>
            <IconSparkles className="size-4" />
            Gerar edição
          </>
        )}
      </Button>
    </div>
  );
}

/* ─── Empty preview ───────────────────────────────────────────────── */

function EmptyPreview({ isGenerating }: { isGenerating: boolean }) {
  return (
    <div className="rounded-lg border border-dashed bg-muted/20 h-full min-h-[500px] flex items-center justify-center p-8">
      <div className="text-center max-w-sm">
        {isGenerating ? (
          <>
            <IconRefresh className="size-10 text-orange-500 mx-auto mb-3 animate-spin" />
            <p className="text-sm font-semibold mb-1">Gerando edição</p>
            <p className="text-xs text-muted-foreground">
              Claude está redigindo a newsletter com base no briefing. Leva ~10-20s.
            </p>
          </>
        ) : (
          <>
            <IconSparkles className="size-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-semibold mb-1">Preencha o briefing ao lado</p>
            <p className="text-xs text-muted-foreground">
              A edição gerada aparece aqui com preview do template TBO. Você pode editar
              antes de enviar pra base.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Draft preview + editor ──────────────────────────────────────── */

function DraftPreview({
  draft,
  onDraftChange,
}: {
  draft: NewsletterDraft;
  onDraftChange: (d: NewsletterDraft) => void;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [viewMode, setViewMode] = useState<"preview" | "source">("preview");
  const [subject, setSubject] = useState(draft.subject);
  const [preheader, setPreheader] = useState(draft.preheader ?? "");
  const [eyebrow, setEyebrow] = useState(draft.eyebrow ?? "");
  const [body, setBody] = useState(draft.body);
  const [title, setTitle] = useState(draft.title);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);

  const update = useUpdateNewsletterDraft();
  const discard = useDiscardNewsletterDraft();

  // Sync local state quando draft mudar (clicou em outro do histórico)
  const didInit = useMemo(() => {
    setSubject(draft.subject);
    setPreheader(draft.preheader ?? "");
    setEyebrow(draft.eyebrow ?? "");
    setBody(draft.body);
    setTitle(draft.title);
    setEditing(false);
    return draft.id;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.id]);
  void didInit;

  const html = useMemo(() => {
    return buildTboEmailHtml({
      subject,
      body,
      preheader: preheader || subject,
      eyebrow: eyebrow || undefined,
    });
  }, [subject, body, preheader, eyebrow]);

  async function handleSave() {
    const updated = await update.mutateAsync({
      id: draft.id,
      updates: {
        title,
        subject,
        preheader: preheader || null,
        eyebrow: eyebrow || null,
        body,
        status: "edited",
      },
    });
    onDraftChange(updated);
    setEditing(false);
    toast.success("Edição salva");
  }

  function handleSend() {
    setSendDialogOpen(true);
  }

  async function handleTargetSegmentChange(segmentId: string | null) {
    const updated = await update.mutateAsync({
      id: draft.id,
      updates: { target_segment_id: segmentId },
    });
    onDraftChange(updated);
  }

  async function handleDiscard() {
    await discard.mutateAsync(draft.id);
    router.push("/marketing/newsletter");
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden flex flex-col h-full min-h-[500px]">
      {/* Header com título + status */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b bg-muted/30">
        <div className="min-w-0 flex-1">
          {editing ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-7 text-sm font-semibold"
              placeholder="Título interno da edição"
            />
          ) : (
            <p className="text-sm font-semibold truncate">{title}</p>
          )}
          <div className="flex items-center gap-1.5 mt-0.5">
            <StatusBadge status={draft.status} />
            <span className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(draft.created_at), {
                locale: ptBR,
                addSuffix: true,
              })}
            </span>
            {draft.model && (
              <span className="text-[10px] font-mono text-muted-foreground">
                {draft.model}
              </span>
            )}
            {draft.target_segment_id && (
              <Badge
                variant="outline"
                className="text-[9px] h-3.5 px-1 text-emerald-600 border-emerald-300 gap-0.5"
              >
                <IconUsers className="size-2.5" />
                base vinculada
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {editing ? (
            <>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={update.isPending}
                className="h-7 text-xs gap-1"
              >
                <IconCheck className="size-3" />
                Salvar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditing(false);
                  setSubject(draft.subject);
                  setPreheader(draft.preheader ?? "");
                  setEyebrow(draft.eyebrow ?? "");
                  setBody(draft.body);
                  setTitle(draft.title);
                }}
                className="h-7 text-xs"
              >
                Cancelar
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing(true)}
                className="h-7 text-xs"
              >
                Editar
              </Button>
              <Button
                size="sm"
                onClick={handleSend}
                className="h-7 text-xs gap-1"
              >
                <IconUsers className="size-3" />
                Selecionar base
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDiscard}
                className="h-7 text-xs text-destructive hover:text-destructive"
              >
                Descartar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Subject + preheader + eyebrow */}
      <div className="px-4 py-3 border-b space-y-2 bg-background">
        <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Eyebrow
          </Label>
          {editing ? (
            <Input
              value={eyebrow}
              onChange={(e) => setEyebrow(e.target.value)}
              placeholder="BOA TARDE"
              className="h-7 text-xs"
            />
          ) : (
            <p className="text-xs font-mono">{eyebrow || "—"}</p>
          )}
        </div>
        <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Assunto
          </Label>
          {editing ? (
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="h-7 text-xs"
            />
          ) : (
            <p className="text-sm font-medium truncate">{subject}</p>
          )}
        </div>
        <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Preheader
          </Label>
          {editing ? (
            <Input
              value={preheader}
              onChange={(e) => setPreheader(e.target.value)}
              className="h-7 text-xs"
            />
          ) : (
            <p className="text-xs text-muted-foreground truncate">
              {preheader || "—"}
            </p>
          )}
        </div>
      </div>

      {/* Toggle preview/source */}
      {!editing && (
        <div className="flex items-center justify-between gap-2 px-4 py-2 border-b bg-muted/20">
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant={viewMode === "preview" ? "secondary" : "ghost"}
              onClick={() => setViewMode("preview")}
              className="h-6 px-2 text-[11px] gap-1"
            >
              <IconEye className="size-3" />
              Preview
            </Button>
            <Button
              size="sm"
              variant={viewMode === "source" ? "secondary" : "ghost"}
              onClick={() => setViewMode("source")}
              className="h-6 px-2 text-[11px] gap-1"
            >
              <IconCode className="size-3" />
              Markdown
            </Button>
          </div>
          <span className="text-[10px] text-muted-foreground">
            {body.split(/\s+/).filter(Boolean).length} palavras
          </span>
        </div>
      )}

      {/* Body — WYSIWYG ao editar, preview read-only fora */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {editing ? (
          <TboWysiwygEditor
            body={body}
            onBodyChange={setBody}
            subject={subject}
            onSubjectChange={setSubject}
            preheader={preheader}
            eyebrow={eyebrow}
            onEyebrowChange={setEyebrow}
          />
        ) : viewMode === "preview" ? (
          <div className="h-full bg-zinc-100 dark:bg-zinc-950 p-3">
            <iframe
              srcDoc={html}
              sandbox=""
              title={`Preview: ${subject}`}
              className="w-full h-full border-0 bg-white rounded"
              style={{ minHeight: "500px" }}
            />
          </div>
        ) : (
          <pre className="h-full text-xs whitespace-pre-wrap font-mono leading-relaxed text-foreground bg-muted/20 p-4 overflow-auto">
            {body}
          </pre>
        )}
      </div>

      <SendToBaseDialog
        open={sendDialogOpen}
        onClose={() => setSendDialogOpen(false)}
        targetSegmentId={draft.target_segment_id}
        onSelectSegment={handleTargetSegmentChange}
        subject={subject}
      />
    </div>
  );
}

/* ─── Send to base dialog ─────────────────────────────────────────── */

interface SendToBaseDialogProps {
  open: boolean;
  onClose: () => void;
  targetSegmentId: string | null;
  onSelectSegment: (segmentId: string | null) => Promise<void>;
  subject: string;
}

function SendToBaseDialog({
  open,
  onClose,
  targetSegmentId,
  onSelectSegment,
  subject,
}: SendToBaseDialogProps) {
  const { data: segments = [], isLoading: loadingSegments } = useEmailSegments();
  const [selectedId, setSelectedId] = useState<string | null>(targetSegmentId);
  const [search, setSearch] = useState("");

  const selectedSegment = useMemo(
    () => segments.find((s) => s.id === selectedId) ?? null,
    [segments, selectedId],
  );

  const { data: leads = [], isLoading: loadingLeads } = useSegmentLeads(
    selectedSegment,
    500,
  );

  const filteredLeads = useMemo(() => {
    if (!search.trim()) return leads;
    const q = search.toLowerCase();
    return leads.filter(
      (l) =>
        l.name?.toLowerCase().includes(q) ||
        l.company?.toLowerCase().includes(q) ||
        l.contact?.toLowerCase().includes(q) ||
        l.contact_email?.toLowerCase().includes(q),
    );
  }, [leads, search]);

  const withEmail = useMemo(
    () => leads.filter((l) => l.contact_email && l.contact_email.trim().length > 0),
    [leads],
  );

  async function handleConfirmAndSend() {
    if (!selectedSegment) {
      toast.error("Selecione um segmento antes de enviar");
      return;
    }
    await onSelectSegment(selectedSegment.id);
    toast.info("Envio pra base via Mailchimp — em breve", {
      description: `Segmento "${selectedSegment.name}" salvo no rascunho (${withEmail.length} destinatários com e-mail). A integração de broadcast será habilitada na próxima iteração.`,
    });
    onClose();
  }

  async function handleJustSave() {
    await onSelectSegment(selectedSegment?.id ?? null);
    toast.success(
      selectedSegment
        ? `Base "${selectedSegment.name}" vinculada ao rascunho`
        : "Base removida do rascunho",
    );
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <IconUsers className="size-5 text-orange-500" />
            Selecionar base de envio
          </DialogTitle>
          <DialogDescription className="text-xs">
            Escolha o segmento de destino para{" "}
            <span className="font-semibold text-foreground">{subject}</span>. A lista vem
            direto do CRM (crm_deals) aplicando as regras do segmento.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-3 flex-1 min-h-0 overflow-hidden">
          {/* LEFT: lista de segments */}
          <div className="border rounded-lg bg-card flex flex-col min-h-0">
            <div className="px-3 py-2 border-b bg-muted/30 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Segmentos
              </p>
              <Link
                href="/marketing/newsletter/segmentos"
                className="text-[10px] text-orange-600 hover:text-orange-700 hover:underline inline-flex items-center gap-0.5"
              >
                <IconPlus className="size-3" />
                Novo
              </Link>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-1.5 space-y-1">
                {loadingSegments && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Carregando...
                  </p>
                )}
                {!loadingSegments && segments.length === 0 && (
                  <div className="text-center py-6 px-3">
                    <IconFilter className="size-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground mb-2">
                      Nenhum segmento criado ainda.
                    </p>
                    <Link
                      href="/marketing/newsletter/segmentos"
                      className="text-[11px] text-orange-600 hover:text-orange-700 font-medium"
                    >
                      Criar primeiro segmento →
                    </Link>
                  </div>
                )}
                {segments.map((s) => (
                  <SegmentRow
                    key={s.id}
                    segment={s}
                    selected={selectedId === s.id}
                    linked={targetSegmentId === s.id}
                    onClick={() => setSelectedId(s.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* RIGHT: preview da lista de leads */}
          <div className="border rounded-lg bg-card flex flex-col min-h-0">
            {!selectedSegment ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center max-w-sm">
                  <IconUsers className="size-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-semibold mb-1">
                    Selecione um segmento à esquerda
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Vai aparecer aqui a lista real de leads do CRM que recebem a
                    newsletter.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="px-3 py-2 border-b bg-muted/30 flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate">
                      {selectedSegment.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <IconUsers className="size-2.5" />
                        {loadingLeads ? "..." : `${leads.length} leads`}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5">
                        <IconMail className="size-2.5" />
                        {loadingLeads ? "..." : `${withEmail.length} c/ e-mail`}
                      </span>
                      <span>·</span>
                      <Badge
                        variant="outline"
                        className="text-[9px] h-3.5 px-1 capitalize"
                      >
                        {selectedSegment.segment_type}
                      </Badge>
                    </div>
                  </div>
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar nome, empresa, e-mail..."
                    className="h-7 text-xs w-56"
                  />
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-1">
                    {loadingLeads && (
                      <p className="text-xs text-muted-foreground text-center py-6">
                        Carregando leads do CRM...
                      </p>
                    )}
                    {!loadingLeads && filteredLeads.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-6">
                        {leads.length === 0
                          ? "Nenhum lead bate com as regras desse segmento."
                          : "Nenhum lead bate com a busca."}
                      </p>
                    )}
                    {filteredLeads.map((l) => (
                      <LeadRow key={l.id} lead={l} />
                    ))}
                    {leads.length === 500 && (
                      <p className="text-[10px] text-muted-foreground text-center py-2 italic">
                        Exibindo os 500 mais recentes. Envio real usa a lista completa.
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-2 border-t">
          <p className="text-[10px] text-muted-foreground">
            {selectedSegment
              ? `${withEmail.length} destinatários com e-mail · ${
                  leads.length - withEmail.length
                } sem e-mail (serão ignorados)`
              : "Selecione um segmento para ver a base"}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 text-xs">
              Cancelar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleJustSave}
              disabled={!selectedSegment}
              className="h-8 text-xs"
            >
              Apenas vincular base
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmAndSend}
              disabled={!selectedSegment || withEmail.length === 0}
              className="h-8 text-xs gap-1"
            >
              <IconSend className="size-3" />
              Confirmar e enviar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SegmentRow({
  segment,
  selected,
  linked,
  onClick,
}: {
  segment: EmailSegment;
  selected: boolean;
  linked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-2.5 py-2 rounded-md transition-colors ${
        selected ? "bg-accent" : "hover:bg-accent/50"
      }`}
    >
      <div className="flex items-center gap-1.5">
        <p className="text-xs font-medium truncate flex-1">{segment.name}</p>
        {linked && (
          <Badge
            variant="outline"
            className="text-[9px] h-3.5 px-1 text-emerald-600 border-emerald-300"
          >
            atual
          </Badge>
        )}
      </div>
      {segment.description && (
        <p className="text-[10px] text-muted-foreground truncate mt-0.5">
          {segment.description}
        </p>
      )}
      <div className="flex items-center gap-1.5 mt-1">
        <IconUsers className="size-2.5 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground">
          {segment.estimated_count ?? 0} leads
        </span>
        <Badge variant="outline" className="text-[9px] h-3.5 px-1 capitalize ml-auto">
          {segment.segment_type}
        </Badge>
      </div>
    </button>
  );
}

function LeadRow({
  lead,
}: {
  lead: {
    id: string;
    name: string;
    company: string | null;
    contact: string | null;
    contact_email: string | null;
    stage: string;
    source: string | null;
    value: number | null;
  };
}) {
  const hasEmail = !!lead.contact_email && lead.contact_email.trim().length > 0;
  return (
    <div
      className={`grid grid-cols-[1fr_auto] gap-2 px-2.5 py-1.5 rounded-md hover:bg-accent/40 text-xs ${
        !hasEmail ? "opacity-60" : ""
      }`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          {hasEmail ? (
            <IconMail className="size-3 text-emerald-600 shrink-0" />
          ) : (
            <IconMailOff className="size-3 text-muted-foreground shrink-0" />
          )}
          <span className="font-medium truncate">{lead.contact || lead.name}</span>
          {lead.company && (
            <>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground inline-flex items-center gap-0.5 truncate">
                <IconBuilding className="size-2.5 shrink-0" />
                {lead.company}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 pl-[18px]">
          {hasEmail ? (
            <span className="text-[10px] text-muted-foreground font-mono truncate">
              {lead.contact_email}
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground italic">
              sem e-mail no CRM
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Badge variant="outline" className="text-[9px] h-4 px-1 capitalize">
          {lead.stage}
        </Badge>
        {lead.source && (
          <Badge variant="outline" className="text-[9px] h-4 px-1 text-muted-foreground">
            {lead.source}
          </Badge>
        )}
      </div>
    </div>
  );
}

/* ─── Curate themes dialog ────────────────────────────────────────── */

interface CurateThemesDialogProps {
  open: boolean;
  onClose: () => void;
  onUseTheme: (themeText: string) => void;
}

function CurateThemesDialog({ open, onClose, onUseTheme }: CurateThemesDialogProps) {
  const curate = useCurateNewsletterThemes();
  const [themes, setThemes] = useState<CuratedTheme[] | null>(null);
  const [metadata, setMetadata] = useState<{
    web_searches_used: number;
    already_published_count: number;
    generation_ms: number;
  } | null>(null);

  async function handleCurate() {
    const result = await curate.mutateAsync();
    setThemes(result.themes);
    setMetadata({
      web_searches_used: result.metadata.web_searches_used,
      already_published_count: result.metadata.already_published_count,
      generation_ms: result.metadata.generation_ms,
    });
  }

  function handleUseTheme(t: CuratedTheme) {
    // Compose o conteúdo pro textarea com contexto editorial completo
    const sourcesBlock = t.sources.length
      ? `\n\nFontes: ${t.sources.map((s) => s.title).join(" · ")}`
      : "";
    const composed = `${t.angle}\n\nPOV: ${t.suggested_pov}${sourcesBlock}`;
    onUseTheme(composed);
    // Reset pra próxima abertura
    setThemes(null);
    setMetadata(null);
  }

  function handleClose() {
    onClose();
    // Pequeno delay pra animação de close não limpar o conteúdo antes do fade
    setTimeout(() => {
      if (!curate.isPending) {
        setThemes(null);
        setMetadata(null);
      }
    }, 300);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <IconSparkles className="size-5 text-orange-500" />
            Sugestões do editor-chefe IA
          </DialogTitle>
          <DialogDescription className="text-xs">
            Pesquisa editorial ativa em 50+ fontes (ArchDaily, Dezeen, Wallpaper, Casa
            Vogue, Valor, Metro Quadrado, Monocle, Mansion Global, Knight Frank...)
            cruzando arquitetura, design, arte, branding e mercado imobiliário de alto
            padrão. Cruzada com o que a TBO já publicou nos últimos 30 dias.
          </DialogDescription>
        </DialogHeader>

        {/* Estado inicial: botão pra pesquisar */}
        {!themes && !curate.isPending && (
          <div className="flex-1 flex items-center justify-center py-10">
            <div className="text-center max-w-md">
              <IconSearch className="size-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-semibold mb-1">Rodar curadoria agora?</p>
              <p className="text-xs text-muted-foreground mb-5">
                Claude vai pesquisar as fontes editoriais, cruzar com o blog TBO e
                sugerir 4-5 temas frescos. Leva ~30-60 segundos.
              </p>
              <Button onClick={handleCurate} className="gap-2">
                <IconSparkles className="size-4" />
                Buscar temas do dia
              </Button>
            </div>
          </div>
        )}

        {/* Loading */}
        {curate.isPending && (
          <div className="flex-1 flex items-center justify-center py-10">
            <div className="text-center max-w-md">
              <IconRefresh className="size-10 text-orange-500 mx-auto mb-3 animate-spin" />
              <p className="text-sm font-semibold mb-1">Pesquisando fontes editoriais</p>
              <p className="text-xs text-muted-foreground">
                ArchDaily → Dezeen → Wallpaper → Casa Vogue → Valor → Metro Quadrado →
                Monocle → Mansion Global...
              </p>
              <p className="text-[10px] text-muted-foreground mt-2 italic">
                Isso pode levar até 60s. Web search + cruzamento com blog TBO + seleção
                editorial.
              </p>
            </div>
          </div>
        )}

        {/* Resultados */}
        {themes && !curate.isPending && (
          <>
            {/* Métricas de curadoria */}
            {metadata && (
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground border-b pb-2">
                <span className="flex items-center gap-1">
                  <IconSearch className="size-3" />
                  {metadata.web_searches_used} buscas web
                </span>
                <span>·</span>
                <span>{metadata.already_published_count} posts do blog checados</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <IconBolt className="size-3" />
                  {(metadata.generation_ms / 1000).toFixed(1)}s
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCurate}
                  className="ml-auto h-6 text-[10px] gap-1"
                >
                  <IconRefresh className="size-3" />
                  Regenerar
                </Button>
              </div>
            )}

            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="grid grid-cols-1 gap-3 pb-2">
                {themes.map((t, idx) => (
                  <div
                    key={idx}
                    className="border rounded-lg p-4 hover:border-orange-300 transition-colors bg-card"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold leading-snug">{t.title}</h3>
                        <div className="flex flex-wrap items-center gap-1 mt-1.5">
                          {t.universes_crossed.map((u) => (
                            <Badge
                              key={u}
                              variant="outline"
                              className="text-[9px] h-4 px-1.5 uppercase tracking-wider"
                            >
                              {u}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleUseTheme(t)}
                        className="h-7 text-xs gap-1 shrink-0"
                      >
                        <IconCheck className="size-3" />
                        Usar este tema
                      </Button>
                    </div>

                    <p className="text-xs text-foreground/90 leading-relaxed mb-2">
                      {t.angle}
                    </p>

                    <div className="rounded-md bg-muted/40 border border-border/60 px-3 py-2 mb-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-600 mb-0.5">
                        POV sugerido
                      </p>
                      <p className="text-xs italic text-foreground/80">
                        {t.suggested_pov}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                      <span>
                        <strong className="font-medium">Por quê agora:</strong>{" "}
                        {t.why_now}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-[10px]">
                      <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                        SEO: {t.seo_keyword}
                      </span>
                      {t.sources.slice(0, 4).map((s, i) => (
                        <a
                          key={i}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 text-orange-600 hover:text-orange-700 hover:underline truncate max-w-[200px]"
                          title={s.title}
                        >
                          <IconExternalLink className="size-2.5 shrink-0" />
                          <span className="truncate">{s.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ─── Export ──────────────────────────────────────────────────────── */

export default function GerarNewsletterPage() {
  return (
    <RequireRole module="marketing">
      <GerarNewsletterContent />
    </RequireRole>
  );
}
