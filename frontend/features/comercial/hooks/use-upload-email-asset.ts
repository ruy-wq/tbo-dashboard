"use client";

import { useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export type EmailAssetKind = "image" | "gif" | "video";

export interface UploadedAsset {
  url: string;
  path: string;
  kind: EmailAssetKind;
  size: number;
  name: string;
}

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

function detectKind(file: File): EmailAssetKind {
  if (file.type.startsWith("video/")) return "video";
  if (file.type === "image/gif") return "gif";
  return "image";
}

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9.\-_]/g, "");
}

export async function uploadEmailAsset(file: File): Promise<UploadedAsset> {
  if (file.size > MAX_SIZE) {
    throw new Error(
      `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)} MB). Máximo: 10 MB.`,
    );
  }

  const supabase = createClient();
  const kind = detectKind(file);
  const timestamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  const safeName = sanitizeFilename(file.name);
  const path = `${new Date().getFullYear()}/${timestamp}-${rand}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("email-assets")
    .upload(path, file, {
      cacheControl: "31536000",
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("email-assets").getPublicUrl(path);

  return {
    url: data.publicUrl,
    path,
    kind,
    size: file.size,
    name: file.name,
  };
}

export function useUploadEmailAsset() {
  return useMutation({
    mutationFn: (file: File) => uploadEmailAsset(file),
    onError: (err) => {
      toast.error("Falha no upload", {
        description: err instanceof Error ? err.message : "Tente novamente.",
      });
    },
  });
}
