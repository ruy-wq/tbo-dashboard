"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  IconExternalLink,
  IconStar,
  IconStarFilled,
  IconEdit,
  IconTrash,
  IconPhoto,
  IconCalendar,
  IconBuilding,
  IconTag,
} from "@tabler/icons-react";
import { BU_COLORS } from "@/lib/constants";
import { VideoPlayer } from "@/features/portfolio/components/video-player";
import { getVideoEmbed } from "@/features/portfolio/lib/video-embed";
import type { PortfolioItem } from "@/features/portfolio/types/portfolio";
import { useState } from "react";

interface PortfolioDetailSheetProps {
  item: PortfolioItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (item: PortfolioItem) => void;
  onDelete: (id: string) => void;
  onToggleFeatured: (item: PortfolioItem) => void;
}

export function PortfolioDetailSheet({
  item,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onToggleFeatured,
}: PortfolioDetailSheetProps) {
  const [imgError, setImgError] = useState(false);

  if (!item) return null;

  const buColor = BU_COLORS[item.bu];
  const hasVideo = !!item.external_url;
  const embed = hasVideo ? getVideoEmbed(item.external_url!) : null;
  const thumb = item.thumbnail_url || embed?.thumbnailUrl;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[560px] overflow-y-auto sm:max-w-[560px] p-0">
        {/* Hero — video or thumbnail */}
        <div className="relative bg-muted">
          {hasVideo && item.external_url ? (
            <VideoPlayer
              url={item.external_url}
              thumbnailUrl={item.thumbnail_url}
              title={item.title}
            />
          ) : thumb && !imgError ? (
            <div className="aspect-video">
              <img
                src={thumb}
                alt={item.title}
                className="h-full w-full object-cover"
                onError={() => setImgError(true)}
              />
            </div>
          ) : (
            <div className="aspect-video flex items-center justify-center bg-muted">
              <IconPhoto className="size-16 text-muted-foreground/30" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Header */}
          <SheetHeader className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <SheetTitle className="text-xl leading-tight">{item.title}</SheetTitle>
              <button
                type="button"
                onClick={() => onToggleFeatured(item)}
                className="shrink-0 mt-0.5"
              >
                {item.is_featured ? (
                  <IconStarFilled className="size-5 text-amber-500" />
                ) : (
                  <IconStar className="size-5 text-muted-foreground hover:text-amber-400 transition-colors" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                className="text-xs border-0"
                style={buColor ? { backgroundColor: buColor.bg, color: buColor.color } : undefined}
              >
                {item.bu}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {item.category}
              </Badge>
            </div>
          </SheetHeader>

          {/* Metadata */}
          <div className="space-y-3">
            {item.client_company && (
              <div className="flex items-center gap-2 text-sm">
                <IconBuilding className="size-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Cliente:</span>
                <span className="font-medium">{item.client_company}</span>
              </div>
            )}
            {item.project_name && (
              <div className="flex items-center gap-2 text-sm">
                <IconBuilding className="size-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Empreendimento:</span>
                <span className="font-medium">{item.project_name}</span>
              </div>
            )}
            {item.year && (
              <div className="flex items-center gap-2 text-sm">
                <IconCalendar className="size-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Ano:</span>
                <span className="font-medium">{item.year}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {item.description && (
            <div className="space-y-1.5">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>
          )}

          {/* Tags */}
          {item.tags.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <IconTag className="size-3.5" />
                Tags
              </div>
              <div className="flex flex-wrap gap-1.5">
                {item.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* External link */}
          {item.external_url && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open(item.external_url!, "_blank")}
            >
              <IconExternalLink className="size-4 mr-2" />
              Abrir link original
            </Button>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                onOpenChange(false);
                onEdit(item);
              }}
            >
              <IconEdit className="size-3.5 mr-1.5" />
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                onOpenChange(false);
                onDelete(item.id);
              }}
            >
              <IconTrash className="size-3.5 mr-1.5" />
              Remover
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
