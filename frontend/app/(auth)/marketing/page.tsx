"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/auth-store";
import { RequireRole } from "@/features/auth/components/require-role";
import { useMarketingCampaigns } from "@/features/marketing/hooks/use-marketing-campaigns";
import { useContentItems } from "@/features/marketing/hooks/use-marketing-content";
import { MarketingApprovalsBadge } from "@/features/marketing/components/marketing-approvals-badge";
import {
  IconArrowRight,
  IconBrandInstagram,
  IconCalendarEvent,
  IconChartBar,
  IconMail,
  IconPencil,
  IconPhoto,
  IconPlus,
  IconReportAnalytics,
  IconSearch,
  IconSpeakerphone,
  IconTargetArrow,
  IconTemplate,
} from "@tabler/icons-react";

/* ─── TBO Design Tokens ───────────────────────────────────────────── */

const T = {
  text: "#0f0f0f",
  muted: "#4a4a4a",
  orange: "#c45a1a",
  orangeGlow: "rgba(196,90,26,0.10)",
  borderSolid: "#e0dcd7",
  glass: "rgba(255,255,255,0.65)",
  glassBorder: "rgba(255,255,255,0.45)",
  glassShadow: "0 8px 32px rgba(15,15,15,0.06), 0 1px 3px rgba(15,15,15,0.04)",
  glassBlur: "blur(16px) saturate(180%)",
  r: "16px",
  rSm: "10px",
};

/* ─── Section Card ────────────────────────────────────────────────── */

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`p-5 ${className}`}
      style={{
        background: T.glass,
        backdropFilter: T.glassBlur,
        WebkitBackdropFilter: T.glassBlur,
        border: `1px solid ${T.glassBorder}`,
        borderRadius: T.r,
        boxShadow: T.glassShadow,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Header Bar ──────────────────────────────────────────────────── */

function MarketingHeaderBar({
  activeCampaigns,
  totalCampaigns,
}: {
  activeCampaigns: number;
  totalCampaigns: number;
}) {
  return (
    <div
      className="relative overflow-hidden p-4"
      style={{
        background: "linear-gradient(135deg, #1a1410 0%, #2d1810 50%, #c45a1a 100%)",
        borderRadius: T.r,
        boxShadow: "0 8px 32px rgba(196,90,26,0.15)",
      }}
    >
      <div className="absolute inset-0 opacity-[0.04]">
        <div className="absolute -top-8 -right-8 size-32 border-[2px] border-white rounded-full" />
        <div className="absolute bottom-0 left-10 size-16 border-[2px] border-white rounded-full" />
      </div>
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex gap-2">
          <Link
            href="/marketing/newsletter"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-white/80 hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.10)" }}
          >
            <IconMail className="size-3.5" style={{ color: "#3b82f6" }} />
            Newsletter
          </Link>
          <Link
            href="/marketing/conteudo"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-white/80 hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <IconPencil className="size-3.5" style={{ color: "#8b5cf6" }} />
            Conteudo
          </Link>
          <Link
            href="/marketing/campanhas"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-white/80 hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <IconSpeakerphone className="size-3.5" style={{ color: "#f59e0b" }} />
            Campanhas
          </Link>
          <Link
            href="/marketing/redes-sociais"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-white/80 hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <IconBrandInstagram className="size-3.5" style={{ color: "#ec4899" }} />
            Social
          </Link>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <span className="text-lg font-bold text-white tabular-nums">{activeCampaigns}</span>
            <span className="text-[10px] text-white/40 ml-1">ativas</span>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-white tabular-nums">{totalCampaigns}</span>
            <span className="text-[10px] text-white/40 ml-1">campanhas</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── KPIs Widget ─────────────────────────────────────────────────── */

function KPIsWidget({
  activeCampaigns,
  totalCampaigns,
  pendingContent,
  publishedContent,
  isLoading,
}: {
  activeCampaigns: number;
  totalCampaigns: number;
  pendingContent: number;
  publishedContent: number;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <SectionCard>
        <Skeleton className="h-4 w-16 mb-3" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-full mb-2" />
        ))}
      </SectionCard>
    );
  }

  const items = [
    { label: "Campanhas ativas", value: activeCampaigns, color: "#f59e0b" },
    { label: "Total campanhas", value: totalCampaigns, color: T.muted },
    { label: "Pendentes", value: pendingContent, color: "#8b5cf6" },
    { label: "Publicados", value: publishedContent, color: "#22c55e" },
  ];

  return (
    <SectionCard>
      <h3 className="text-sm font-semibold mb-3" style={{ color: T.text }}>Resumo</h3>
      <div className="space-y-2.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="text-[11px]" style={{ color: T.muted }}>{item.label}</span>
            <span className="text-sm font-semibold tabular-nums" style={{ color: T.text }}>{item.value}</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

/* ─── Quick Links Widget ──────────────────────────────────────────── */

function QuickLinksWidget() {
  const links = [
    { href: "/marketing/newsletter/templates", label: "Templates de Email", icon: IconTemplate, color: "#3b82f6" },
    { href: "/marketing/conteudo/calendario", label: "Calendario Editorial", icon: IconCalendarEvent, color: "#8b5cf6" },
    { href: "/marketing/conteudo/assets", label: "Biblioteca de Assets", icon: IconPhoto, color: "#ec4899" },
    { href: "/marketing/analytics", label: "Analytics", icon: IconChartBar, color: "#22c55e" },
  ];

  return (
    <SectionCard>
      <h3 className="text-sm font-semibold mb-3" style={{ color: T.text }}>Acesso Rápido</h3>
      <div className="space-y-1.5">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors hover:bg-black/[0.03]"
            >
              <Icon className="size-3.5 shrink-0" style={{ color: link.color }} />
              <span className="text-xs font-medium flex-1" style={{ color: T.text }}>{link.label}</span>
              <IconArrowRight className="size-3 shrink-0" style={{ color: T.muted }} />
            </Link>
          );
        })}
      </div>
    </SectionCard>
  );
}

