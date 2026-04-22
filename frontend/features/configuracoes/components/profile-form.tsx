"use client";

import { useState, useRef } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { useProfile, useUpdateProfile, useUploadAvatar } from "@/features/configuracoes/hooks/use-settings";
import { parsePreferences } from "@/features/configuracoes/types";
import { useAuthStore } from "@/stores/auth-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { IconAlertCircle } from "@tabler/icons-react";
import type { Database } from "@/lib/supabase/types";
import { ProfileFormSkeleton, ProfileAvatarCard, ProfileSaveBar } from "./profile-form-parts";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

const profileSchema = z.object({
  full_name: z.string().min(1, "Nome é obrigatório"),
  phone: z.string().optional(),
  department: z.string().optional(),
  bio: z.string().max(200, "Máximo 200 caracteres").optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const { data: profile, isLoading } = useProfile();
  if (isLoading || !profile) return <ProfileFormSkeleton />;
  return <ProfileFormContent key={profile.id} profile={profile} />;
}

function ProfileFormContent({ profile }: { profile: ProfileRow }) {
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const role = useAuthStore((s) => s.role);
  const fileRef = useRef<HTMLInputElement>(null);

  const initialBio = parsePreferences(profile.preferences).bio ?? "";
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [department, setDepartment] = useState(profile.department ?? "");
  const [bio, setBio] = useState(initialBio);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileFormData, string>>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  function handleSave() {
    const result = profileSchema.safeParse({ full_name: fullName, phone, department, bio });
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ProfileFormData, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof ProfileFormData;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    const currentPrefs = parsePreferences(profile.preferences);
    updateProfile.mutate(
      { full_name: fullName, phone, department, preferences: { ...currentPrefs, bio } },
      {
        onSuccess: () => {
          setDirty(false);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        },
      },
    );
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máx. 5MB)");
      return;
    }
    uploadAvatar.mutate(file);
  }

  function markDirty() {
    setDirty(true);
    setSaveSuccess(false);
  }

  function handleDiscard() {
    setFullName(profile.full_name ?? "");
    setPhone(profile.phone ?? "");
    setDepartment(profile.department ?? "");
    setBio(initialBio);
    setDirty(false);
    setErrors({});
  }

  const initials = (profile.full_name ?? "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const currentRole = role ?? (profile.role as string | null) ?? "colaborador";

  return (
    <div className="space-y-6">
      <ProfileAvatarCard
        avatarUrl={profile.avatar_url}
        fullName={profile.full_name}
        email={profile.email}
        department={profile.department}
        currentRole={currentRole}
        initials={initials}
        isUploading={uploadAvatar.isPending}
        fileRef={fileRef}
        onFileChange={handleAvatarChange}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informações pessoais</CardTitle>
          <CardDescription>Visível para outros membros da equipe.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">
                Nome completo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); markDirty(); setErrors((p) => ({ ...p, full_name: undefined })); }}
                className={errors.full_name ? "border-destructive" : ""}
              />
              {errors.full_name && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <IconAlertCircle size={12} />{errors.full_name}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" value={profile.email ?? ""} disabled className="opacity-60" />
              <p className="text-xs text-muted-foreground">E-mail não pode ser alterado aqui.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone / WhatsApp</Label>
              <Input id="phone" placeholder="(00) 90000-0000" value={phone}
                onChange={(e) => { setPhone(e.target.value); markDirty(); }} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Departamento / BU</Label>
              <Input id="department" placeholder="Ex: Branding, Marketing..." value={department}
                onChange={(e) => { setDepartment(e.target.value); markDirty(); }} />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio" rows={3}
              placeholder="Conte um pouco sobre você, sua área de atuação..."
              value={bio}
              onChange={(e) => { setBio(e.target.value); markDirty(); setErrors((p) => ({ ...p, bio: undefined })); }}
              className={errors.bio ? "border-destructive" : ""}
            />
            <div className="flex items-center justify-between">
              {errors.bio ? (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <IconAlertCircle size={12} />{errors.bio}
                </p>
              ) : <span />}
              <p className="text-xs text-muted-foreground ml-auto">{bio.length}/200</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ProfileSaveBar
        dirty={dirty}
        saveSuccess={saveSuccess}
        isSaving={updateProfile.isPending}
        onDiscard={handleDiscard}
        onSave={handleSave}
      />
    </div>
  );
}
