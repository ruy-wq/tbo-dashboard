"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth-store";
import { hasMinRole } from "@/lib/permissions";
import {
  IconBriefcase,
  IconListCheck,
  IconMessage,
  IconUsers,
  IconHeartHandshake,
  IconCurrencyDollar,
  IconBuildingStore,
  IconFileText,
  IconTruck,
  IconSpeakerphone,
  IconChartBar,
  IconTarget,
  IconSettings,
  IconShield,
  IconHistory,
  IconWorld,
  IconArrowRight,
  IconClock,
  IconCalendar,
  IconCake,
} from "@tabler/icons-react";
import {
  useHubBirthdays,
  useUpcomingBirthdays,
} from "@/features/hub/hooks/use-hub-birthdays";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

/* ─── Types ───────────────────────────────────────────────────────── */

interface LauncherItem {
  href: string;
  label: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  module?: string;
}

interface LauncherGroup {
  title: string;
  items: LauncherItem[];
}

/* ─── Time/Date helpers ───────────────────────────────────────────── */

function useFormattedDateTime() {
  return useMemo(() => {
    const now = new Date();
    const time = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const date = now.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    return { time, date: date.charAt(0).toUpperCase() + date.slice(1) };
  }, []);
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  return "Boa noite";
}

/* ─── Launcher Groups ─────────────────────────────────────────────── */

const QUICK_ACCESS: LauncherItem[] = [
  {
    href: "/projetos",
    label: "Projetos",
    description: "Gestao de projetos e entregas",
    icon: IconBriefcase,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
  },
  {
    href: "/tarefas",
    label: "Tarefas",
    description: "Minhas tarefas e board",
    icon: IconListCheck,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
  },
  {
    href: "/chat",
    label: "Chat",
    description: "Mensagens e canais",
    icon: IconMessage,
    iconColor: "text-pink-600",
    iconBg: "bg-pink-50",
  },
  {
    href: "/pessoas",
    label: "Pessoas",
    description: "Time, 1:1s e carreira",
    icon: IconUsers,
    iconColor: "text-violet-600",
    iconBg: "bg-violet-50",
    module: "pessoas",
  },
];

const HUBS: LauncherGroup[] = [
  {
    title: "Receita & Caixa",
    items: [
      {
        href: "/comercial",
        label: "Pipeline",
        description: "CRM e oportunidades",
        icon: IconBuildingStore,
        iconColor: "text-orange-600",
        iconBg: "bg-orange-50",
        module: "comercial",
      },
      {
        href: "/contratos",
        label: "Contratos",
        description: "Ativos, renovacoes e modelos",
        icon: IconFileText,
        iconColor: "text-slate-600",
        iconBg: "bg-slate-50",
        module: "contratos",
      },
      {
        href: "/financeiro",
        label: "Financeiro",
        description: "DRE, fluxo de caixa, fiscal",
        icon: IconCurrencyDollar,
        iconColor: "text-green-600",
        iconBg: "bg-green-50",
        module: "financeiro",
      },
      {
        href: "/compras",
        label: "Compras",
        description: "Fornecedores e orcamentos",
        icon: IconTruck,
        iconColor: "text-amber-600",
        iconBg: "bg-amber-50",
        module: "compras",
      },
    ],
  },
  {
    title: "TBO Culture",
    items: [
      {
        href: "/cultura",
        label: "Culture Hub",
        description: "Valores, rituais e reconhecimentos",
        icon: IconHeartHandshake,
        iconColor: "text-red-500",
        iconBg: "bg-red-50",
        module: "cultura",
      },
      {
        href: "/cultura/okrs",
        label: "OKRs",
        description: "Objetivos e resultados-chave",
        icon: IconTarget,
        iconColor: "text-emerald-600",
        iconBg: "bg-emerald-50",
        module: "okrs",
      },
    ],
  },
  {
    title: "Estrategia",
    items: [
      {
        href: "/marketing",
        label: "Marketing",
        description: "Campanhas e conteudo",
        icon: IconSpeakerphone,
        iconColor: "text-indigo-600",
        iconBg: "bg-indigo-50",
        module: "marketing",
      },
      {
        href: "/relatorios",
        label: "Relatorios",
        description: "Dados e analytics",
        icon: IconChartBar,
        iconColor: "text-cyan-600",
        iconBg: "bg-cyan-50",
        module: "relatorios",
      },
    ],
  },
];

const SYSTEM_ITEMS: LauncherItem[] = [
  {
    href: "/configuracoes",
    label: "Configuracoes",
    description: "Preferencias e integrações",
    icon: IconSettings,
    iconColor: "text-gray-500",
    iconBg: "bg-gray-50",
    module: "configuracoes",
  },
  {
    href: "/audit-log",
    label: "Audit Log",
    description: "Historico de alteracoes",
    icon: IconShield,
    iconColor: "text-gray-500",
    iconBg: "bg-gray-50",
    module: "audit-log",
  },
  {
    href: "/website-admin",
    label: "Website",
    description: "CMS e conteudo publico",
    icon: IconWorld,
    iconColor: "text-gray-500",
    iconBg: "bg-gray-50",
    module: "website-admin",
  },
  {
    href: "/changelog",
    label: "Changelog",
    description: "Novidades do TBO OS",
    icon: IconHistory,
    iconColor: "text-gray-500",
    iconBg: "bg-gray-50",
    module: "changelog",
  },
];

