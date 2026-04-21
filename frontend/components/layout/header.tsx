"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { CommandSearch } from "@/components/layout/command-search";
import {
  ThemeToggle,
  NotificationBell,
  SearchButton,
  UserAvatar,
} from "@/components/layout/header-parts";
import { cn } from "@/lib/utils";
import {
  IconLayoutDashboard,
  IconBriefcase,
  IconListCheck,
  IconMessage,
  IconCurrencyDollar,
  IconFileText,
  IconUsers,
  IconHeartHandshake,
  IconSpeakerphone,
  IconChartBar,
  IconCalendar,
} from "@tabler/icons-react";

/* ─── Top nav items ───────────────────────────────────────────────── */

const NAV_ITEMS = [
  { href: "/dashboard", icon: IconLayoutDashboard, label: "TBO HUB" },
  { href: "/projetos", icon: IconBriefcase, label: "Projetos" },
  { href: "/tarefas", icon: IconListCheck, label: "Tarefas" },
  { href: "/chat", icon: IconMessage, label: "Chat" },
  { href: "/agenda", icon: IconCalendar, label: "Agenda" },
  { href: "/comercial", icon: IconCurrencyDollar, label: "Comercial" },
  { href: "/contratos", icon: IconFileText, label: "Contratos" },
  { href: "/financeiro", icon: IconChartBar, label: "Financeiro" },
  { href: "/pessoas", icon: IconUsers, label: "Pessoas" },
  { href: "/cultura", icon: IconHeartHandshake, label: "Cultura" },
  { href: "/marketing", icon: IconSpeakerphone, label: "Marketing" },
  { href: "/relatorios", icon: IconChartBar, label: "Relatórios" },
] as const;

function TopNav() {
  const pathname = usePathname();
  return (
    <nav className="hidden md:flex items-center gap-0.5 overflow-x-auto scrollbar-none">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
            )}
          >
            <Icon className="size-4 shrink-0" strokeWidth={1.5} />
            <span className="hidden lg:inline">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Header() {
  return (
    <>
      <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center gap-3 border-b border-border/40 bg-background/90 px-4 backdrop-blur-sm">
        {/* Logo */}
        <Link href="/servicos" className="flex items-center gap-2 shrink-0">
          <div className="relative flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary via-primary/90 to-primary/70 shadow-sm shadow-primary/20">
            <span className="text-xs font-black tracking-tight text-primary-foreground">T</span>
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/20 to-transparent" />
          </div>
          <span className="text-sm font-semibold hidden sm:inline">
            <span className="font-bold">TBO</span>
            <span className="font-light text-muted-foreground ml-1">OS</span>
          </span>
        </Link>

        <Separator orientation="vertical" className="!h-5" />

        {/* Top navigation */}
        <TopNav />

        {/* Breadcrumbs — shown on mobile / small screens instead of nav */}
        <div className="flex md:hidden flex-1 min-w-0">
          <Breadcrumbs />
        </div>

        {/* Spacer */}
        <div className="flex-1 hidden md:block" />

        {/* Right actions */}
        <div className="flex items-center gap-4 shrink-0">
          <SearchButton />
          <ThemeToggle />
          <NotificationBell />
          <UserAvatar />
        </div>
      </header>
      <CommandSearch />
    </>
  );
}
