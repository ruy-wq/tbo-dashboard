"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import {
  IconBrandInstagram,
  IconUsers,
  IconCalendarEvent,
  IconChartBar,
  IconFileText,
  IconArrowRight,
  IconBrandMeta,
  IconLayoutDashboard,
} from "@tabler/icons-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RequireRole } from "@/features/auth/components/require-role";
import { useRsmAccounts, useRsmPosts } from "@/features/marketing/hooks/use-marketing-social";
import { InstagramDashboard } from "@/features/marketing/components/instagram/instagram-dashboard";

function KPICard({ label, value, isLoading }: { label: string; value: string; isLoading?: boolean }) {
  if (isLoading) return <div className="rounded-lg border bg-card p-4 space-y-2"><Skeleton className="h-3 w-20" /><Skeleton className="h-7 w-16" /></div>;
  return <div className="rounded-lg border bg-card p-4 space-y-1"><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-bold">{value}</p></div>;
}

const SECTIONS = [
  { href: "/marketing/redes-sociais/contas", label: "Contas", description: "Gerenciar contas conectadas", icon: IconUsers, color: "#3b82f6", bgClass: "bg-blue-500/10" },
  { href: "/marketing/redes-sociais/agendamento", label: "Agendamento", description: "Agendar e publicar posts", icon: IconCalendarEvent, color: "#8b5cf6", bgClass: "bg-purple-500/10" },
  { href: "/marketing/redes-sociais/performance", label: "Performance", description: "Metricas por canal", icon: IconChartBar, color: "#22c55e", bgClass: "bg-emerald-500/10" },
  { href: "/marketing/redes-sociais/relatorios", label: "Relatorios", description: "Relatorios de redes sociais", icon: IconFileText, color: "#f59e0b", bgClass: "bg-amber-500/10" },
] as const;

function OverviewTab() {
  const { data: accounts, isLoading: la } = useRsmAccounts();
  const { data: posts, isLoading: lp } = useRsmPosts();
  const isLoading = la || lp;

  const scheduled = (posts ?? []).filter((p) => p.status === "agendado").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KPICard label="Contas conectadas" value={String(accounts?.length ?? 0)} isLoading={isLoading} />
        <KPICard label="Posts publicados" value={String((posts ?? []).filter((p) => p.status === "publicado").length)} isLoading={isLoading} />
        <KPICard label="Agendados" value={String(scheduled)} isLoading={isLoading} />
        <KPICard label="Total de posts" value={String(posts?.length ?? 0)} isLoading={isLoading} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.href} href={s.href} className="group">
              <Card className="h-full transition-colors group-hover:border-pink-400/40">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`rounded-lg p-3 ${s.bgClass}`}>
                    <Icon className="size-6" style={{ color: s.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{s.label}</p>
                    <p className="text-sm text-muted-foreground">{s.description}</p>
                  </div>
                  <IconArrowRight className="size-4 text-muted-foreground group-hover:text-pink-500 transition-colors" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function RedesSociaisContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Redes Sociais</h1>
        <p className="text-sm text-muted-foreground">
          Gestao centralizada de redes sociais com integracao Meta Instagram API.
        </p>
      </div>

      <Tabs defaultValue="instagram" className="space-y-6">
        <TabsList>
          <TabsTrigger value="instagram" className="gap-1.5">
            <IconBrandInstagram className="size-4" />
            Instagram
          </TabsTrigger>
          <TabsTrigger value="overview" className="gap-1.5">
            <IconLayoutDashboard className="size-4" />
            Visao Geral
          </TabsTrigger>
        </TabsList>

        <TabsContent value="instagram">
          <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-lg" />}>
            <InstagramDashboard />
          </Suspense>
        </TabsContent>

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function RedesSociaisPage() {
  return (
    <RequireRole module="marketing">
      <RedesSociaisContent />
    </RequireRole>
  );
}
