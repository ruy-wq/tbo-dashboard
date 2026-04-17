"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  IconSparkles,
  IconRefresh,
  IconSend,
  IconCheck,
  IconTrash,
  IconClock,
  IconPhoto,
  IconGif,
  IconVideo,
  IconLink,
  IconEye,
  IconCode,
} from "@tabler/icons-react";
import { buildTboEmailHtml } from "@/lib/email-templates/tbo-outbound";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  useAiEmailDrafts,
  useGenerateAiEmailDrafts,
  useUpdateAiEmailDraft,
  useDiscardAiEmailDraft,
} from "../hooks/use-ai-email-drafts";
import type {
  AiEmailDraft,
  AiEmailDraftVariant,
} from "../services/ai-email-drafts";
import type { Database } from "@/lib/supabase/types";

type DealRow = Database["public"]["Tables"]["crm_deals"]["Row"];

interface Props {
  deal: DealRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AiEmailDraftsDrawer({ deal, open, onOpenChange }: Props) {
  const { data: drafts = [], isLoading } = useAiEmailDrafts(deal?.id ?? null);
  const generateMutation = useGenerateAiEmailDrafts();
  const updateMutation = useUpdateAiEmailDraft();
  const discardMutation = useDiscardAiEmailDraft();

  // Rascunhos ativos (não descartados/enviados)
  const activeDrafts = useMemo(
    () => drafts.filter((d) => d.status !== "discarded" && d.status !== "sent"),
    [drafts],
  );
  const lastDraft = activeDrafts[0] ?? null;

  if (!deal) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="p-0 sm:max-w-[680px] flex flex-col h-full max-h-screen">
        <div className="border-b bg-muted/30 px-6 pt-6 pb-4 shrink-0">
          <SheetHeader className="space-y-1.5">
            <SheetTitle className="flex items-center gap-2 text-base">
              <IconSparkles className="h-4 w-4 text-violet-500" />
              Rascunhos de e-mail com IA
            </SheetTitle>
            <SheetDescription className="text-xs">
              Gerados a partir do contexto do deal <span className="font-medium">{deal.name}</span>
              {deal.company ? ` (${deal.company})` : ""}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => generateMutation.mutate(deal.id)}
              disabled={generateMutation.isPending}
              className="gap-1.5"
            >
              {generateMutation.isPending ? (
                <>
                  <IconRefresh className="h-3.5 w-3.5 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <IconSparkles className="h-3.5 w-3.5" />
                  {lastDraft ? "Gerar novos" : "Gerar rascunhos"}
                </>
              )}
            </Button>
            {drafts.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {activeDrafts.length} ativo{activeDrafts.length === 1 ? "" : "s"} · {drafts.length} total
              </span>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6 space-y-4">
            {isLoading && (
              <div className="text-sm text-muted-foreground text-center py-8">
                Carregando rascunhos...
              </div>
            )}

            {!isLoading && drafts.length === 0 && !generateMutation.isPending && (
              <div className="rounded-md border border-dashed border-border bg-muted/30 p-8 text-center">
                <IconSparkles className="h-8 w-8 text-violet-400 mx-auto mb-3" />
                <p className="text-sm font-medium mb-1">Nenhum rascunho ainda</p>
                <p className="text-xs text-muted-foreground">
                  Clique em &ldquo;Gerar rascunhos&rdquo; — a IA vai criar 3 variações baseadas
                  no contexto do deal e no framework TBO.
                </p>
              </div>
            )}

            {generateMutation.isPending && (
              <div className="rounded-md border border-violet-300 bg-violet-50 dark:bg-violet-950 dark:border-violet-800 p-4 text-sm text-violet-900 dark:text-violet-200 flex items-center gap-3">
                <IconRefresh className="h-4 w-4 animate-spin" />
                <span>Consultando Claude, montando contexto do deal e activities... (~5-10s)</span>
              </div>
            )}

            {activeDrafts.map((draft) => (
              <DraftCard
                key={draft.id}
                draft={draft}
                onUpdate={(updates) =>
                  updateMutation.mutate({ id: draft.id, updates })
                }
                onDiscard={() => discardMutation.mutate(draft.id)}
                isSaving={updateMutation.isPending}
              />
            ))}

            {/* Histórico */}
            {drafts.length > activeDrafts.length && (
              <div className="pt-2">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Histórico
                </p>
                <div className="space-y-1.5">
                  {drafts
                    .filter((d) => d.status === "sent" || d.status === "discarded")
                    .map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between text-xs border border-border rounded-md px-3 py-2"
                      >
                        <span className="text-muted-foreground">
                          {formatDistanceToNow(new Date(d.created_at), { locale: ptBR, addSuffix: true })}
                          {d.final_subject ? ` · ${d.final_subject}` : ""}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            d.status === "sent"
                              ? "text-emerald-600 border-emerald-300"
                              : "text-muted-foreground"
                          }`}
                        >
                          {d.status === "sent" ? "enviado" : "descartado"}
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

// ──────────────────────────────────────────────────────────────────
// Card de um draft (com 3 variações + editor)
// ──────────────────────────────────────────────────────────────────

interface DraftCardProps {
  draft: AiEmailDraft;
  onUpdate: (
    updates: Partial<
      Pick<
        AiEmailDraft,
        "selected_variant_index" | "final_subject" | "final_body" | "status"
      >
    >,
  ) => void;
  onDiscard: () => void;
  isSaving: boolean;
}

function DraftCard({ draft, onUpdate, onDiscard, isSaving }: DraftCardProps) {
  const [activeVariant, setActiveVariant] = useState<number>(
    draft.selected_variant_index ?? 0,
  );
  const [editing, setEditing] = useState(false);
  const [subject, setSubject] = useState(
    draft.final_subject ?? draft.variants[activeVariant]?.subject ?? "",
  );
  const [body, setBody] = useState(
    draft.final_body ?? draft.variants[activeVariant]?.body ?? "",
  );

  useEffect(() => {
    if (!editing) {
      const v = draft.variants[activeVariant];
      setSubject(draft.final_subject ?? v?.subject ?? "");
      setBody(draft.final_body ?? v?.body ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeVariant, editing]);

  function handleSelect(idx: number) {
    setActiveVariant(idx);
    onUpdate({ selected_variant_index: idx });
  }

  function handleSaveEdits() {
    onUpdate({
      final_subject: subject,
      final_body: body,
      status: "edited",
      selected_variant_index: activeVariant,
    });
    setEditing(false);
    toast.success("Edição salva");
  }

  function handleSend() {
    // TODO (próxima iteração): integrar com send-email-campaign p/ 1 destinatário
    // Por enquanto, só marca como sent manualmente + mostra toast
    toast.info("Envio 1-a-1 via Mailchimp em breve", {
      description:
        "Por ora, copie o conteúdo e envie manualmente pela sua caixa ou dispare campanha no Email Studio.",
    });
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b bg-muted/30 px-3 py-2">
        <div className="flex items-center gap-2 text-xs">
          <IconClock className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">
            {formatDistanceToNow(new Date(draft.created_at), { locale: ptBR, addSuffix: true })}
          </span>
          <Badge variant="outline" className="text-[10px] h-4 px-1.5">
            {draft.stage_at_generation}
          </Badge>
          {draft.model && (
            <span className="text-[10px] text-muted-foreground font-mono">
              {draft.model}
            </span>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 text-[11px] text-destructive hover:text-destructive"
          onClick={onDiscard}
        >
          <IconTrash className="h-3 w-3 mr-1" />
          Descartar
        </Button>
      </div>

      {/* Tabs com 3 variações */}
      <Tabs
        value={String(activeVariant)}
        onValueChange={(v) => handleSelect(Number(v))}
      >
        <TabsList className="w-full h-9 justify-start rounded-none bg-transparent border-b px-3">
          {draft.variants.map((variant, idx) => (
            <TabsTrigger
              key={idx}
              value={String(idx)}
              className="h-7 text-xs data-[state=active]:bg-muted data-[state=active]:font-semibold"
            >
              {variant.label}
              {draft.selected_variant_index === idx && (
                <IconCheck className="ml-1.5 h-3 w-3 text-emerald-600" />
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {draft.variants.map((variant, idx) => (
          <TabsContent key={idx} value={String(idx)} className="mt-0 p-3 space-y-3">
            <VariantEditor
              variant={variant}
              editing={editing}
              subject={subject}
              body={body}
              onSubjectChange={setSubject}
              onBodyChange={setBody}
            />

            <div className="flex items-center gap-2 pt-1">
              {editing ? (
                <>
                  <Button
                    size="sm"
                    onClick={handleSaveEdits}
                    disabled={isSaving}
                    className="h-8 text-xs"
                  >
                    <IconCheck className="h-3.5 w-3.5 mr-1" />
                    Salvar edição
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditing(false);
                      setSubject(draft.final_subject ?? variant.subject);
                      setBody(draft.final_body ?? variant.body);
                    }}
                    className="h-8 text-xs"
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
                    className="h-8 text-xs"
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSend}
                    className="h-8 text-xs gap-1"
                  >
                    <IconSend className="h-3.5 w-3.5" />
                    Enviar
                  </Button>
                </>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Editor de variante (view ou edit mode)
// ──────────────────────────────────────────────────────────────────

interface VariantEditorProps {
  variant: AiEmailDraftVariant;
  editing: boolean;
  subject: string;
  body: string;
  onSubjectChange: (v: string) => void;
  onBodyChange: (v: string) => void;
}

function VariantEditor({
  variant,
  editing,
  subject,
  body,
  onSubjectChange,
  onBodyChange,
}: VariantEditorProps) {
  const [viewMode, setViewMode] = useState<"preview" | "source">("preview");
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  const currentSubject = subject || variant.subject;
  const currentBody = body || variant.body;

  // Preview renderizado com o template TBO (merge tags substituídas por valores de exemplo)
  const html = useMemo(() => {
    const rendered = buildTboEmailHtml({
      subject: currentSubject
        .replace(/\{\{\s*primeiro_nome\s*\}\}/g, "Marco")
        .replace(/\{\{\s*empresa\s*\}\}/g, "Construtora Horizonte"),
      body: currentBody
        .replace(/\{\{\s*primeiro_nome\s*\}\}/g, "Marco")
        .replace(/\{\{\s*empresa\s*\}\}/g, "Construtora Horizonte"),
      label: variant.label,
      preheader: currentSubject,
    });
    return rendered;
  }, [currentSubject, currentBody, variant.label]);

  function insertAtCursor(text: string) {
    const ta = bodyRef.current;
    if (!ta) {
      onBodyChange(body + "\n\n" + text);
      return;
    }
    const start = ta.selectionStart ?? body.length;
    const end = ta.selectionEnd ?? body.length;
    const before = body.slice(0, start);
    const after = body.slice(end);
    const needsLeadingBreak = before && !before.endsWith("\n\n");
    const prefix = needsLeadingBreak ? "\n\n" : "";
    const next = before + prefix + text + "\n\n" + after;
    onBodyChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + prefix.length + text.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  function insertImage() {
    const url = window.prompt("URL da imagem (jpg, png, gif):");
    if (!url) return;
    const alt = window.prompt("Descrição curta (alt):") ?? "";
    insertAtCursor(`![${alt}](${url.trim()})`);
  }

  function insertGif() {
    const url = window.prompt("URL do GIF:");
    if (!url) return;
    insertAtCursor(`![GIF](${url.trim()})`);
  }

  function insertVideo() {
    const url = window.prompt("URL do vídeo (YouTube, Vimeo ou .mp4):");
    if (!url) return;
    const alt = window.prompt("Chamada curta do vídeo:") ?? "";
    insertAtCursor(`![${alt}](${url.trim()})`);
  }

  function insertLink() {
    const url = window.prompt("URL:");
    if (!url) return;
    const text = window.prompt("Texto do link:") ?? url;
    insertAtCursor(`[${text}](${url.trim()})`);
  }

  if (editing) {
    return (
      <div className="space-y-3">
        <div>
          <label className="text-[11px] font-medium text-muted-foreground">Assunto</label>
          <Input
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
            className="mt-0.5 h-8 text-xs"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              Corpo (markdown simples: ![alt](url) p/ imagens, [texto](url) p/ links)
            </label>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-6 px-1.5 text-[11px] gap-1"
                onClick={insertImage}
                title="Inserir imagem"
              >
                <IconPhoto className="h-3 w-3" />
                Imagem
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-6 px-1.5 text-[11px] gap-1"
                onClick={insertGif}
                title="Inserir GIF"
              >
                <IconGif className="h-3 w-3" />
                GIF
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-6 px-1.5 text-[11px] gap-1"
                onClick={insertVideo}
                title="Inserir vídeo (thumbnail clicável)"
              >
                <IconVideo className="h-3 w-3" />
                Vídeo
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-6 px-1.5 text-[11px] gap-1"
                onClick={insertLink}
                title="Inserir link"
              >
                <IconLink className="h-3 w-3" />
                Link
              </Button>
            </div>
          </div>
          <Textarea
            ref={bodyRef}
            value={body}
            onChange={(e) => onBodyChange(e.target.value)}
            className="mt-0.5 text-xs min-h-[220px] font-mono resize-y"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium text-muted-foreground mb-0.5">
            Assunto · tom: {variant.tone}
          </p>
          <p className="text-sm font-medium">{currentSubject}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant={viewMode === "preview" ? "secondary" : "ghost"}
            className="h-6 px-2 text-[11px] gap-1"
            onClick={() => setViewMode("preview")}
          >
            <IconEye className="h-3 w-3" />
            Preview
          </Button>
          <Button
            type="button"
            size="sm"
            variant={viewMode === "source" ? "secondary" : "ghost"}
            className="h-6 px-2 text-[11px] gap-1"
            onClick={() => setViewMode("source")}
          >
            <IconCode className="h-3 w-3" />
            Texto
          </Button>
        </div>
      </div>

      {viewMode === "preview" ? (
        <div className="rounded-md border border-border overflow-hidden bg-zinc-100 dark:bg-zinc-950 p-2">
          <iframe
            srcDoc={html}
            sandbox=""
            title={`Preview: ${currentSubject}`}
            className="w-full border-0 bg-white rounded"
            style={{ minHeight: "420px", maxHeight: "620px" }}
          />
        </div>
      ) : (
        <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed text-foreground bg-muted/30 p-3 rounded-md max-h-[420px] overflow-auto">
          {currentBody}
        </pre>
      )}
    </div>
  );
}
