"use client";

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

/* eslint-disable @next/next/no-img-element */

const NAV_ITEMS = [
  { key: "home", label: "Home" },
];

export function PortalHeader({
  projectName,
  clientCompany,
  logoUrl,
  onNavChange,
  activeNav = "home",
}: PortalHeaderProps) {
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
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={clientCompany ?? projectName}
              className="h-6 object-contain"
              style={{ filter: "brightness(0) invert(1)", opacity: 0.9 }}
            />
          ) : (
            <span className="text-sm font-medium text-white">
              {clientCompany ?? projectName}
            </span>
          )}
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

        {/* Right: spacer to keep layout balanced */}
        <div className="w-20" />
      </div>
    </header>
  );
}
