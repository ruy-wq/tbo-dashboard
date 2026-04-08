"use client";

// Feature #50 — Exportar relatório de performance (CSV + PDF placeholder)

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  IconFileText,
  IconPlus,
  IconDownload,
  IconCheck,
  IconAlertCircle,
  IconBrandInstagram,
  IconArrowRight,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { RequireRole } from "@/features/auth/components/require-role";
import {
  useRsmAccounts,
  useRsmPosts,
} from "@/features/marketing/hooks/use-marketing-social";
import type { Database } from "@/lib/supabase/types";

type Account = Database["public"]["Tables"]["rsm_accounts"]["Row"];
type Post = Database["public"]["Tables"]["rsm_posts"]["Row"];

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  youtube: "YouTube",
  twitter: "X (Twitter)",
  pinterest: "Pinterest",
};

// ── CSV export helper ─────────────────────────────────────────

function escapeCsv(val: unknown): string {
  const s = String(val ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function buildPerformanceCsv(accounts: Account[], posts: Post[]): string {
  const header = [
    "Plataforma",
    "Handle",
    "Seguidores",
    "Posts Publicados",
    "Posts Agendados",
    "Total Posts",
    "Engajamento Total",
  ].join(",");

  const platformMap = new Map<string, { account: Account; pub: number; sched: number; eng: number }>();
  for (const acc of accounts) {
    platformMap.set(acc.id, { account: acc, pub: 0, sched: 0, eng: 0 });
  }

  for (const post of posts) {
    const entry = platformMap.get(post.account_id);
    if (!entry) continue;
    if (post.status === "publicado") {
      entry.pub += 1;
      const m = post.metrics as Record<string, number> | null;
      if (m) {
        entry.eng += (m.likes ?? 0) + (m.comments ?? 0) + (m.shares ?? 0) + (m.saves ?? 0);
      }
    } else if (post.status === "agendado") {
      entry.sched += 1;
    }
  }

  const rows = Array.from(platformMap.values()).map(({ account, pub, sched, eng }) => {
    const platform = PLATFORM_LABELS[String(account.platform)] ?? String(account.platform);
    return [
      escapeCsv(platform),
      escapeCsv(`@${account.handle}`),
      escapeCsv(account.followers_count ?? 0),
      escapeCsv(pub),
      escapeCsv(sched),
      escapeCsv(pub + sched),
      escapeCsv(eng),
    ].join(",");
  });

  return [header, ...rows].join("\n");
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// ── Report templates ──────────────────────────────────────────

interface ReportTemplate {
  id: string;
  title: string;
  description: string;
  color: string;
  type: "csv" | "pdf_placeholder";
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: "performance_geral",
    title: "Performance Geral",
    description: "Seguidores, posts e engajamento por conta",
    color: "#3b82f6",
    type: "csv",
  },
  {
    id: "posts_agendados",
    title: "Posts Agendados",
    description: "Todos os posts com status e datas",
    color: "#8b5cf6",
    type: "csv",
  },
  {
    id: "relatorio_mensal",
    title: "Relatório Mensal PDF",
    description: "Consolidado do mês em PDF (em breve)",
    color: "#f59e0b",
    type: "pdf_placeholder",
  },
  {
    id: "comparativo_plataformas",
    title: "Comparativo de Plataformas",
    description: "Métricas lado a lado por plataforma",
    color: "#22c55e",
    type: "csv",
  },
];

function buildPostsCsv(accounts: Account[], posts: Post[]): string {
  const accountMap = new Map(accounts.map((a) => [a.id, a]));
  const header = [
    "Título",
    "Conteúdo",
    "Plataforma",
    "Handle",
    "Tipo",
    "Status",
    "Data Agendada",
    "Data Publicação",
  ].join(",");
  const rows = posts.map((post) => {
    const acc = accountMap.get(post.account_id);
    const platform = PLATFORM_LABELS[String(acc?.platform ?? "")] ?? String(acc?.platform ?? "");
    return [
      escapeCsv(post.title ?? ""),
      escapeCsv((post.content ?? "").slice(0, 100)),
      escapeCsv(platform),
      escapeCsv(acc ? `@${acc.handle}` : ""),
      escapeCsv(post.type ?? ""),
      escapeCsv(post.status ?? ""),
      escapeCsv(post.scheduled_date ? new Date(post.scheduled_date).toLocaleDateString("pt-BR") : ""),
      escapeCsv(post.published_date ? new Date(post.published_date).toLocaleDateString("pt-BR") : ""),
    ].join(",");
  });
  return [header, ...rows].join("\n");
}

// ── Main ───────────────────────────────────────────────────────

function RelatoriosContent() {
  const [exporting, setExporting] = useState<string | null>(null);

  const { data: accounts, isLoading: la } = useRsmAccounts();
  const { data: posts, isLoading: lp } = useRsmPosts();
  const isLoading = la || lp;

  const stats = useMemo(() => {
    const totalAccounts = (accounts ?? []).length;
    const totalFollowers = (accounts ?? []).reduce((s, a) => s + (a.followers_count ?? 0), 0);
    const totalPosts = (posts ?? []).length;
    const publishedPosts = (posts ?? []).filter((p) => p.status === "publicado").length;
    return { totalAccounts, totalFollowers, totalPosts, publishedPosts };
  }, [accounts, posts]);

  function handleExport(template: ReportTemplate) {
    if (template.type === "pdf_placeholder") {
      toast.info("Exportação em PDF estará disponível em breve.");
      return;
    }

    setExporting(template.id);

    try {
      const dateStr = new Date().toISOString().slice(0, 10);
      let csv = "";
      let filename = "";

      if (template.id === "posts_agendados") {
        csv = buildPostsCsv(accounts ?? [], posts ?? []);
        filename = `posts-agendados-${dateStr}.csv`;
      } else {
        // performance_geral + comparativo_plataformas — both use performance CSV
        csv = buildPerformanceCsv(accounts ?? [], posts ?? []);
        filename = `performance-redes-sociais-${dateStr}.csv`;
      }

      downloadCsv(csv, filename);
      toast.success(`"${template.title}" exportado com sucesso.`);
    } catch {
      toast.error("Erro ao exportar relatório.");
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios de Redes Sociais</h1>
          <p className="text-sm text-muted-foreground">
            Exporte dados de performance e posts em CSV.
          </p>
        </div>
        <Button variant="outline" disabled>
          <IconPlus className="mr-1 h-4 w-4" /> Relatório customizado
        </Button>
      </div>

      {/* Quick stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Contas conectadas", value: stats.totalAccounts },
            { label: "Seguidores totais", value: stats.totalFollowers.toLocaleString("pt-BR") },
            { label: "Total de posts", value: stats.totalPosts },
            { label: "Posts publicados", value: stats.publishedPosts },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border bg-card px-4 py-3">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-xl font-bold mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Client Reports */}
      <div>
        <p className="text-sm font-medium mb-3 text-muted-foreground">Relatorios de clientes</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/marketing/redes-sociais/relatorios/thal" className="group">
            <Card className="h-full transition-all group-hover:shadow-md group-hover:border-pink-400/40">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 p-3 shrink-0">
                  <IconBrandInstagram className="size-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">Thal Engenharia</p>
                  <p className="text-xs text-muted-foreground">Instagram · Abril 2026</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="secondary" className="text-[9px] px-1 py-0">5.172 seg.</Badge>
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-emerald-500/10 text-emerald-600">+867% interacoes</Badge>
                  </div>
                </div>
                <IconArrowRight className="size-4 text-muted-foreground group-hover:text-pink-500 transition-colors shrink-0" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Report templates */}
      <div>
        <p className="text-sm font-medium mb-3 text-muted-foreground">Exportar relatório</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {REPORT_TEMPLATES.map((template) => (
            <Card
              key={template.id}
              className="group cursor-pointer transition-all hover:shadow-sm"
              style={{ borderColor: exporting === template.id ? template.color : undefined }}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div
                    className="rounded-lg p-2.5 shrink-0"
                    style={{ backgroundColor: `${template.color}18` }}
                  >
                    {template.type === "pdf_placeholder" ? (
                      <IconFileText className="size-5" style={{ color: template.color }} />
                    ) : (
                      <IconDownload className="size-5" style={{ color: template.color }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-semibold text-sm">{template.title}</p>
                      {template.type === "pdf_placeholder" && (
                        <Badge variant="secondary" className="text-[9px] px-1 py-0">
                          Em breve
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{template.description}</p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4 w-full text-xs"
                  disabled={isLoading || exporting === template.id}
                  onClick={() => handleExport(template)}
                  style={
                    template.type !== "pdf_placeholder"
                      ? { borderColor: template.color, color: template.color }
                      : undefined
                  }
                >
                  {exporting === template.id ? (
                    <span className="flex items-center gap-1">
                      <IconCheck className="size-3" /> Exportando...
                    </span>
                  ) : template.type === "pdf_placeholder" ? (
                    <span className="flex items-center gap-1">
                      <IconAlertCircle className="size-3" /> Em breve
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <IconDownload className="size-3" /> Exportar CSV
                    </span>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function RelatoriosRedesSociaisPage() {
  return (
    <RequireRole module="marketing">
      <RelatoriosContent />
    </RequireRole>
  );
}
