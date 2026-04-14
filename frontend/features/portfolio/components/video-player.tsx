"use client";

import { useState } from "react";
import { IconPlayerPlay, IconBrandVimeo, IconBrandYoutube, IconCloud, IconVideo } from "@tabler/icons-react";
import { getVideoEmbed, type VideoSource } from "@/features/portfolio/lib/video-embed";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  url: string;
  thumbnailUrl?: string | null;
  title?: string;
  className?: string;
  autoPlay?: boolean;
}

const SOURCE_ICONS: Record<VideoSource, typeof IconVideo> = {
  vimeo: IconBrandVimeo,
  youtube: IconBrandYoutube,
  google_drive: IconCloud,
  direct: IconVideo,
  unknown: IconVideo,
};

export function VideoPlayer({
  url,
  thumbnailUrl,
  title,
  className,
  autoPlay = false,
}: VideoPlayerProps) {
  const [playing, setPlaying] = useState(autoPlay);
  const embed = getVideoEmbed(url);

  if (!embed) return null;

  const SourceIcon = SOURCE_ICONS[embed.source];
  const thumb = thumbnailUrl || embed.thumbnailUrl;

  // Direct video — use HTML5 player
  if (embed.source === "direct") {
    return (
      <div className={cn("relative aspect-video bg-black rounded-lg overflow-hidden", className)}>
        <video
          src={embed.embedUrl}
          controls
          className="h-full w-full"
          poster={thumb || undefined}
          title={title}
        />
      </div>
    );
  }

  // Iframe-based (Vimeo, YouTube, Drive) — show thumbnail until click
  if (!playing && thumb) {
    return (
      <button
        type="button"
        onClick={() => setPlaying(true)}
        className={cn(
          "relative aspect-video bg-black rounded-lg overflow-hidden group cursor-pointer",
          className,
        )}
      >
        <img
          src={thumb}
          alt={title || "Video thumbnail"}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/40">
          <div className="flex items-center justify-center size-16 rounded-full bg-white/90 shadow-lg transition-transform group-hover:scale-110">
            <IconPlayerPlay className="size-7 text-black ml-1" fill="currentColor" />
          </div>
        </div>
        {/* Source badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[11px] text-white/90">
          <SourceIcon className="size-3.5" />
          {embed.source === "vimeo" ? "Vimeo" : embed.source === "youtube" ? "YouTube" : "Drive"}
        </div>
      </button>
    );
  }

  // Playing — render iframe
  return (
    <div className={cn("relative aspect-video bg-black rounded-lg overflow-hidden", className)}>
      <iframe
        src={playing ? embed.embedUrl + (embed.embedUrl.includes("?") ? "&autoplay=1" : "?autoplay=1") : embed.embedUrl}
        title={title || "Video"}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 h-full w-full border-0"
      />
    </div>
  );
}
