"use client";

import { useCallback, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  IconCloudUpload,
  IconPhoto,
  IconGif,
  IconVideo,
  IconLink,
  IconX,
  IconLoader2,
} from "@tabler/icons-react";
import {
  useUploadEmailAsset,
  type EmailAssetKind,
} from "../hooks/use-upload-email-asset";

interface InsertMediaDialogProps {
  open: boolean;
  onClose: () => void;
  kind: "image" | "gif" | "video" | "any";
  onInsert: (markdown: string) => void;
}

const KIND_COPY: Record<
  InsertMediaDialogProps["kind"],
  { title: string; description: string; accept: string; icon: typeof IconPhoto }
> = {
  image: {
    title: "Inserir imagem",
    description: "Arraste uma imagem ou cole uma URL externa.",
    accept: "image/jpeg,image/png,image/webp",
    icon: IconPhoto,
  },
  gif: {
    title: "Inserir GIF",
    description: "Arraste um GIF animado ou cole uma URL externa.",
    accept: "image/gif",
    icon: IconGif,
  },
  video: {
    title: "Inserir vídeo",
    description:
      "Arraste um vídeo MP4/WebM (até 10 MB) ou cole URL do YouTube/Vimeo. Renderiza como thumbnail clicável no e-mail.",
    accept: "video/mp4,video/webm,video/quicktime",
    icon: IconVideo,
  },
  any: {
    title: "Inserir mídia",
    description: "Arraste um arquivo ou cole uma URL.",
    accept: "image/*,video/mp4,video/webm",
    icon: IconPhoto,
  },
};

export function InsertMediaDialog({
  open,
  onClose,
  kind,
  onInsert,
}: InsertMediaDialogProps) {
  const copy = KIND_COPY[kind];
  const Icon = copy.icon;
  const uploadMutation = useUploadEmailAsset();

  const [tab, setTab] = useState<"upload" | "url">("upload");
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [externalUrl, setExternalUrl] = useState("");
  const [altText, setAltText] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function reset() {
    setSelectedFile(null);
    setFilePreview(null);
    setExternalUrl("");
    setAltText("");
    setTab("upload");
    setDragging(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleFileSelected(file: File) {
    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
    if (!altText && file.name) {
      setAltText(file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelected(file);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleConfirm() {
    let markdown = "";

    if (tab === "upload" && selectedFile) {
      const uploaded = await uploadMutation.mutateAsync(selectedFile);
      markdown = renderMarkdown(uploaded.kind, uploaded.url, altText);
    } else if (tab === "url" && externalUrl.trim()) {
      const url = externalUrl.trim();
      const inferredKind: EmailAssetKind =
        kind === "video" ? "video" : kind === "gif" ? "gif" : "image";
      markdown = renderMarkdown(inferredKind, url, altText);
    } else {
      return;
    }

    onInsert(markdown);
    handleClose();
  }

  function renderMarkdown(k: EmailAssetKind, url: string, alt: string): string {
    const safeAlt = alt || (k === "video" ? "Assistir vídeo" : k === "gif" ? "GIF" : "");
    return `![${safeAlt}](${url})`;
  }

  const canConfirm =
    (tab === "upload" && !!selectedFile && !uploadMutation.isPending) ||
    (tab === "url" && externalUrl.trim().length > 0);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Icon className="h-4 w-4" />
            {copy.title}
          </DialogTitle>
          <DialogDescription className="text-xs">{copy.description}</DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "upload" | "url")}>
          <TabsList className="w-full">
            <TabsTrigger value="upload" className="flex-1 gap-1.5">
              <IconCloudUpload className="h-3.5 w-3.5" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="url" className="flex-1 gap-1.5">
              <IconLink className="h-3.5 w-3.5" />
              URL externa
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-3 space-y-3">
            {!selectedFile && (
              <div
                className={`rounded-lg border-2 border-dashed transition-colors p-8 text-center cursor-pointer ${
                  dragging
                    ? "border-primary bg-primary/5"
                    : "border-border bg-muted/20 hover:bg-muted/40"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <IconCloudUpload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium mb-1">
                  Arraste o arquivo aqui
                </p>
                <p className="text-xs text-muted-foreground">
                  ou clique para selecionar · máx. 10 MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={copy.accept}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelected(file);
                  }}
                />
              </div>
            )}

            {selectedFile && (
              <div className="rounded-lg border border-border bg-card overflow-hidden">
                {filePreview ? (
                  <div className="bg-zinc-950 flex items-center justify-center p-2 max-h-[220px] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={filePreview}
                      alt={altText || "preview"}
                      className="max-h-[200px] w-auto rounded"
                    />
                  </div>
                ) : (
                  <div className="bg-muted/30 p-8 text-center">
                    <IconVideo className="h-8 w-8 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">
                      Vídeo carregado — pré-visualização não disponível
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-between p-2 border-t border-border">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{selectedFile.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB · {selectedFile.type}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => {
                      setSelectedFile(null);
                      setFilePreview(null);
                    }}
                  >
                    <IconX className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="url" className="mt-3 space-y-3">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">
                URL
              </label>
              <Input
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder={
                  kind === "video"
                    ? "https://youtube.com/watch?v=... ou https://vimeo.com/..."
                    : "https://exemplo.com/imagem.jpg"
                }
                className="mt-0.5 h-9"
              />
            </div>
          </TabsContent>
        </Tabs>

        <div>
          <label className="text-[11px] font-medium text-muted-foreground">
            Descrição curta (alt text)
          </label>
          <Input
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder="Ex: caso do lançamento em Joinville"
            className="mt-0.5 h-9"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!canConfirm || uploadMutation.isPending}>
            {uploadMutation.isPending ? (
              <>
                <IconLoader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Enviando...
              </>
            ) : (
              "Inserir"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
