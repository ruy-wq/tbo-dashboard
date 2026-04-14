"use client";

import { use, useState } from "react";
import { useShowcaseByToken } from "@/features/portfolio/hooks/use-showcase";
import { VideoPlayer } from "@/features/portfolio/components/video-player";
import { getVideoEmbed } from "@/features/portfolio/lib/video-embed";
import { BU_COLORS } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import { IconPhoto, IconPlayerPlay, IconBrandVimeo, IconBrandYoutube, IconExternalLink } from "@tabler/icons-react";
import type { PortfolioItem } from "@/features/portfolio/types/portfolio";
import { cn } from "@/lib/utils";

export default function ShowcasePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const { data, isLoading, error } = useShowcaseByToken(token);
  const [activeItem, setActiveItem] = useState<PortfolioItem | null>(null);

  if (isLoading) {
    return <ShowcaseSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-white">Link indisponivel</h1>
          <p className="text-zinc-400">
            Este link de apresentacao expirou ou nao existe.
          </p>
        </div>
      </div>
    );
  }

  const { showcase, items } = data;
  const accent = showcase.accent_color || "#E85102";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="size-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: accent }}
            >
              T
            </div>
            <span className="text-sm font-medium text-zinc-400 tracking-wider uppercase">
              TBO Creative Studio
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {showcase.title}
          </h1>
          {showcase.description && (
            <p className="mt-3 text-lg text-zinc-400 max-w-2xl leading-relaxed">
              {showcase.description}
            </p>
          )}
          <div className="mt-4 flex items-center gap-4 text-sm text-zinc-500">
            <span>{items.length} case{items.length !== 1 ? "s" : ""}</span>
            <span>·</span>
            <span>
              {Array.from(new Set(items.map((i) => i.bu))).join(", ")}
            </span>
          </div>
        </div>
      </header>

      {/* Active video player (full width) */}
      {activeItem?.external_url && (
        <div className="border-b border-white/10 bg-black">
          <div className="mx-auto max-w-5xl px-6 py-6">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">{activeItem.title}</h2>
                <p className="text-sm text-zinc-400">
                  {activeItem.client_company}
                  {activeItem.category ? ` · ${activeItem.category}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveItem(null)}
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Fechar player
              </button>
            </div>
            <VideoPlayer
              url={activeItem.external_url}
              thumbnailUrl={activeItem.thumbnail_url}
              title={activeItem.title}
              autoPlay
            />
            {activeItem.description && (
              <p className="mt-4 text-sm text-zinc-400 leading-relaxed max-w-3xl">
                {activeItem.description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Cases grid */}
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <ShowcaseCard
              key={item.id}
              item={item}
              accent={accent}
              isActive={activeItem?.id === item.id}
              onPlay={() => setActiveItem(item)}
            />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="mx-auto max-w-6xl px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <div
              className="size-5 rounded flex items-center justify-center text-white font-bold text-[10px]"
              style={{ backgroundColor: accent }}
            >
              T
            </div>
            <span>TBO Creative Studio</span>
          </div>
          <a
            href="https://wearetbo.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-zinc-500 hover:text-white transition-colors"
          >
            wearetbo.com.br
          </a>
        </div>
      </footer>
    </div>
  );
}

// ─── Showcase Card ────────────────────────────────────────────────────────────

function ShowcaseCard({
  item,
  accent,
  isActive,
  onPlay,
}: {
  item: PortfolioItem;
  accent: string;
  isActive: boolean;
  onPlay: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const hasVideo = !!item.external_url;
  const embed = hasVideo ? getVideoEmbed(item.external_url!) : null;
  const buColor = BU_COLORS[item.bu];
  const thumb = item.thumbnail_url || embed?.thumbnailUrl;

  return (
    <button
      type="button"
      onClick={hasVideo ? onPlay : undefined}
      className={cn(
        "group text-left rounded-xl overflow-hidden border transition-all duration-200",
        isActive
          ? "border-white/30 ring-2 ring-offset-2 ring-offset-[#0a0a0a]"
          : "border-white/10 hover:border-white/20",
        hasVideo && "cursor-pointer",
      )}
      style={isActive ? { ["--tw-ring-color" as string]: accent } : undefined}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/10] bg-zinc-900 overflow-hidden">
        {thumb && !imgError ? (
          <img
            src={thumb}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <IconPhoto className="size-10 text-zinc-700" />
          </div>
        )}

        {/* Play overlay */}
        {hasVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
            <div className="flex items-center justify-center size-14 rounded-full bg-white/90 shadow-lg transition-transform group-hover:scale-110">
              <IconPlayerPlay className="size-6 text-black ml-0.5" fill="currentColor" />
            </div>
          </div>
        )}

        {/* Category pill */}
        <div className="absolute top-3 left-3 rounded-full bg-black/60 backdrop-blur-sm px-2.5 py-1 text-[11px] font-medium text-white/90">
          {item.category}
        </div>

        {/* BU pill */}
        <div
          className="absolute bottom-3 left-3 rounded-full px-2.5 py-1 text-[11px] font-medium"
          style={buColor ? { backgroundColor: buColor.bg, color: buColor.color } : { backgroundColor: "rgba(255,255,255,0.1)", color: "white" }}
        >
          {item.bu}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-1 bg-zinc-900/50">
        <h3 className="font-semibold text-sm text-white group-hover:text-white/90">
          {item.title}
        </h3>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          {item.client_company && <span>{item.client_company}</span>}
          {item.year && (
            <>
              <span>·</span>
              <span>{item.year}</span>
            </>
          )}
        </div>
        {item.description && (
          <p className="text-xs text-zinc-500 line-clamp-2 pt-1">
            {item.description}
          </p>
        )}
      </div>
    </button>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ShowcaseSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-4">
        <Skeleton className="h-4 w-32 bg-zinc-800" />
        <Skeleton className="h-10 w-96 bg-zinc-800" />
        <Skeleton className="h-5 w-64 bg-zinc-800" />
      </div>
      <div className="mx-auto max-w-6xl px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-[16/10] w-full rounded-xl bg-zinc-800" />
            <Skeleton className="h-4 w-3/4 bg-zinc-800" />
            <Skeleton className="h-3 w-1/2 bg-zinc-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
