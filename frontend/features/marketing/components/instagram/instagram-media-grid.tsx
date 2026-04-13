"use client";

import { useState } from "react";
import {
  IconHeart,
  IconMessageCircle,
  IconBookmark,
  IconShare,
  IconEye,
  IconPlayerPlay,
  IconPhoto,
  IconVideo,
  IconLayoutGrid,
  IconExternalLink,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared";
import type { MetaInstagramMedia, MediaTypeFilter } from "../../types/instagram";

interface Props {
  media: MetaInstagramMedia[];
  isLoading: boolean;
}

const MEDIA_TYPE_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  IMAGE: { label: "Foto", icon: IconPhoto },
  VIDEO: { label: "Video", icon: IconVideo },
  CAROUSEL_ALBUM: { label: "Carrossel", icon: IconLayoutGrid },
  REELS: { label: "Reel", icon: IconPlayerPlay },
};

const FILTERS: { value: MediaTypeFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "IMAGE", label: "Fotos" },
  { value: "VIDEO", label: "Videos" },
  { value: "CAROUSEL_ALBUM", label: "Carrosseis" },
  { value: "REELS", label: "Reels" },
];

export function InstagramMediaGrid({ media, isLoading }: Props) {
  const [filter, setFilter] = useState<MediaTypeFilter>("all");

  const filtered = filter === "all" ? media : media.filter((m) => m.media_type === filter);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <IconPhoto className="size-4 text-muted-foreground" />
            Posts recentes
          </CardTitle>
          <div className="flex items-center gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  filter === f.value
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <EmptyState
            icon={IconPhoto}
            title="Nenhum post encontrado"
            description="Sincronize a conta ou mude o filtro."
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((item) => (
              <MediaCard key={item.id} media={item} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MediaCard({ media }: { media: MetaInstagramMedia }) {
  const typeInfo = MEDIA_TYPE_LABELS[media.media_type] ?? MEDIA_TYPE_LABELS.IMAGE;
  const TypeIcon = typeInfo.icon;

  const imageUrl = media.media_url || media.thumbnail_url;

  return (
    <div className="group relative rounded-lg overflow-hidden border bg-card hover:shadow-md transition-all">
      {/* Thumbnail */}
      <div className="aspect-square bg-muted relative">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={media.caption?.slice(0, 60) || "Instagram post"}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <TypeIcon className="size-8 text-muted-foreground/30" />
          </div>
        )}

        {/* Type badge */}
        <Badge
          variant="secondary"
          className="absolute top-2 left-2 text-[10px] px-1.5 bg-black/60 text-white border-0"
        >
          <TypeIcon className="size-3 mr-0.5" />
          {typeInfo.label}
        </Badge>

        {/* Hover overlay with metrics */}
        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-white text-xs">
            <MetricItem icon={IconHeart} value={media.like_count} />
            <MetricItem icon={IconMessageCircle} value={media.comments_count} />
            <MetricItem icon={IconBookmark} value={media.saved} />
            <MetricItem icon={IconShare} value={media.shares} />
            <MetricItem icon={IconEye} value={media.reach} label="Alcance" />
            {media.plays > 0 && (
              <MetricItem icon={IconPlayerPlay} value={media.plays} label="Plays" />
            )}
          </div>

          {media.engagement_rate > 0 && (
            <Badge className="bg-pink-500 text-white border-0 text-[10px]">
              {Number(media.engagement_rate).toFixed(1)}% eng.
            </Badge>
          )}

          {media.permalink && (
            <a
              href={media.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-2 right-2 p-1 rounded bg-white/20 hover:bg-white/40 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <IconExternalLink className="size-3.5 text-white" />
            </a>
          )}
        </div>
      </div>

      {/* Caption preview */}
      <div className="p-2">
        <p className="text-[11px] text-muted-foreground line-clamp-2">
          {media.caption || "Sem legenda"}
        </p>
        {media.timestamp && (
          <p className="text-[10px] text-muted-foreground/60 mt-1">
            {new Date(media.timestamp).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
        )}
      </div>
    </div>
  );
}

function MetricItem({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ElementType;
  value: number;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <Icon className="size-3" />
      <span className="font-medium">{formatCompact(value)}</span>
    </div>
  );
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
