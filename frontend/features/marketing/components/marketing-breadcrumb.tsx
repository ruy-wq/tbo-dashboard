"use client";

// Feature #78 — Breadcrumb dinâmico no layout do marketing

import { usePathname } from "next/navigation";
import Link from "next/link";
import { IconChevronRight } from "@tabler/icons-react";

const SEGMENT_LABELS: Record<string, string> = {
  marketing: "Marketing",
  campanhas: "Campanhas",
  briefing: "Briefing",
  pecas: "Peças",
  budget: "Budget",
  timeline: "Timeline",
  "email-studio": "Newsletter",
  newsletter: "Newsletter",
  gerar: "Gerar com IA",
  templates: "Templates",
  campanhas_email: "Campanhas",
  envios: "Envios",
  analytics: "Analytics",
  funil: "Funil",
  relatorios: "Relatórios",
  conteudo: "Conteúdo",
  calendario: "Calendário",
  briefs: "Briefs",
  assets: "Assets",
  aprovacoes: "Aprovações",
  "redes-sociais": "Redes Sociais",
  contas: "Contas",
  agendamento: "Agendamento",
  performance: "Performance",
  rsm: "RSM",
  attribution: "Atribuição",
  relatorios_social: "Relatórios",
};

function getLabel(segment: string): string {
  return SEGMENT_LABELS[segment] ?? segment.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export function MarketingBreadcrumb() {
  const pathname = usePathname();

  // Build segments from pathname
  const parts = pathname.split("/").filter(Boolean);
  const marketingIdx = parts.indexOf("marketing");
  if (marketingIdx === -1) return null;

  const segments = parts.slice(marketingIdx);

  // Build crumbs with href
  const crumbs = segments.map((seg, i) => ({
    label: getLabel(seg),
    href: "/" + parts.slice(0, marketingIdx + i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));

  if (crumbs.length <= 1) return null; // Don't show when at /marketing root

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1">
          {i > 0 && <IconChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />}
          {crumb.isLast ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className="hover:text-foreground transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
