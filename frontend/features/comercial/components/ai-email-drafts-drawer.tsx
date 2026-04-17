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
  IconLoader2,
  IconLayoutGridAdd,
} from "@tabler/icons-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buildTboEmailHtml } from "@/lib/email-templates/tbo-outbound";

/**
 * Retorna o eyebrow de saudação baseado na hora atual.
 * "BOM DIA" até 12h, "BOA TARDE" entre 12 e 18h, "BOA NOITE" depois.
 */
function getGreetingEyebrow(): string {
  const h = new Date().getHours();
  if (h < 12) return "BOM DIA";
  if (h < 18) return "BOA TARDE";
  return "BOA NOITE";
}
import { InsertMediaDialog } from "./insert-media-dialog";
import { uploadEmailAsset } from "../hooks/use-upload-email-asset";
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

  const [userGuidance, setUserGuidance] = useState("");

  // Rascunhos ativos (não descartados/enviados)
  const activeDrafts = useMemo(
    () => drafts.filter((d) => d.status !== "discarded" && d.status !== "sent"),
    [drafts],
  );
  const lastDraft = activeDrafts[0] ?? null;

  function handleGenerate() {
    if (!deal) return;
    generateMutation.mutate(
      { dealId: deal.id, userGuidance: userGuidance.trim() || undefined },
      {
        onSuccess: () => setUserGuidance(""),
      },
    );
  }

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

          <div className="mt-4 space-y-2">
            <label
              htmlFor="ai-drafts-guidance"
              className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
            >
              Briefing pra IA
            </label>
            <Textarea
              id="ai-drafts-guidance"
              value={userGuidance}
              onChange={(e) => setUserGuidance(e.target.value)}
              placeholder="O que você quer comunicar com a pessoa/incorporadora neste e-mail marketing? (opcional — deixe em branco pra usar só o contexto do deal)"
              className="min-h-[72px] text-sm resize-none"
              disabled={generateMutation.isPending}
            />
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleGenerate}
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
                deal={deal}
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
  deal: DealRow;
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

function DraftCard({ draft, deal, onUpdate, onDiscard, isSaving }: DraftCardProps) {
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
        "Por ora, copie o conteúdo e envie manualmente pela sua caixa ou dispare campanha no módulo Newsletter.",
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
              deal={deal}
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
  deal: DealRow;
  editing: boolean;
  subject: string;
  body: string;
  onSubjectChange: (v: string) => void;
  onBodyChange: (v: string) => void;
}

