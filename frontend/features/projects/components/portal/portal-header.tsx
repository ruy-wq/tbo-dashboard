"use client";

import {
  IconBell,
  IconFile,
  IconNotes,
  IconInfoCircle,
  IconReceipt,
} from "@tabler/icons-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PortalHeaderProps {
  projectName: string;
  clientName: string | null;
  clientCompany: string | null;
  logoUrl?: string | null;
  accentColor?: string;
  pendingApprovals?: number;
  onNavChange?: (nav: string) => void;
  activeNav?: string;
}

const NAV_ITEMS = [
  { key: "home", label: "Home" },
  { key: "invoices", label: "Faturas" },
  { key: "meetings", label: "Reunioes" },
  { key: "about", label: "Sobre" },
];

export function PortalHeader({
  projectName,
  clientName,
  clientCompany,
  logoUrl,
  accentColor = "#c45a1a",
  pendingApprovals = 0,
  onNavChange,
  activeNav = "home",
}: PortalHeaderProps) {
  const initials = clientName
    ? clientName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "CL";

  return (
    <header
      className="sticky top-0 z-40"
      style={{
        backgroundColor: "#1a1a1a",
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      }}
    >
      <div className="flex h-14 items-center justify-between px-6">
        {/* Left: TBO Logo + Project */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: "#c45a1a" }}
            >
              TBO
            </span>
            <span className="text-[10px] text-zinc-500">|</span>
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
              Portal
            </span>
          </div>
          <span className="text-sm font-medium text-white">
            {clientCompany ?? projectName}
          </span>
        </div>

        {/* Center: Nav */}
        <nav className="hidden items-center gap-0 md:flex">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => onNavChange?.(item.key)}
              className={cn(
                "px-5 py-4 text-xs font-medium uppercase tracking-wider transition-colors",
                activeNav === item.key
                  ? "text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
              style={
                activeNav === item.key
                  ? { borderBottom: `2px solid #c45a1a` }
                  : { borderBottom: "2px solid transparent" }
              }
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right: Notifications + Avatar */}
        <div className="flex items-center gap-3">
          <button className="relative p-2 text-zinc-500 transition-colors hover:text-zinc-300">
            <IconBell className="h-4 w-4" />
            {pendingApprovals > 0 && (
              <span
                className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center text-[9px] font-bold text-white"
                style={{ backgroundColor: "#c45a1a", borderRadius: 0 }}
              >
                {pendingApprovals}
              </span>
            )}
          </button>
          <div
            className="flex h-7 w-7 items-center justify-center text-[10px] font-medium text-zinc-400"
            style={{ border: "1px solid #333" }}
          >
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
