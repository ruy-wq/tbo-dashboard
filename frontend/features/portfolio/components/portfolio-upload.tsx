"use client";

import { useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  IconUpload,
  IconLink,
  IconX,
  IconPhoto,
  IconVideo,
  IconLoader2,
  IconCheck,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type UploadMode = "upload" | "link";

interface PortfolioUploadProps {
  label: string;
  accept: "image" | "video" | "both";
  value: string;
  onChange: (url: string) => void;
  hint?: string;
}

const ACCEPT_MAP = {
  image: "image/jpeg,image/png,image/webp,image/gif",
  video: "video/mp4,video/quicktime,video/webm",
  both: "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm",
};

const MAX_SIZE_MB = 500;

export function PortfolioUpload({
  label,
  accept,
  value,
  onChange,
  hint,
}: PortfolioUploadProps) {
  const [mode, setMode] = useState<UploadMode>(value ? "link" : "upload");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isImage = accept === "image";
  const Icon = isImage ? IconPhoto : IconVideo;

  const handleFile = useCallback(
    async (file: File) => {
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        toast.error(`Arquivo muito grande (max ${MAX_SIZE_MB}MB)`);
        return;
      }

      setUploading(true);
      setProgress(10);

      try {
        const supabase = createClient();
        const ext = file.name.split(".").pop() || "bin";
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

        setProgress(30);

        const { error } = await supabase.storage
          .from("portfolio")
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) throw error;

        setProgress(80);

        const { data: urlData } = supabase.storage
          .from("portfolio")
          .getPublicUrl(path);

        setProgress(100);
        onChange(urlData.publicUrl);
        toast.success("Upload concluido");
      } catch (err) {
        toast.error("Erro no upload");
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [onChange],
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <div className="flex items-center border rounded-md text-xs">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={cn(
              "px-2.5 py-1 rounded-l-md transition-colors",
              mode === "upload" ? "bg-primary text-primary-foreground" : "hover:bg-muted",
            )}
          >
            <IconUpload className="size-3 inline mr-1" />
            Upload
          </button>
          <button
            type="button"
            onClick={() => setMode("link")}
            className={cn(
              "px-2.5 py-1 rounded-r-md transition-colors",
              mode === "link" ? "bg-primary text-primary-foreground" : "hover:bg-muted",
            )}
          >
            <IconLink className="size-3 inline mr-1" />
            Link
          </button>
        </div>
      </div>

      {mode === "link" ? (
        <div className="space-y-1.5">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={
              isImage
                ? "https://... (URL da imagem)"
                : "https://vimeo.com/... ou https://drive.google.com/..."
            }
          />
          {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            "relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors",
            dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/40",
            uploading && "pointer-events-none opacity-60",
          )}
        >
          {uploading ? (
            <>
              <IconLoader2 className="size-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Enviando...</p>
              <Progress value={progress} className="w-full max-w-xs h-1.5" />
            </>
          ) : (
            <>
              <Icon className="size-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground text-center">
                Arraste {isImage ? "uma imagem" : "um video"} aqui ou{" "}
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="text-primary hover:underline font-medium"
                >
                  selecione do computador
                </button>
              </p>
              <p className="text-[11px] text-muted-foreground/70">
                {isImage ? "JPG, PNG, WebP" : "MP4, MOV, WebM"} · max {MAX_SIZE_MB}MB
              </p>
            </>
          )}

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT_MAP[accept]}
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
      )}

      {/* Preview */}
      {value && !uploading && (
        <div className="relative rounded-md border overflow-hidden">
          {isImage || value.match(/\.(jpg|jpeg|png|webp|gif)/i) ? (
            <div className="aspect-video">
              <img
                src={value}
                alt="Preview"
                className="h-full w-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-muted/50 text-sm">
              <IconCheck className="size-4 text-green-500" />
              <span className="truncate flex-1">{value.split("/").pop()}</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-1.5 right-1.5 size-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
          >
            <IconX className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