/* ─── Search Bar ──────────────────────────────────────────────────── */

function MarketingSearch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div
      className="flex items-center gap-2 px-4 py-3"
      style={{
        background: T.glass,
        backdropFilter: T.glassBlur,
        WebkitBackdropFilter: T.glassBlur,
        border: `1px solid ${T.glassBorder}`,
        borderRadius: T.r,
        boxShadow: T.glassShadow,
      }}
    >
      <IconSearch className="size-4 shrink-0" style={{ color: T.muted }} />
      <input
        type="text"
        placeholder="Buscar em marketing..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#9a9a9a]"
        style={{ color: T.text }}
      />
    </div>
  );
}

/* ─── Module Card ─────────────────────────────────────────────────── */

type ModuleDef = {
  href: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  minRole?: "admin" | "lider";
};

const MODULES: ModuleDef[] = [
  { href: "/marketing/newsletter", label: "Newsletter", description: "Gerar newsletters, campanhas e envios pra base", icon: IconMail, color: "#3b82f6" },
  { href: "/marketing/conteudo", label: "Conteudo", description: "Calendario editorial, briefs e assets", icon: IconPencil, color: "#8b5cf6" },
  { href: "/marketing/redes-sociais", label: "Redes Sociais", description: "Contas, agendamento e performance", icon: IconBrandInstagram, color: "#ec4899" },
  { href: "/marketing/campanhas", label: "Campanhas", description: "Timeline, briefings e budget", icon: IconSpeakerphone, color: "#f59e0b" },
  { href: "/marketing/analytics", label: "Analytics", description: "Dashboard consolidado e atribuicao", icon: IconChartBar, color: "#22c55e", minRole: "admin" },
  { href: "/marketing/rsm", label: "RSM", description: "Relatório Semanal de Mídias", icon: IconReportAnalytics, color: "#6366f1" },
];

function ModuleCard({ mod }: { mod: ModuleDef }) {
  const Icon = mod.icon;
  return (
    <Link href={mod.href} className="block transition-all hover:scale-[1.005]">
      <div
        className="p-4 flex items-center gap-3"
        style={{
          background: T.glass,
          backdropFilter: T.glassBlur,
          WebkitBackdropFilter: T.glassBlur,
          border: `1px solid ${T.glassBorder}`,
          borderRadius: T.rSm,
          boxShadow: T.glassShadow,
        }}
      >
        <div className="rounded-lg p-2.5 shrink-0" style={{ background: `${mod.color}15` }}>
          <Icon className="size-5" style={{ color: mod.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: T.text }}>{mod.label}</p>
          <p className="text-[11px] truncate" style={{ color: T.muted }}>{mod.description}</p>
        </div>
        <IconArrowRight className="size-4 shrink-0" style={{ color: T.muted }} />
      </div>
    </Link>
  );
}

