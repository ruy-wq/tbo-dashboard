"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CampaignBriefingWithCampaign } from "@/features/clientes/services/creative-briefings";
import { IconSpeakerphone } from "@tabler/icons-react";

const STATUS_MAP: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  draft: { label: "Rascunho", variant: "secondary" },
  pending_approval: { label: "Aguardando Aprovacao", variant: "outline" },
  approved: { label: "Aprovado", variant: "default" },
  revision: { label: "Em Revisao", variant: "outline" },
};

interface Props {
  briefing: CampaignBriefingWithCampaign | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CampaignBriefingDetailDialog({ briefing, open, onOpenChange }: Props) {
  if (!briefing) return null;

  const statusInfo = STATUS_MAP[briefing.status] ?? STATUS_MAP.draft;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl" side="right">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
              <IconSpeakerphone className="h-5 w-5 text-purple-500" />
            </div>
            <div className="flex-1">
              <SheetTitle className="text-lg">
                {briefing.campaign_name}
              </SheetTitle>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">Campanha</Badge>
                <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(briefing.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </div>
          </div>
        </SheetHeader>

        <Separator />

        <ScrollArea className="h-[calc(100vh-220px)] pr-4 pt-4">
          <div className="space-y-6">
            {briefing.objective && (
              <div>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Objetivo
                </h3>
                <div className="rounded-md bg-muted/50 p-3">
                  <p className="text-sm whitespace-pre-wrap">{briefing.objective}</p>
                </div>
              </div>
            )}

            {briefing.target_audience && (
              <div>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Publico-Alvo
                </h3>
                <div className="rounded-md bg-muted/50 p-3">
                  <p className="text-sm whitespace-pre-wrap">{briefing.target_audience}</p>
                </div>
              </div>
            )}

            {briefing.key_messages.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Mensagens-Chave
                </h3>
                <div className="space-y-1.5">
                  {briefing.key_messages.map((msg, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-md bg-muted/50 p-3">
                      <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                      <p className="text-sm">{msg}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {briefing.deliverables.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Entregaveis
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {briefing.deliverables.map((d, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{d}</Badge>
                  ))}
                </div>
              </div>
            )}

            {!briefing.objective &&
              !briefing.target_audience &&
              briefing.key_messages.length === 0 &&
              briefing.deliverables.length === 0 && (
                <p className="text-sm italic text-muted-foreground">
                  Nenhuma informacao preenchida neste briefing.
                </p>
              )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
