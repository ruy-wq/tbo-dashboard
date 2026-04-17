"use client";

import Link from "next/link";
import {
  IconTemplate,
  IconSpeakerphone,
  IconSend,
  IconChartBar,
  IconUsersGroup,
  IconArrowRight,
  IconPlus,
  IconSparkles,
} from "@tabler/icons-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RequireRole } from "@/features/auth/components/require-role";
import { useEmailTemplates, useEmailCampaigns, useEmailSends } from "@/features/marketing/hooks/use-email-studio";
import { useEmailSegments } from "@/features/marketing/hooks/use-email-segments";

function KPICard({
  label,
  value,
  isLoading,
}: {
  label: string;
  value: string;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-4 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-16" />
      </div>
    );
  }
  return (
    <div className="rounded-lg border bg-card p-4 space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

const SECTIONS = [
  {
    href: "/marketing/newsletter/templates",
    label: "Templates",
    description: "Biblioteca de templates de email reutilizaveis",
    icon: IconTemplate,
    color: "#3b82f6",
    bgClass: "bg-blue-500/10",
  },
  {
    href: "/marketing/newsletter/segmentos",
    label: "Segmentos",
    description: "Segmentar contatos por etapa de funil e critérios",
    icon: IconUsersGroup,
    color: "#ec4899",
    bgClass: "bg-pink-500/10",
  },
  {
    href: "/marketing/newsletter/campanhas",
    label: "Campanhas",
    description: "Criar, agendar e gerenciar campanhas de email",
    icon: IconSpeakerphone,
    color: "#8b5cf6",
    bgClass: "bg-purple-500/10",
  },
  {
    href: "/marketing/newsletter/envios",
    label: "Envios",
    description: "Historico de envios e status em tempo real",
    icon: IconSend,
    color: "#22c55e",
    bgClass: "bg-emerald-500/10",
  },
  {
    href: "/marketing/newsletter/analytics",
    label: "Analytics",
    description: "Metricas de abertura, cliques e conversao",
    icon: IconChartBar,
    color: "#f59e0b",
    bgClass: "bg-amber-500/10",
  },
] as const;

const FEATURED_ACTION = {
  href: "/marketing/newsletter/gerar",
  label: "Gerar Newsletter com IA",
  description:
    "Briefing de tema + IA redigindo a edição inteira — abertura, destaques, trending e aspas. Envio pra toda a base.",
  icon: IconSparkles,
  accent: "#e85102",
};

function EmailStudioContent() {
  const { data: templates, isLoading: loadingTemplates } = useEmailTemplates();
  const { data: campaigns, isLoading: loadingCampaigns } = useEmailCampaigns();
  const { data: sends, isLoading: loadingSends } = useEmailSends();
  const { data: segments, isLoading: loadingSegments } = useEmailSegments();

  const isLoading = loadingTemplates || loadingCampaigns || loadingSends || loadingSegments;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Newsletter</h1>
          <p className="text-sm text-muted-foreground">
            Canal editorial da TBO pra toda a base: clientes, leads, inscritos.
          </p>
        </div>
        <Button asChild>
          <Link href="/marketing/newsletter/campanhas">
            <IconPlus className="mr-1 h-4 w-4" /> Nova Campanha
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <KPICard label="Templates" value={String(templates?.length ?? 0)} isLoading={isLoading} />
        <KPICard label="Segmentos" value={String(segments?.length ?? 0)} isLoading={isLoading} />
        <KPICard label="Campanhas" value={String(campaigns?.length ?? 0)} isLoading={isLoading} />
        <KPICard
          label="Enviadas"
          value={String(campaigns?.filter((c) => c.status === "sent").length ?? 0)}
          isLoading={isLoading}
        />
        <KPICard label="Envios" value={String(sends?.length ?? 0)} isLoading={isLoading} />
      </div>

      {/* Featured: Gerar Newsletter com IA — card destacado no topo */}
      <Link href={FEATURED_ACTION.href} className="group block">
        <Card
          className="h-full overflow-hidden transition-all group-hover:shadow-lg"
          style={{
            borderColor: `${FEATURED_ACTION.accent}33`,
            background: `linear-gradient(135deg, ${FEATURED_ACTION.accent}0d 0%, ${FEATURED_ACTION.accent}03 100%)`,
          }}
        >
          <CardContent className="p-6 flex items-center gap-5">
            <div
              className="rounded-xl p-4 shrink-0"
              style={{ background: `${FEATURED_ACTION.accent}1a` }}
            >
              <FEATURED_ACTION.icon
                className="size-8"
                style={{ color: FEATURED_ACTION.accent }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold tracking-tight">
                  {FEATURED_ACTION.label}
                </p>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase"
                  style={{
                    color: FEATURED_ACTION.accent,
                    background: `${FEATURED_ACTION.accent}15`,
                  }}
                >
                  Novo
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {FEATURED_ACTION.description}
              </p>
            </div>
            <IconArrowRight
              className="size-5 shrink-0 transition-transform group-hover:translate-x-1"
              style={{ color: FEATURED_ACTION.accent }}
            />
          </CardContent>
        </Card>
      </Link>

      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href} className="group">
              <Card className="h-full transition-colors group-hover:border-blue-400/40">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`rounded-lg p-3 ${section.bgClass}`}>
                    <Icon className="size-6" style={{ color: section.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{section.label}</p>
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  </div>
                  <IconArrowRight className="size-4 text-muted-foreground group-hover:text-blue-500 transition-colors" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function EmailStudioPage() {
  return (
    <RequireRole module="marketing">
      <EmailStudioContent />
    </RequireRole>
  );
}
