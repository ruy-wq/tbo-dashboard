"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { IconBell, IconLoader2, IconCheck } from "@tabler/icons-react";
import { useProfile, useUpdateProfile } from "@/features/configuracoes/hooks/use-settings";
import {
  parseNotificationPrefs,
  parsePreferences,
  DEFAULT_NOTIFICATION_PREFS,
  type NotificationPrefs,
} from "@/features/configuracoes/types";

// ── Skeleton ───────────────────────────────────────────────────────────────

function NotificationSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="flex items-center justify-between">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-5 w-10 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Toggle row ─────────────────────────────────────────────────────────────

function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <Label htmlFor={id} className="text-sm font-medium cursor-pointer">
          {label}
        </Label>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function NotificationsSettings() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const [dirty, setDirty] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [prefs, setPrefs] = useState<NotificationPrefs>(() =>
    parseNotificationPrefs(profile),
  );

  const [initialized, setInitialized] = useState(false);
  if (profile && !initialized) {
    setPrefs(parseNotificationPrefs(profile));
    setInitialized(true);
  }

  const toggle = useCallback(
    (key: keyof NotificationPrefs) => (value: boolean) => {
      setPrefs((prev) => ({ ...prev, [key]: value }));
      setDirty(true);
      setSaveSuccess(false);
    },
    [],
  );

  const handleSave = () => {
    const currentPrefs = parsePreferences(
      (profile as { preferences?: unknown } | undefined)?.preferences,
    );
    updateProfile.mutate(
      { preferences: { ...currentPrefs, notifications: prefs } } as never,
      {
        onSuccess: () => {
          setDirty(false);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        },
      },
    );
  };

  if (isLoading) return <NotificationSkeleton />;

  return (
    <div className="space-y-6">
      {/* Canais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <IconBell size={16} className="text-muted-foreground" />
            Canais de notificação
          </CardTitle>
          <CardDescription>Como você quer receber as notificações.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleRow
            id="email_enabled"
            label="E-mail"
            description="Receba resumos e alertas importantes por e-mail"
            checked={prefs.email_enabled}
            onChange={toggle("email_enabled")}
          />
          <ToggleRow
            id="push_enabled"
            label="Notificações no app"
            description="Alertas em tempo real enquanto você usa o TBO OS"
            checked={prefs.push_enabled}
            onChange={toggle("push_enabled")}
          />
        </CardContent>
      </Card>

      {/* Módulos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Módulos</CardTitle>
          <CardDescription>Escolha de quais módulos você quer receber notificações.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleRow id="notif_projetos" label="Projetos" checked={prefs.projetos} onChange={toggle("projetos")} />
          <Separator />
          <ToggleRow id="notif_tarefas" label="Tarefas" checked={prefs.tarefas} onChange={toggle("tarefas")} />
          <Separator />
          <ToggleRow id="notif_reunioes" label="Reuniões" checked={prefs.reunioes} onChange={toggle("reunioes")} />
          <Separator />
          <ToggleRow id="notif_okrs" label="OKRs" checked={prefs.okrs} onChange={toggle("okrs")} />
          <Separator />
          <ToggleRow id="notif_financeiro" label="Financeiro" description="Apenas admin" checked={prefs.financeiro} onChange={toggle("financeiro")} />
          <Separator />
          <ToggleRow id="notif_comercial" label="Comercial / CRM" checked={prefs.comercial} onChange={toggle("comercial")} />
          <Separator />
          <ToggleRow id="notif_reconhecimentos" label="Reconhecimentos" checked={prefs.reconhecimentos} onChange={toggle("reconhecimentos")} />
        </CardContent>
      </Card>

      {/* Tipos de evento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tipos de evento</CardTitle>
          <CardDescription>Quais ações disparam notificações para você.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleRow id="notif_mention" label="Menções" description="Quando alguém te menciona em comentários ou tarefas" checked={prefs.mention} onChange={toggle("mention")} />
          <Separator />
          <ToggleRow id="notif_assignment" label="Atribuições" description="Quando uma tarefa ou projeto é atribuído a você" checked={prefs.assignment} onChange={toggle("assignment")} />
          <Separator />
          <ToggleRow id="notif_deadline" label="Prazos" description="Lembretes de vencimento de tarefas e entregas" checked={prefs.deadline} onChange={toggle("deadline")} />
          <Separator />
          <ToggleRow id="notif_comment" label="Comentários" description="Quando alguém comenta em itens que você acompanha" checked={prefs.comment} onChange={toggle("comment")} />
          <Separator />
          <ToggleRow id="notif_status_change" label="Mudança de status" description="Quando o status de um item que você segue muda" checked={prefs.status_change} onChange={toggle("status_change")} />
        </CardContent>
      </Card>

      {/* Save bar */}
      {(dirty || saveSuccess) && (
        <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 shadow-sm">
          {saveSuccess ? (
            <p className="text-sm text-emerald-600 flex items-center gap-2">
              <IconCheck size={16} />
              Preferências salvas
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Você tem alterações não salvas.</p>
          )}
          {dirty && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPrefs(parseNotificationPrefs(profile));
                  setDirty(false);
                }}
              >
                Descartar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={updateProfile.isPending}>
                {updateProfile.isPending && <IconLoader2 size={14} className="mr-2 animate-spin" />}
                Salvar
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
