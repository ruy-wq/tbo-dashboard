"use client";

import { useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { IconSun, IconMoon, IconDeviceDesktop, IconLayoutDashboard, IconAlignJustified, IconSpacingVertical } from "@tabler/icons-react";
import { useProfile, useUpdateProfile } from "@/features/configuracoes/hooks/use-settings";
import {
  parseAppearancePrefs,
  parsePreferences,
  type AppearancePrefs,
} from "@/features/configuracoes/types";

type ThemeMode = AppearancePrefs["theme"];
type UIDensity = AppearancePrefs["density"];

const THEMES = [
  { id: "light" as const, label: "Claro", icon: IconSun },
  { id: "dark" as const, label: "Escuro", icon: IconMoon },
  { id: "system" as const, label: "Sistema", icon: IconDeviceDesktop },
];

const DENSITIES = [
  { id: "compact" as const, label: "Compacto", description: "Mais itens visíveis", icon: IconAlignJustified },
  { id: "default" as const, label: "Padrão", description: "Equilibrado", icon: IconLayoutDashboard },
  { id: "comfortable" as const, label: "Confortável", description: "Mais espaço", icon: IconSpacingVertical },
];

const DENSITY_CLASS: Record<UIDensity, string> = {
  compact: "density-compact",
  default: "density-default",
  comfortable: "density-comfortable",
};

const LOCAL_CACHE_KEY = "tbo-appearance";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(mode: ThemeMode) {
  const resolved = mode === "system" ? getSystemTheme() : mode;
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

function applyDensity(density: UIDensity) {
  const root = document.documentElement;
  for (const cls of Object.values(DENSITY_CLASS)) root.classList.remove(cls);
  root.classList.add(DENSITY_CLASS[density]);
}

// Write-only cache; read happens before hydration in a separate boot script if needed.
function writeLocalCache(prefs: AppearancePrefs) {
  try {
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(prefs));
  } catch {
    // quota/denied — silent
  }
}

function AppearanceSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-56" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-3 w-32 mb-3" />
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function AppearanceSettings() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const { theme, density } = parseAppearancePrefs(profile);

  useEffect(() => {
    applyTheme(theme);
    applyDensity(density);
    writeLocalCache({ theme, density });
  }, [theme, density]);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const persist = useCallback(
    (next: Partial<AppearancePrefs>) => {
      const merged: AppearancePrefs = { theme, density, ...next };
      if (next.theme !== undefined) applyTheme(next.theme);
      if (next.density !== undefined) applyDensity(next.density);
      writeLocalCache(merged);
      const currentPrefs = parsePreferences(
        (profile as { preferences?: unknown } | undefined)?.preferences,
      );
      updateProfile.mutate(
        { preferences: { ...currentPrefs, appearance: merged } } as never,
      );
    },
    [theme, density, profile, updateProfile],
  );

  if (isLoading) return <AppearanceSkeleton />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tema</CardTitle>
          <CardDescription>
            Escolha entre tema claro, escuro ou automático do sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Label className="mb-3 block text-sm font-medium">Modo de exibição</Label>
          <div className="grid grid-cols-3 gap-3">
            {THEMES.map((t) => {
              const Icon = t.icon;
              const active = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => persist({ theme: t.id })}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tbo-orange",
                    active
                      ? "border-tbo-orange bg-tbo-orange/5 text-tbo-orange dark:bg-orange-950/20 dark:text-orange-400"
                      : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <Icon size={20} />
                  <span className="text-sm font-medium">{t.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Densidade da interface</CardTitle>
          <CardDescription>
            Controla o espaçamento e tamanho dos elementos em toda a plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {DENSITIES.map((d) => {
              const Icon = d.icon;
              const active = density === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => persist({ density: d.id })}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tbo-orange",
                    active
                      ? "border-tbo-orange bg-tbo-orange/5 text-tbo-orange dark:bg-orange-950/20 dark:text-orange-400"
                      : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <Icon size={20} />
                  <div>
                    <p className="text-sm font-medium leading-tight">{d.label}</p>
                    <p className={cn("text-xs mt-0.5", active ? "text-tbo-orange/70 dark:text-orange-400/70" : "text-muted-foreground")}>
                      {d.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
