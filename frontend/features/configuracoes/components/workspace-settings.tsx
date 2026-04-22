"use client";

import { useMemo, useState, useCallback, useRef } from "react";
import { IconBuilding } from "@tabler/icons-react";
import { RBACGuard } from "@/components/rbac-guard";
import { useProfile, useUpdateProfile } from "@/features/configuracoes/hooks/use-settings";
import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/lib/supabase/types";
import { parsePreferences } from "@/features/configuracoes/types";
import {
  WorkspaceSkeleton,
  WorkspaceSaveBar,
  type WorkspacePrefs,
  DEFAULT_WORKSPACE,
} from "./workspace-settings-parts";
import { WorkspaceIdentityCard } from "./workspace-identity-card";

export function WorkspaceSettings() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const supabase = useMemo(() => createClient(), []);

  const [dirty, setDirty] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const storedWorkspace = parsePreferences(profile?.preferences).workspace as Partial<WorkspacePrefs> | undefined;

  const [workspace, setWorkspace] = useState<WorkspacePrefs>(() => ({
    ...DEFAULT_WORKSPACE,
    ...storedWorkspace,
  }));

  // Initialize once when profile loads
  const initialized = useRef(false);
  if (profile && !initialized.current) {
    const stored = parsePreferences(profile.preferences).workspace as Partial<WorkspacePrefs> | undefined;
    if (stored) setWorkspace({ ...DEFAULT_WORKSPACE, ...stored });
    initialized.current = true;
  }

  const set = useCallback((key: keyof WorkspacePrefs, value: string) => {
    setWorkspace((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
    setSaveSuccess(false);
    setUploadError(null);
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Formato inválido. Use JPG, PNG, WebP ou SVG.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("Arquivo muito grande. Máximo 2 MB.");
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      const ext = file.name.split(".").pop() ?? "png";
      const path = `workspace/logo.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      set("logo_url", data.publicUrl + `?t=${Date.now()}`);
    } catch {
      setUploadError("Erro ao fazer upload da logo. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    const currentPrefs = parsePreferences(profile?.preferences);
    updateProfile.mutate(
      { preferences: { ...currentPrefs, workspace } as unknown as Json },
      {
        onSuccess: () => {
          setDirty(false);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        },
      },
    );
  };

  const handleDiscard = () => {
    const stored = parsePreferences(profile?.preferences).workspace as Partial<WorkspacePrefs> | undefined;
    setWorkspace({ ...DEFAULT_WORKSPACE, ...(stored ?? {}) });
    setDirty(false);
    setUploadError(null);
  };

  if (isLoading) return <RBACGuard minRole="admin"><WorkspaceSkeleton /></RBACGuard>;

  const logoInitials = (workspace.name || "TBO")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <RBACGuard minRole="admin">
    <div className="space-y-6">
      <WorkspaceIdentityCard
        workspace={workspace}
        logoInitials={logoInitials}
        uploading={uploading}
        uploadError={uploadError}
        onUpload={handleLogoUpload}
        onChange={set}
        titleIcon={<IconBuilding size={16} className="text-muted-foreground" />}
      />

      <WorkspaceSaveBar
        dirty={dirty}
        saveSuccess={saveSuccess}
        isPending={updateProfile.isPending}
        onSave={handleSave}
        onDiscard={handleDiscard}
      />
    </div>
    </RBACGuard>
  );
}