function VariantEditor({
  variant,
  deal,
  editing,
  subject,
  body,
  onSubjectChange,
  onBodyChange,
}: VariantEditorProps) {
  const [viewMode, setViewMode] = useState<"preview" | "source">("preview");
  const [mediaDialog, setMediaDialog] = useState<
    "image" | "gif" | "video" | null
  >(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadingInline, setUploadingInline] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  const currentSubject = subject || variant.subject;
  const currentBody = body || variant.body;

  // Primeiro nome do contato real do deal (fallback pro token literal se vazio)
  const firstName = (deal.contact ?? "").trim().split(/\s+/)[0] || "{{primeiro_nome}}";
  const companyName = (deal.company ?? "").trim() || "{{empresa}}";

  // Preview renderizado com o template TBO (merge tags substituídas pelos dados reais do deal)
  const html = useMemo(() => {
    const rendered = buildTboEmailHtml({
      subject: currentSubject
        .replace(/\{\{\s*primeiro_nome\s*\}\}/g, firstName)
        .replace(/\{\{\s*empresa\s*\}\}/g, companyName),
      body: currentBody
        .replace(/\{\{\s*primeiro_nome\s*\}\}/g, firstName)
        .replace(/\{\{\s*empresa\s*\}\}/g, companyName),
      preheader: currentSubject,
      eyebrow: getGreetingEyebrow(),
    });
    return rendered;
  }, [currentSubject, currentBody, firstName, companyName]);

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

  /**
   * Insere markdown de mídia no body. Se houver um placeholder do tipo
   * correspondente ({{imagem}}, {{video}}, {{gif}}), SUBSTITUI ele pelo
   * markdown. Caso contrário, insere no cursor.
   */
  function insertMediaMarkdown(
    kind: "image" | "gif" | "video",
    markdown: string,
  ) {
    const re =
      kind === "video"
        ? /\{\{\s*(?:video|vídeo)(?:\s*:\s*[^}]+)?\s*\}\}/i
        : kind === "gif"
          ? /\{\{\s*gif(?:\s*:\s*[^}]+)?\s*\}\}/i
          : /\{\{\s*(?:imagem|image)(?:\s*:\s*[^}]+)?\s*\}\}/i;

    const match = re.exec(body);
    if (match && match.index !== undefined) {
      const start = match.index;
      const end = start + match[0].length;
      const next = body.slice(0, start) + markdown + body.slice(end);
      onBodyChange(next);
      requestAnimationFrame(() => {
        const ta = bodyRef.current;
        if (!ta) return;
        ta.focus();
        const pos = start + markdown.length;
        ta.setSelectionRange(pos, pos);
      });
      return;
    }
    insertAtCursor(markdown);
  }

  function insertPlaceholderToken(kind: "image" | "gif" | "video") {
    const token =
      kind === "video"
        ? "{{video}}"
        : kind === "gif"
          ? "{{gif}}"
          : "{{imagem}}";
    insertAtCursor(token);
    toast.info("Placeholder inserido", {
      description:
        "Arraste uma mídia sobre o editor ou clique na toolbar — o token será substituído.",
    });
  }

  // Drag-and-drop direto no textarea: aceita arquivo de imagem/vídeo,
  // faz upload pro Supabase Storage e substitui placeholder correspondente
  // ou insere o markdown no cursor.
  async function handleDropFile(file: File) {
    try {
      setUploadingInline(true);
      const uploaded = await uploadEmailAsset(file);
      const alt =
        uploaded.kind === "video"
          ? "Assistir vídeo"
          : uploaded.kind === "gif"
            ? "GIF"
            : file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
      insertMediaMarkdown(uploaded.kind, `![${alt}](${uploaded.url})`);
      toast.success("Mídia inserida no corpo do e-mail");
    } catch (err) {
      toast.error("Falha no upload", {
        description: err instanceof Error ? err.message : "Tente novamente.",
      });
    } finally {
      setUploadingInline(false);
    }
  }

  function onTextareaDrop(e: React.DragEvent<HTMLTextAreaElement>) {
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith("image/") || file.type.startsWith("video/"))) {
      e.preventDefault();
      setDragOver(false);
      void handleDropFile(file);
    }
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
              Corpo · arraste uma mídia sobre o editor pra substituir placeholders
            </label>
            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-6 px-1.5 text-[11px] gap-1"
                    title="Adicionar placeholder (será substituído depois)"
                  >
                    <IconLayoutGridAdd className="h-3 w-3" />
                    Placeholder
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="text-xs">
                  <DropdownMenuItem
                    onClick={() => insertPlaceholderToken("image")}
                    className="gap-2 text-xs"
                  >
                    <IconPhoto className="h-3.5 w-3.5" />
                    {"{{imagem}}"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => insertPlaceholderToken("gif")}
                    className="gap-2 text-xs"
                  >
                    <IconGif className="h-3.5 w-3.5" />
                    {"{{gif}}"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => insertPlaceholderToken("video")}
                    className="gap-2 text-xs"
                  >
                    <IconVideo className="h-3.5 w-3.5" />
                    {"{{video}}"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-6 px-1.5 text-[11px] gap-1"
                onClick={() => setMediaDialog("image")}
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
                onClick={() => setMediaDialog("gif")}
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
                onClick={() => setMediaDialog("video")}
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
          <div
            className={`relative rounded-md transition-all ${
              dragOver
                ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                : ""
            }`}
            onDragOver={(e) => {
              if (e.dataTransfer.types.includes("Files")) {
                e.preventDefault();
                setDragOver(true);
              }
            }}
            onDragLeave={(e) => {
              // Só sai se realmente deixou a zona (não se entrou em filho)
              if (e.currentTarget.contains(e.relatedTarget as Node)) return;
              setDragOver(false);
            }}
          >
            <Textarea
              ref={bodyRef}
              value={body}
              onChange={(e) => onBodyChange(e.target.value)}
              onDrop={onTextareaDrop}
              className="mt-0.5 text-xs min-h-[220px] font-mono resize-y"
            />
            {dragOver && (
              <div className="absolute inset-0 bg-primary/10 flex items-center justify-center pointer-events-none rounded-md border-2 border-dashed border-primary">
                <div className="bg-background px-4 py-2 rounded-md shadow-sm text-xs font-medium">
                  Solte aqui pra inserir no corpo do e-mail
                </div>
              </div>
            )}
            {uploadingInline && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center pointer-events-none rounded-md">
                <div className="flex items-center gap-2 text-xs font-medium">
                  <IconLoader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </div>
              </div>
            )}
          </div>
        </div>

        <InsertMediaDialog
          open={mediaDialog !== null}
          onClose={() => setMediaDialog(null)}
          kind={mediaDialog ?? "image"}
          onInsert={(markdown) => {
            // Se foi aberto pra um tipo específico, tenta substituir placeholder
            // correspondente antes de cair pro insert no cursor.
            const k = mediaDialog ?? "image";
            insertMediaMarkdown(k === "gif" ? "gif" : k === "video" ? "video" : "image", markdown);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium text-muted-foreground mb-0.5">
            Assunto
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
