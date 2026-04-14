"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  IconStar,
  IconStarFilled,
  IconDots,
  IconTrash,
  IconEdit,
  IconExternalLink,
  IconPhoto,
} from "@tabler/icons-react";
import { BU_COLORS } from "@/lib/constants";
import type { PortfolioItem } from "@/features/portfolio/types/portfolio";
import { cn } from "@/lib/utils";

interface PortfolioCardProps {
  item: PortfolioItem;
  onToggleFeatured: (item: PortfolioItem) => void;
  onEdit: (item: PortfolioItem) => void;
  onDelete: (id: string) => void;
}

export function PortfolioCard({
  item,
  onToggleFeatured,
  onEdit,
  onDelete,
}: PortfolioCardProps) {
  const [imgError, setImgError] = useState(false);
  const buColor = BU_COLORS[item.bu];

  return (
    <Card className="group relative overflow-hidden border-border/50 transition-all hover:border-border hover:shadow-md">
      {/* Thumbnail */}
      <div className="relative aspect-[16/10] bg-muted overflow-hidden">
        {item.thumbnail_url && !imgError ? (
          <img
            src={item.thumbnail_url}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <IconPhoto className="size-10 text-muted-foreground/40" />
          </div>
        )}

        {/* Overlay actions */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

        {/* Featured star */}
        <button
          type="button"
          onClick={() => onToggleFeatured(item)}
          className={cn(
            "absolute top-2 right-2 rounded-full p-1.5 transition-all",
            item.is_featured
              ? "bg-amber-500/90 text-white"
              : "bg-black/40 text-white/70 opacity-0 group-hover:opacity-100 hover:bg-black/60",
          )}
        >
          {item.is_featured ? (
            <IconStarFilled className="size-3.5" />
          ) : (
            <IconStar className="size-3.5" />
          )}
        </button>

        {/* BU badge */}
        <Badge
          className="absolute bottom-2 left-2 text-[10px] border-0"
          style={
            buColor
              ? { backgroundColor: buColor.bg, color: buColor.color }
              : undefined
          }
        >
          {item.bu}
        </Badge>

        {/* Category badge */}
        <Badge
          variant="secondary"
          className="absolute bottom-2 right-2 text-[10px] bg-black/50 text-white border-0"
        >
          {item.category}
        </Badge>
      </div>

      {/* Content */}
      <CardContent className="p-3 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-medium">{item.title}</h3>
            {item.client_company && (
              <p className="truncate text-xs text-muted-foreground">
                {item.client_company}
                {item.year ? ` · ${item.year}` : ""}
              </p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 opacity-0 group-hover:opacity-100"
              >
                <IconDots className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(item)}>
                <IconEdit className="size-4 mr-2" />
                Editar
              </DropdownMenuItem>
              {item.external_url && (
                <DropdownMenuItem
                  onClick={() => window.open(item.external_url!, "_blank")}
                >
                  <IconExternalLink className="size-4 mr-2" />
                  Abrir link
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(item.id)}
              >
                <IconTrash className="size-4 mr-2" />
                Remover
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-[9px] px-1.5 py-0">
                {tag}
              </Badge>
            ))}
            {item.tags.length > 3 && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                +{item.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