/* ─── Loading Skeleton ────────────────────────────────────────────── */

function HubSkeleton() {
  return (
    <div className="-mx-4 md:-mx-8 lg:-mx-12 -my-6">
      <div className="flex gap-0 min-h-[calc(100dvh-64px)]">
        <aside className="hidden lg:flex flex-col w-[260px] shrink-0 p-4 gap-4" style={{ background: "rgba(240,237,233,0.5)", backdropFilter: "blur(8px)", borderRight: `1px solid ${T.glassBorder}` }}>
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </aside>
        <main className="flex-1 min-w-0 p-5 space-y-4">
          <Skeleton className="h-14 rounded-2xl" />
          <Skeleton className="h-12 rounded-2xl" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </main>
        <aside className="hidden xl:flex flex-col w-[300px] shrink-0 p-4 gap-4" style={{ background: "rgba(240,237,233,0.5)", backdropFilter: "blur(8px)", borderLeft: `1px solid ${T.glassBorder}` }}>
          <Skeleton className="h-40 rounded-2xl" />
        </aside>
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────── */

function MarketingPageContent() {
  const user = useAuthStore((s) => s.user);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: campaigns, isLoading: loadingCampaigns } = useMarketingCampaigns();
  const { data: content, isLoading: loadingContent } = useContentItems();

  const activeCampaigns = campaigns?.filter((c) => c.status === "ativa").length ?? 0;
  const totalCampaigns = campaigns?.length ?? 0;
  const pendingContent = content?.filter((c) => c.status === "revisao" || c.status === "briefing").length ?? 0;
  const publishedContent = content?.filter((c) => c.status === "publicado").length ?? 0;

  const isLoading = loadingCampaigns || loadingContent;

  const filteredModules = useMemo(() => {
    if (!searchQuery) return MODULES;
    const q = searchQuery.toLowerCase();
    return MODULES.filter(
      (m) => m.label.toLowerCase().includes(q) || m.description.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  if (!user) return <HubSkeleton />;

  return (
    <div className="-mx-4 md:-mx-8 lg:-mx-12 -my-6">
      <div className="flex gap-0 min-h-[calc(100dvh-64px)]">
        {/* Left Sidebar */}
        <aside
          className="hidden lg:flex flex-col w-[260px] shrink-0 p-4 gap-4"
          style={{ background: "rgba(240,237,233,0.5)", backdropFilter: "blur(8px)", borderRight: `1px solid ${T.glassBorder}` }}
        >
          <KPIsWidget
            activeCampaigns={activeCampaigns}
            totalCampaigns={totalCampaigns}
            pendingContent={pendingContent}
            publishedContent={publishedContent}
            isLoading={isLoading}
          />
          <MarketingApprovalsBadge />
        </aside>

        {/* Center */}
        <main className="flex-1 min-w-0 p-5 space-y-4">
          <MarketingHeaderBar
            activeCampaigns={activeCampaigns}
            totalCampaigns={totalCampaigns}
          />

          <MarketingSearch value={searchQuery} onChange={setSearchQuery} />

          {/* Modules */}
          <div>
            <h2 className="text-sm font-semibold mb-3" style={{ color: T.text }}>Módulos</h2>
            <div className="space-y-2">
              {filteredModules.map((mod) => {
                const card = <ModuleCard key={mod.href} mod={mod} />;
                if (mod.minRole) {
                  return (
                    <RequireRole key={mod.href} minRole={mod.minRole}>
                      {card}
                    </RequireRole>
                  );
                }
                return card;
              })}
            </div>
          </div>
        </main>

        {/* Right Sidebar */}
        <aside
          className="hidden xl:flex flex-col w-[300px] shrink-0 p-4 gap-4"
          style={{ background: "rgba(240,237,233,0.5)", backdropFilter: "blur(8px)", borderLeft: `1px solid ${T.glassBorder}` }}
        >
          <QuickLinksWidget />
        </aside>
      </div>
    </div>
  );
}

export default function MarketingPage() {
  return (
    <RequireRole module="marketing">
      <MarketingPageContent />
    </RequireRole>
  );
}
