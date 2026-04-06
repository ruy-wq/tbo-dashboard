"use client";

import {
  IconMapPin,
  IconBuilding,
  IconRuler,
  IconPool,
  IconBuildingSkyscraper,
  IconCalendar,
  IconExternalLink,
  IconPhone,
  IconMail,
  IconPencil,
  IconInfoCircle,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ProjectPortalAbout {
  category?: string;
  tagline?: string;
  description?: string;
  address?: string;
  walk_score?: number;
  walk_score_label?: string;
  nearby_places?: string[];
  typologies?: { tipo: string; area: string }[];
  common_areas?: string[];
  differentials?: string[];
  developer?: {
    description?: string;
    stats?: { value: string; label: string }[];
    website?: string;
    phone?: string;
    email?: string;
    other_projects?: string[];
  };
  delivery_year?: string;
  delivery_description?: string;
}

interface PortalAboutSectionProps {
  projectName: string;
  clientCompany: string | null;
  data: ProjectPortalAbout;
  onEdit?: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hasAnyData(data: ProjectPortalAbout): boolean {
  return !!(
    data.tagline ||
    data.description ||
    data.address ||
    data.typologies?.length ||
    data.common_areas?.length ||
    data.differentials?.length ||
    data.developer?.description ||
    data.delivery_year
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PortalAboutSection({ projectName, clientCompany, data, onEdit }: PortalAboutSectionProps) {
  const isEmpty = !hasAnyData(data);

  // ── Empty State ────────────────────────────────────────────────────────────
  if (isEmpty) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center">
        <IconInfoCircle size={40} className="mx-auto text-muted-foreground/30 mb-4" />
        <h3 className="text-base font-semibold mb-1">Informacoes do empreendimento</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
          Preencha os dados do empreendimento para que o cliente veja as informacoes na aba Sobre do portal.
        </p>
        {onEdit && (
          <Button onClick={onEdit}>
            <IconPencil size={16} className="mr-1.5" />
            Preencher informacoes
          </Button>
        )}
      </div>
    );
  }

  // ── Filled State ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Edit button */}
      {onEdit && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <IconPencil size={14} className="mr-1.5" />
            Editar informacoes
          </Button>
        </div>
      )}

      {/* Project Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-stone-900 to-stone-800 p-8 text-white">
        {data.category && (
          <Badge className="mb-4 bg-orange-500/20 text-orange-300 hover:bg-orange-500/30">
            {data.category}
          </Badge>
        )}
        <h2 className="text-3xl font-bold tracking-tight">{projectName}</h2>
        {data.tagline && (
          <p className="mt-2 text-lg text-stone-300">{data.tagline}</p>
        )}
        {data.description && (
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-stone-400">
            {data.description}
          </p>
        )}
      </div>

      {/* Location */}
      {(data.address || data.nearby_places?.length) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <IconMapPin className="h-4 w-4 text-orange-500" />
              Localizacao
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.address && (
              <p className="text-sm font-medium text-zinc-900">{data.address}</p>
            )}
            {data.walk_score != null && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                  Walk Score: {data.walk_score}
                </Badge>
                {data.walk_score_label && (
                  <span className="text-xs text-zinc-500">{data.walk_score_label}</span>
                )}
              </div>
            )}
            {data.nearby_places && data.nearby_places.length > 0 && (
              <div className="grid grid-cols-2 gap-2 pt-2">
                {data.nearby_places.map((item) => (
                  <div key={item} className="rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
                    {item}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tipologias */}
      {data.typologies && data.typologies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <IconRuler className="h-4 w-4 text-orange-500" />
              Tipologias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {data.typologies.map((t, i) => (
                <div key={i} className="rounded-xl border bg-zinc-50/50 p-4 text-center">
                  <p className="text-xs font-medium text-zinc-500">{t.tipo}</p>
                  <p className="mt-1 text-lg font-semibold text-zinc-900">{t.area}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Areas Comuns */}
      {data.common_areas && data.common_areas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <IconPool className="h-4 w-4 text-orange-500" />
              Areas Comuns — +{data.common_areas.length} espacos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.common_areas.map((area) => (
                <Badge key={area} variant="secondary" className="text-xs">
                  {area}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diferenciais */}
      {data.differentials && data.differentials.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <IconBuildingSkyscraper className="h-4 w-4 text-orange-500" />
              Diferenciais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-zinc-700">
              {data.differentials.map((diff) => (
                <li key={diff} className="flex items-start gap-2">
                  <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-orange-500" />
                  {diff}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Sobre a Incorporadora */}
      {data.developer?.description && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <IconBuilding className="h-4 w-4 text-orange-500" />
              Sobre {clientCompany ? `a ${clientCompany}` : "a Incorporadora"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed text-zinc-600">
              {data.developer.description}
            </p>

            {data.developer.stats && data.developer.stats.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {data.developer.stats.map((s, i) => (
                  <div key={i} className="rounded-lg bg-zinc-50 p-3">
                    <p className="text-2xl font-bold text-zinc-900">{s.value}</p>
                    <p className="text-xs text-zinc-500">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {(data.developer.website || data.developer.phone || data.developer.email) && (
              <div className="flex items-center gap-4 pt-2 text-xs text-zinc-500">
                {data.developer.website && (
                  <a
                    href={data.developer.website.startsWith("http") ? data.developer.website : `https://${data.developer.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 transition-colors hover:text-orange-600"
                  >
                    <IconExternalLink className="h-3 w-3" />
                    {data.developer.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
                {data.developer.phone && (
                  <span className="flex items-center gap-1">
                    <IconPhone className="h-3 w-3" />
                    {data.developer.phone}
                  </span>
                )}
                {data.developer.email && (
                  <span className="flex items-center gap-1">
                    <IconMail className="h-3 w-3" />
                    {data.developer.email}
                  </span>
                )}
              </div>
            )}

            {data.developer.other_projects && data.developer.other_projects.length > 0 && (
              <div className="border-t pt-3">
                <p className="text-xs font-medium text-zinc-500 mb-2">Outros empreendimentos</p>
                <div className="flex flex-wrap gap-2">
                  {data.developer.other_projects.map((emp) => (
                    <Badge key={emp} variant="outline" className="text-xs">{emp}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Previsao de Entrega */}
      {data.delivery_year && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <IconCalendar className="h-4 w-4 text-orange-500" />
              Previsao de Entrega
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-zinc-900">{data.delivery_year}</p>
            {data.delivery_description && (
              <p className="mt-1 text-sm text-zinc-500">{data.delivery_description}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
