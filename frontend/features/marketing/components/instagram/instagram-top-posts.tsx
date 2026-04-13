"use client";

import {
  IconTrophy,
  IconHeart,
  IconEye,
  IconMessageCircle,
  IconBookmark,
  IconExternalLink,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared";
import type { MetaInstagramMedia } from "../../types/instagram";

interface Props {
  media: MetaInstagramMedia[];
  isLoading: boolean;
}

export function InstagramTopPosts({ media, isLoading }: Props) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-36" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (media.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <EmptyState
            icon={IconTrophy}
            title="Nenhum post com metricas"
            description="Sincronize a conta para ver os top posts."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <IconTrophy className="size-4 text-amber-500" />
          Top posts por alcance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {media.slice(0, 8).map((post, idx) => (
            <div
              key={post.id}
              className="flex items-center gap-3 rounded-lg border p-2.5 hover:bg-muted/30 transition-colors"
            >
              {/* Rank */}
              <span
                className={`text-xs font-bold w-5 text-center ${
                  idx < 3 ? "text-amber-500" : "text-muted-foreground"
                }`}
              >
                {idx + 1}
              </span>

              {/* Thumbnail */}
              <div className="size-12 rounded-md overflow-hidden bg-muted shrink-0">
                {(post.media_url || post.thumbnail_url) ? (
                  <img
                    src={post.media_url || post.thumbnail_url || ""}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <IconHeart className="size-4 text-muted-foreground/30" />
                  </div>
                )}
              </div>

              {/* Caption */}
              <div className="flex-1 min-w-0">
                <p className="text-xs line-clamp-1">
                  {post.caption?.slice(0, 80) || "Sem legenda"}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                    <IconHeart className="size-3" />
                    {post.like_count.toLocaleString("pt-BR")}
                  </span>
                  <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                    <IconMessageCircle className="size-3" />
                    {post.comments_count.toLocaleString("pt-BR")}
                  </span>
                  <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                    <IconBookmark className="size-3" />
                    {post.saved.toLocaleString("pt-BR")}
                  </span>
                </div>
              </div>

              {/* Reach + engagement */}
              <div className="text-right shrink-0">
                <div className="flex items-center gap-1 text-xs font-medium">
                  <IconEye className="size-3 text-purple-500" />
                  {post.reach.toLocaleString("pt-BR")}
                </div>
                {post.engagement_rate > 0 && (
                  <Badge
                    variant="secondary"
                    className={`text-[10px] mt-0.5 ${
                      Number(post.engagement_rate) >= 5
                        ? "bg-emerald-500/10 text-emerald-600"
                        : Number(post.engagement_rate) >= 2
                          ? "bg-amber-500/10 text-amber-600"
                          : ""
                    }`}
                  >
                    {Number(post.engagement_rate).toFixed(1)}% eng.
                  </Badge>
                )}
              </div>

              {/* External link */}
              {post.permalink && (
                <a
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 p-1 rounded hover:bg-muted transition-colors"
                >
                  <IconExternalLink className="size-3.5 text-muted-foreground" />
                </a>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
