"use client";

import {
  IconBrandInstagram,
  IconRefresh,
  IconExternalLink,
  IconDotsVertical,
  IconTrash,
  IconSettings,
  IconCheck,
  IconAlertTriangle,
  IconClock,
  IconLoader2,
} from "@tabler/icons-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { MetaInstagramAccount } from "../../types/instagram";

interface Props {
  account: MetaInstagramAccount;
  isSelected: boolean;
  onSelect: () => void;
  onSync: () => void;
  onDisconnect: () => void;
  isSyncing: boolean;
}

const SYNC_STATUS_MAP: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  success: { icon: IconCheck, color: "text-emerald-500", label: "Sincronizado" },
  error: { icon: IconAlertTriangle, color: "text-red-500", label: "Erro" },
  syncing: { icon: IconLoader2, color: "text-blue-500", label: "Sincronizando" },
  pending: { icon: IconClock, color: "text-amber-500", label: "Pendente" },
};

export function InstagramAccountCard({
  account,
  isSelected,
  onSelect,
  onSync,
  onDisconnect,
  isSyncing,
}: Props) {
  const syncStatus = SYNC_STATUS_MAP[account.last_sync_status] ?? SYNC_STATUS_MAP.pending;
  const SyncIcon = syncStatus.icon;

  const lastSync = account.last_sync_at
    ? new Date(account.last_sync_at).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Nunca";

  return (
    <Card
      className={`transition-all cursor-pointer hover:shadow-md ${
        isSelected
          ? "ring-2 ring-pink-500 border-pink-500/50"
          : "hover:border-pink-400/40"
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          {account.profile_picture_url ? (
            <img
              src={account.profile_picture_url}
              alt={account.username}
              className="size-10 rounded-full object-cover ring-2 ring-pink-500/20"
            />
          ) : (
            <div className="size-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <IconBrandInstagram className="size-5 text-white" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">@{account.username}</p>
            <p className="text-xs text-muted-foreground truncate">
              {account.name}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <Badge
              variant={account.account_type === "own" ? "default" : "secondary"}
              className="text-[10px] px-1.5"
            >
              {account.account_type === "own" ? "TBO" : account.client_name || "Cliente"}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <IconDotsVertical className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onSync();
                  }}
                  disabled={isSyncing}
                >
                  <IconRefresh className="mr-2 size-4" />
                  Sincronizar agora
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(
                      `https://instagram.com/${account.username}`,
                      "_blank"
                    );
                  }}
                >
                  <IconExternalLink className="mr-2 size-4" />
                  Abrir no Instagram
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDisconnect();
                  }}
                  className="text-red-600"
                >
                  <IconTrash className="mr-2 size-4" />
                  Desconectar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-sm font-bold">
              {formatCompact(account.followers_count)}
            </p>
            <p className="text-[10px] text-muted-foreground">Seguidores</p>
          </div>
          <div>
            <p className="text-sm font-bold">
              {formatCompact(account.follows_count)}
            </p>
            <p className="text-[10px] text-muted-foreground">Seguindo</p>
          </div>
          <div>
            <p className="text-sm font-bold">
              {formatCompact(account.media_count)}
            </p>
            <p className="text-[10px] text-muted-foreground">Posts</p>
          </div>
        </div>

        {/* Sync status */}
        <div className="flex items-center justify-between text-xs border-t pt-2">
          <div className="flex items-center gap-1.5">
            <SyncIcon
              className={`size-3 ${syncStatus.color} ${
                account.last_sync_status === "syncing" || isSyncing ? "animate-spin" : ""
              }`}
            />
            <span className="text-muted-foreground">
              {isSyncing ? "Sincronizando..." : syncStatus.label}
            </span>
          </div>
          <span className="text-muted-foreground">{lastSync}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