/* ─── Card Component ──────────────────────────────────────────────── */

function LauncherCard({ item }: { item: LauncherItem }) {
  const Icon = item.icon;
  return (
    <Link href={item.href} className="group">
      <div className="relative flex flex-col items-center gap-3 rounded-2xl border border-border/40 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-border hover:-translate-y-0.5">
        <div className={`rounded-xl p-3 ${item.iconBg} transition-colors`}>
          <Icon className={`size-7 ${item.iconColor}`} strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">{item.label}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{item.description}</p>
        </div>
        <IconArrowRight className="absolute top-3 right-3 size-3.5 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  );
}

/* ─── Birthday Banner ────────────────────────────────────────────── */

function BirthdayBanner() {
  const { data: todayBirthdays = [] } = useHubBirthdays();
  const { data: upcoming = [] } = useUpcomingBirthdays(30);

  if (todayBirthdays.length === 0 && upcoming.length === 0) return null;

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  return (
    <div className="rounded-2xl border border-border/40 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20 p-4 mb-8">
      <div className="flex items-center gap-2 mb-3">
        <IconCake className="size-4 text-orange-600 dark:text-orange-400" />
        <span className="text-xs font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400">
          {todayBirthdays.length > 0 ? "Aniversariante do dia" : "Proximos aniversarios"}
        </span>
      </div>

      <div className="flex flex-wrap gap-4">
        {todayBirthdays.map((p) => (
          <div key={p.id} className="flex items-center gap-3 rounded-xl bg-white/60 dark:bg-white/10 px-4 py-2.5 ring-1 ring-orange-200 dark:ring-orange-800">
            <Avatar className="size-9 ring-2 ring-orange-300 dark:ring-orange-600">
              {p.avatarUrl && <AvatarImage src={p.avatarUrl} />}
              <AvatarFallback className="text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                {getInitials(p.fullName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-foreground">{p.fullName}</p>
              <p className="text-[11px] text-muted-foreground">
                {p.role ? `${p.role} · ` : ""}Hoje!
              </p>
            </div>
          </div>
        ))}

        {todayBirthdays.length === 0 &&
          upcoming.slice(0, 4).map((p) => {
            const [, mm, dd] = p.birthDate.split("-");
            return (
              <div key={p.id} className="flex items-center gap-3 rounded-xl bg-white/60 dark:bg-white/10 px-4 py-2.5">
                <Avatar className="size-8">
                  {p.avatarUrl && <AvatarImage src={p.avatarUrl} />}
                  <AvatarFallback className="text-[10px] font-semibold bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400">
                    {getInitials(p.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-foreground">{p.fullName}</p>
                  <p className="text-[11px] text-muted-foreground">{dd}/{mm}</p>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────────────── */

export function LauncherDashboard() {
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const roleLabel = useAuthStore((s) => s.roleLabel);
  const modules = useAuthStore((s) => s.modules);
  const isAdmin = hasMinRole(role, "admin");

  const { time, date } = useFormattedDateTime();
  const greeting = getGreeting();

  const firstName = useMemo(() => {
    if (!user) return "";
    const fullName = user.user_metadata?.full_name as string | undefined;
    if (fullName) return fullName.split(" ")[0];
    return user.email?.split("@")[0] ?? "";
  }, [user]);

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  // Filter items by RBAC
  const canSee = (mod?: string) => !mod || modules.includes(mod);

  const filteredHubs = HUBS.map((group) => ({
    ...group,
    items: group.items.filter((item) => canSee(item.module)),
  })).filter((group) => group.items.length > 0);

  const filteredSystem = SYSTEM_ITEMS.filter((item) => canSee(item.module));

  return (
    <div className="min-h-[calc(100vh-5rem)] flex flex-col">
      {/* ── Header bar ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            {greeting}, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            O que voce quer acessar hoje?
          </p>
        </div>

        <div className="flex items-center gap-6">
          {/* Time */}
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            <IconClock className="size-4" />
            <div>
              <p className="font-semibold text-foreground tabular-nums">{time}</p>
              <p className="text-[11px]">{date}</p>
            </div>
          </div>

          {/* User */}
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={firstName}
                className="size-9 rounded-full object-cover ring-2 ring-border/40"
              />
            ) : (
              <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                {firstName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-foreground">{firstName}</p>
              <p className="text-[11px] text-muted-foreground capitalize">{roleLabel ?? role ?? "Membro"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Birthday banner ──────────────────────────────────────── */}
      <BirthdayBanner />

      {/* ── Hub groups ──────────────────────────────────────────── */}
      {filteredHubs.map((group) => (
        <section key={group.title} className="mb-8">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
            {group.title}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
            {group.items.map((item) => (
              <LauncherCard key={item.href} item={item} />
            ))}
          </div>
        </section>
      ))}

      {/* ── Sistema (admin only) ────────────────────────────────── */}
      {isAdmin && filteredSystem.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
            Sistema
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
            {filteredSystem.map((item) => (
              <LauncherCard key={item.href} item={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
