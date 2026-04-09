"use client";

import { useState } from "react";
import {
  useCreativeBriefings,
  useAllCampaignBriefings,
} from "@/features/clientes/hooks/use-creative-briefings";
import { BriefingDetailDialog } from "@/features/clientes/components/briefing-detail-dialog";
import { CampaignBriefingDetailDialog } from "@/features/clientes/components/campaign-briefing-detail-dialog";
import type { CreativeBriefingRow } from "@/features/clientes/services/creative-briefings";
import type { CampaignBriefingWithCampaign } from "@/features/clientes/services/creative-briefings";
import { RequireRole } from "@/features/auth/components/require-role";
import { ErrorState, EmptyState } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  IconClipboardText,
  IconSearch,
  IconCopy,
  IconArrowLeft,
  IconSpeakerphone,
  IconPlus,
} from "@tabler/icons-react";
import { toast } from "sonner";
import Link from "next/link";
import { NewBriefingDialog } from "@/features/clientes/components/new-briefing-dialog";

/* ── Status configs ── */
const CREATIVE_STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive"; dot: string }
> = {
  enviado: { label: "Enviado", variant: "default", dot: "bg-blue-500" },
  em_analise: { label: "Em Analise", variant: "outline", dot: "bg-yellow-500" },
  aprovado: { label: "Aprovado", variant: "default", dot: "bg-green-500" },
  rascunho: { label: "Rascunho", variant: "secondary", dot: "bg-zinc-500" },
};

const CAMPAIGN_STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive"; dot: string }
> = {
  draft: { label: "Rascunho", variant: "secondary", dot: "bg-zinc-500" },
  pending_approval: { label: "Aguardando", variant: "outline", dot: "bg-yellow-500" },
  approved: { label: "Aprovado", variant: "default", dot: "bg-green-500" },
  revision: { label: "Revisao", variant: "outline", dot: "bg-blue-500" },
};

type TabType = "todos" | "criativos" | "campanha";

