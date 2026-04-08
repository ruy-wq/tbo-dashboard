"use client";

import { useState } from "react";
import {
  IconLink,
  IconCopy,
  IconCheck,
  IconLock,
  IconExternalLink,
} from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useCreateSocialReport, type SocialReportRow } from "../../hooks/use-social-reports";
import { useAuthStore } from "@/stores/auth-store";

interface ShareReportDialogProps {
  clientName: string;
  handle: string;
  platform: string;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  reportData: Record<string, unknown>;
  children: React.ReactNode;
}

export function ShareReportDialog({
  clientName,
  handle,
  platform,
  periodLabel,
  periodStart,
  periodEnd,
  reportData,
  children,
}: ShareReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [created, setCreated] = useState<SocialReportRow | null>(null);
  const [copied, setCopied] = useState(false);

  const tenantId = useAuthStore((s) => s.tenantId);
  const createReport = useCreateSocialReport();

  const shareUrl = created
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/relatorio-social/${created.token}`
    : "";

  async function handleCreate() {
    if (!tenantId) {
      toast.error("Sessão inválida. Faça login novamente.");
      return;
    }

    const result = await createReport.mutateAsync({
      tenantId,
      clientName,
      handle,
      platform,
      reportData,
      periodLabel,
      periodStart,
      periodEnd,
      accessPassword: password || undefined,
    });

    setCreated(result);
  }

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleReset() {
    setCreated(null);
    setPassword("");
    setCopied(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) handleReset(); }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconLink className="size-5" />
            Compartilhar Relatório
          </DialogTitle>
        </DialogHeader>

        {!created ? (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/50 p-3 space-y-1">
              <p className="text-sm font-medium">{clientName}</p>
              <p className="text-xs text-muted-foreground">{handle} · {periodLabel}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-1.5 text-sm">
                <IconLock className="size-3.5" />
                Senha de acesso (opcional)
              </Label>
              <Input
                id="password"
                type="text"
                placeholder="Deixe vazio para acesso livre"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Se definida, o cliente precisará digitar a senha para ver o relatório.
              </p>
            </div>

            <Button
              onClick={handleCreate}
              disabled={createReport.isPending}
              className="w-full"
            >
              {createReport.isPending ? "Gerando link..." : "Gerar link de compartilhamento"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border bg-emerald-50 dark:bg-emerald-950/20 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <IconCheck className="size-4 text-emerald-600" />
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Link criado</p>
              </div>
              {created.access_password && (
                <Badge variant="secondary" className="text-[10px]">
                  <IconLock className="size-3 mr-1" /> Protegido por senha
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={shareUrl}
                className="text-xs font-mono"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button size="icon" variant="outline" onClick={handleCopy}>
                {copied ? <IconCheck className="size-4 text-emerald-500" /> : <IconCopy className="size-4" />}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                  <IconExternalLink className="size-3.5 mr-1" /> Abrir
                </a>
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={handleCopy}>
                <IconCopy className="size-3.5 mr-1" /> Copiar link
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