export default function BriefingsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [tab, setTab] = useState<TabType>("todos");

  // Creative briefings
  const [selectedCreative, setSelectedCreative] = useState<CreativeBriefingRow | null>(null);
  const [creativeDetailOpen, setCreativeDetailOpen] = useState(false);

  // Campaign briefings
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignBriefingWithCampaign | null>(null);
  const [campaignDetailOpen, setCampaignDetailOpen] = useState(false);

  // New briefing dialog
  const [newBriefingOpen, setNewBriefingOpen] = useState(false);

  const {
    data: creativeBriefings = [],
    isLoading: creativeLoading,
    error: creativeError,
    refetch: creativeRefetch,
  } = useCreativeBriefings({
    status: statusFilter || undefined,
    search: search || undefined,
  });

  const {
    data: campaignBriefings = [],
    isLoading: campaignLoading,
    error: campaignError,
    refetch: campaignRefetch,
  } = useAllCampaignBriefings({
    status: statusFilter || undefined,
    search: search || undefined,
  });

  const isLoading = creativeLoading || campaignLoading;
  const error = creativeError || campaignError;

  // Contagem total
  const totalCreative = creativeBriefings.length;
  const totalCampaign = campaignBriefings.length;
  const totalAll = totalCreative + totalCampaign;

  function handleSelectCreative(b: CreativeBriefingRow) {
    setSelectedCreative(b);
    setCreativeDetailOpen(true);
  }

  function handleSelectCampaign(b: CampaignBriefingWithCampaign) {
    setSelectedCampaign(b);
    setCampaignDetailOpen(true);
  }

  function handleCopyLink(b: CreativeBriefingRow) {
    const base = window.location.origin;
    const url = `${base}/briefing/${b.slug}${b.project_slug ? `?projeto=${b.project_slug}&nome=${encodeURIComponent(b.client_name)}&projeto_nome=${encodeURIComponent(b.project_name || "")}` : `?nome=${encodeURIComponent(b.client_name)}`}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  }

  if (error) {
    return (
      <RequireRole module="clientes">
        <ErrorState
          message={(error as Error).message}
          onRetry={() => {
            creativeRefetch();
            campaignRefetch();
          }}
        />
      </RequireRole>
    );
  }

  // Status options baseado na tab ativa
  const statusOptions =
    tab === "campanha"
      ? [
          { value: "pending_approval", label: "Aguardando" },
          { value: "approved", label: "Aprovado" },
          { value: "revision", label: "Revisao" },
        ]
      : tab === "criativos"
        ? [
            { value: "enviado", label: "Enviado" },
            { value: "em_analise", label: "Em Analise" },
            { value: "aprovado", label: "Aprovado" },
          ]
        : [
            { value: "enviado", label: "Enviado" },
            { value: "em_analise", label: "Em Analise" },
            { value: "aprovado", label: "Aprovado" },
            { value: "pending_approval", label: "Aguardando" },
            { value: "revision", label: "Revisao" },
          ];

  const showCreative = tab === "todos" || tab === "criativos";
  const showCampaign = tab === "todos" || tab === "campanha";

  const filteredCreative = showCreative ? creativeBriefings : [];
  const filteredCampaign = showCampaign ? campaignBriefings : [];
  const hasAny = filteredCreative.length > 0 || filteredCampaign.length > 0;

  return (
    <RequireRole module="clientes">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/clientes">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <IconArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Briefings</h1>
              <p className="text-sm text-muted-foreground">
                Todos os briefings — criativos de clientes e de campanhas internas.
              </p>
            </div>
          </div>
          <Button onClick={() => setNewBriefingOpen(true)}>
            <IconPlus className="mr-2 h-4 w-4" />
            Novo Briefing
          </Button>
        </div>

        {/* KPIs */}
        {!isLoading && totalAll > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard label="Total" value={totalAll} color="text-foreground" />
            <KpiCard label="Criativos" value={totalCreative} color="text-orange-500" />
            <KpiCard label="Campanha" value={totalCampaign} color="text-purple-500" />
            <KpiCard
              label="Aprovados"
              value={
                creativeBriefings.filter((b) => b.status === "aprovado").length +
                campaignBriefings.filter((b) => b.status === "approved").length
              }
              color="text-green-500"
            />
          </div>
        )}

        {/* Tabs */}
        <Tabs
          value={tab}
          onValueChange={(v) => {
            setTab(v as TabType);
            setStatusFilter("");
          }}
        >
          <TabsList>
            <TabsTrigger value="todos">
              Todos
              {totalAll > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px]">
                  {totalAll}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="criativos">
              Criativos
              {totalCreative > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px]">
                  {totalCreative}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="campanha">
              Campanha
              {totalCampaign > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px]">
                  {totalCampaign}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={
                tab === "campanha"
                  ? "Buscar por campanha..."
                  : "Buscar por cliente ou campanha..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter || "all"}
            onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : !hasAny ? (
          <EmptyState
            icon={IconClipboardText}
            title="Nenhum briefing encontrado"
            description={
              tab === "campanha"
                ? "Briefings de campanhas criados no modulo Marketing aparecerao aqui."
                : tab === "criativos"
                  ? "Quando um cliente preencher o formulario de briefing, ele aparecera aqui."
                  : "Briefings criativos de clientes e de campanhas internas aparecerao aqui."
            }
          />
        ) : (
          <div className="space-y-2">
            {/* Creative briefings */}
            {filteredCreative.map((b) => {
              const st =
                CREATIVE_STATUS_CONFIG[b.status] ?? CREATIVE_STATUS_CONFIG.enviado;
              const fd = b.form_data as Record<string, unknown>;

              return (
                <div
                  key={`creative-${b.id}`}
                  className="group flex cursor-pointer items-center gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
                  onClick={() => handleSelectCreative(b)}
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
                    <IconClipboardText className="h-5 w-5 text-orange-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{b.client_name}</span>
                      {b.project_name && (
                        <span className="text-sm text-muted-foreground">
                          — {b.project_name}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="text-orange-500/70">Criativo</span>
                      {fd.padrao ? (
                        <span className="capitalize">{String(fd.padrao)}</span>
                      ) : null}
                      {fd.bairro_cidade ? (
                        <span>{String(fd.bairro_cidade)}</span>
                      ) : null}
                      {b.submitted_at && (
                        <span>
                          {new Date(b.submitted_at).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={st.variant}>
                      <span
                        className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${st.dot}`}
                      />
                      {st.label}
                    </Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyLink(b);
                      }}
                    >
                      <IconCopy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {/* Campaign briefings */}
            {filteredCampaign.map((b) => {
              const st =
                CAMPAIGN_STATUS_CONFIG[b.status] ?? CAMPAIGN_STATUS_CONFIG.draft;

              return (
                <div
                  key={`campaign-${b.id}`}
                  className="group flex cursor-pointer items-center gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
                  onClick={() => handleSelectCampaign(b)}
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
                    <IconSpeakerphone className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{b.campaign_name}</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="text-purple-500/70">Campanha</span>
                      {b.objective && (
                        <span className="truncate max-w-xs">
                          {b.objective.length > 60
                            ? `${b.objective.slice(0, 60)}...`
                            : b.objective}
                        </span>
                      )}
                      <span>
                        {new Date(b.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={st.variant}>
                      <span
                        className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${st.dot}`}
                      />
                      {st.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Detail Sheets */}
        <BriefingDetailDialog
          briefing={selectedCreative}
          open={creativeDetailOpen}
          onOpenChange={setCreativeDetailOpen}
        />
        <CampaignBriefingDetailDialog
          briefing={selectedCampaign}
          open={campaignDetailOpen}
          onOpenChange={setCampaignDetailOpen}
        />
        <NewBriefingDialog
          open={newBriefingOpen}
          onOpenChange={setNewBriefingOpen}
        />
      </div>
    </RequireRole>
  );
}

function KpiCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
