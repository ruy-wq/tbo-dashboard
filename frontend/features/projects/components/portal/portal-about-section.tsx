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
  IconLink,
  IconPresentation,
  IconBook,
  IconForms,
  IconBrandGoogleDrive,
  IconLayoutBoard,
  IconArrowRight,
  IconNews,
} from "@tabler/icons-react";
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
  /** Links de onboarding e documentos do projeto */
  onboarding_url?: string;
  guide_url?: string;
  briefing_url?: string;
  drive_url?: string;
  miro_url?: string;
  logo_url?: string;
  media_coverage?: { source: string; title: string; url: string }[];
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

// ─── Section Header (numbered TBO style) ─────────────────────────────────────

function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span
        className="text-xs font-medium"
        style={{ color: "#c45a1a", minWidth: "24px" }}
      >
        {number}
      </span>
      <span
        className="text-xs font-medium uppercase tracking-[0.15em]"
        style={{ color: "#1a1a1a" }}
      >
        {title}
      </span>
      <div className="flex-1 h-px" style={{ backgroundColor: "#d9d4cd" }} />
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PortalAboutSection({ projectName, clientCompany, data, onEdit }: PortalAboutSectionProps) {
  const isEmpty = !hasAnyData(data);

  // ── Empty State ────────────────────────────────────────────────────────────
  if (isEmpty) {
    return (
      <div
        className="rounded-lg p-12 text-center"
        style={{
          border: "1px dashed #d9d4cd",
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        }}
      >
        <IconInfoCircle size={40} className="mx-auto mb-4" style={{ color: "#d9d4cd" }} />
        <h3 className="text-sm font-medium mb-1" style={{ color: "#1a1a1a" }}>
          Informacoes do empreendimento
        </h3>
        <p className="text-xs mb-4 max-w-md mx-auto" style={{ color: "#8a8580" }}>
          Preencha os dados do empreendimento para que o cliente veja as informacoes na aba Sobre do portal.
        </p>
        {onEdit && (
          <Button onClick={onEdit} className="rounded-lg" style={{ backgroundColor: "#c45a1a" }}>
            <IconPencil size={16} className="mr-1.5" />
            Preencher informacoes
          </Button>
        )}
      </div>
    );
  }

  let sectionNum = 0;

  // ── Filled State ───────────────────────────────────────────────────────────
  return (
    <div
      className="space-y-8"
      style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}
    >
      {/* Edit button */}
      {onEdit && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            style={{ borderColor: "#d9d4cd" }}
          >
            <IconPencil size={14} className="mr-1.5" />
            Editar
          </Button>
        </div>
      )}

      {/* Project Hero */}
      <div className="rounded-lg p-8" style={{ backgroundColor: "#1a1a1a" }}>
        {/* Client logo + category row */}
        <div className="flex items-center justify-between mb-4">
          <div>
            {data.category && (
              <span
                className="inline-block rounded-md px-3 py-1 text-[10px] font-medium uppercase tracking-[0.15em]"
                style={{ backgroundColor: "#c45a1a", color: "#fff" }}
              >
                {data.category}
              </span>
            )}
          </div>
          {data.logo_url && (
            <img
              src={data.logo_url}
              alt={clientCompany ?? "Logo"}
              className="h-10 object-contain"
              style={{ filter: "brightness(0) invert(1)", opacity: 0.7 }}
            />
          )}
        </div>
        <h2 className="text-3xl font-light tracking-tight text-white">{projectName}</h2>
        {data.tagline && (
          <p className="mt-2 text-base text-zinc-400">{data.tagline}</p>
        )}
        {data.description && (
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-500">
            {data.description}
          </p>
        )}
      </div>

      {/* Location */}
      {(data.address || data.nearby_places?.length) && (
        <div>
          <SectionHeader number={String(++sectionNum).padStart(2, "0")} title="Localizacao" />
          <div className="rounded-lg p-6" style={{ backgroundColor: "#fff", border: "1px solid #d9d4cd" }}>
            {data.address && (
              <div className="flex items-start gap-3">
                <IconMapPin className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#c45a1a" }} />
                <p className="text-sm font-medium" style={{ color: "#1a1a1a" }}>{data.address}</p>
              </div>
            )}
            {data.walk_score != null && (
              <div className="flex items-center gap-2 mt-3 ml-7">
                <span
                  className="inline-block rounded-md px-2 py-0.5 text-[10px] font-medium"
                  style={{ backgroundColor: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" }}
                >
                  Walk Score: {data.walk_score}
                </span>
                {data.walk_score_label && (
                  <span className="text-xs" style={{ color: "#8a8580" }}>{data.walk_score_label}</span>
                )}
              </div>
            )}
            {data.nearby_places && data.nearby_places.length > 0 && (
              <div className="grid grid-cols-2 gap-2 pt-4 mt-4" style={{ borderTop: "1px solid #ebe7e1" }}>
                {data.nearby_places.map((item) => (
                  <div
                    key={item}
                    className="rounded-md px-3 py-2 text-xs"
                    style={{ backgroundColor: "#faf8f5", color: "#6b6560" }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tipologias */}
      {data.typologies && data.typologies.length > 0 && (
        <div>
          <SectionHeader number={String(++sectionNum).padStart(2, "0")} title="Tipologias" />
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg md:grid-cols-3" style={{ backgroundColor: "#d9d4cd" }}>
            {data.typologies.map((t, i) => (
              <div key={i} className="p-4 text-center" style={{ backgroundColor: "#fff" }}>
                <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "#8a8580" }}>
                  {t.tipo}
                </p>
                <p className="mt-1 text-lg font-light" style={{ color: "#1a1a1a" }}>{t.area}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Areas Comuns */}
      {data.common_areas && data.common_areas.length > 0 && (
        <div>
          <SectionHeader number={String(++sectionNum).padStart(2, "0")} title={`Areas Comuns — +${data.common_areas.length} espacos`} />
          <div className="flex flex-wrap gap-2">
            {data.common_areas.map((area) => (
              <span
                key={area}
                className="rounded-md px-3 py-1.5 text-xs"
                style={{ backgroundColor: "#ebe7e1", color: "#4a4540" }}
              >
                {area}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Diferenciais */}
      {data.differentials && data.differentials.length > 0 && (
        <div>
          <SectionHeader number={String(++sectionNum).padStart(2, "0")} title="Diferenciais" />
          <ul className="space-y-2">
            {data.differentials.map((diff) => (
              <li key={diff} className="flex items-start gap-3 text-sm" style={{ color: "#4a4540" }}>
                <div
                  className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: "#c45a1a" }}
                />
                {diff}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Incorporadora */}
      {data.developer?.description && (
        <div>
          <SectionHeader
            number={String(++sectionNum).padStart(2, "0")}
            title={clientCompany ? `Sobre a ${clientCompany}` : "Sobre a Incorporadora"}
          />
          <div className="rounded-lg p-6" style={{ backgroundColor: "#fff", border: "1px solid #d9d4cd" }}>
            <p className="text-sm leading-relaxed" style={{ color: "#6b6560" }}>
              {data.developer.description}
            </p>

            {data.developer.stats && data.developer.stats.length > 0 && (
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg mt-5" style={{ backgroundColor: "#d9d4cd" }}>
                {data.developer.stats.map((s, i) => (
                  <div key={i} className="p-4" style={{ backgroundColor: "#faf8f5" }}>
                    <p className="text-xl font-light" style={{ color: "#1a1a1a" }}>{s.value}</p>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: "#8a8580" }}>
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {(data.developer.website || data.developer.phone || data.developer.email) && (
              <div
                className="flex items-center gap-5 pt-4 mt-4 text-xs"
                style={{ borderTop: "1px solid #ebe7e1", color: "#8a8580" }}
              >
                {data.developer.website && (
                  <a
                    href={data.developer.website.startsWith("http") ? data.developer.website : `https://${data.developer.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 transition-colors"
                    style={{ color: "#8a8580" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#c45a1a"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "#8a8580"; }}
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
              <div className="pt-4 mt-4" style={{ borderTop: "1px solid #ebe7e1" }}>
                <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: "#8a8580" }}>
                  Outros empreendimentos
                </p>
                <div className="flex flex-wrap gap-2">
                  {data.developer.other_projects.map((emp) => (
                    <span
                      key={emp}
                      className="rounded-md px-3 py-1 text-xs"
                      style={{ border: "1px solid #d9d4cd", color: "#6b6560" }}
                    >
                      {emp}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Previsao de Entrega */}
      {data.delivery_year && (
        <div>
          <SectionHeader number={String(++sectionNum).padStart(2, "0")} title="Previsao de Entrega" />
          <div className="rounded-lg p-6" style={{ backgroundColor: "#fff", border: "1px solid #d9d4cd" }}>
            <p className="text-2xl font-light" style={{ color: "#1a1a1a" }}>{data.delivery_year}</p>
            {data.delivery_description && (
              <p className="mt-1 text-xs" style={{ color: "#8a8580" }}>{data.delivery_description}</p>
            )}
          </div>
        </div>
      )}

      {/* Links do Projeto */}
      {(data.onboarding_url || data.guide_url || data.briefing_url || data.drive_url || data.miro_url) && (
        <div>
          <SectionHeader number={String(++sectionNum).padStart(2, "0")} title="Links do Projeto" />
          <div className="grid gap-px overflow-hidden rounded-lg sm:grid-cols-2" style={{ backgroundColor: "#d9d4cd" }}>
            {data.onboarding_url && (
              <a
                href={data.onboarding_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 p-4 transition-all"
                style={{ backgroundColor: "#fff" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#faf8f5"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#fff"; }}
              >
                <IconPresentation className="h-4 w-4" style={{ color: "#c45a1a" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: "#1a1a1a" }}>Apresentacao</p>
                  <p className="text-[10px]" style={{ color: "#8a8580" }}>Onboarding do projeto</p>
                </div>
                <IconArrowRight
                  className="h-3 w-3 transition-transform group-hover:translate-x-1"
                  style={{ color: "#c45a1a", opacity: 0.5 }}
                />
              </a>
            )}
            {data.guide_url && (
              <a
                href={data.guide_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 p-4 transition-all"
                style={{ backgroundColor: "#fff" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#faf8f5"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#fff"; }}
              >
                <IconBook className="h-4 w-4" style={{ color: "#c45a1a" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: "#1a1a1a" }}>Guia de Boas-Vindas</p>
                  <p className="text-[10px]" style={{ color: "#8a8580" }}>Politicas e acessos</p>
                </div>
                <IconArrowRight
                  className="h-3 w-3 transition-transform group-hover:translate-x-1"
                  style={{ color: "#c45a1a", opacity: 0.5 }}
                />
              </a>
            )}
            {data.briefing_url && (
              <a
                href={data.briefing_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 p-4 transition-all"
                style={{ backgroundColor: "#fff" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#faf8f5"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#fff"; }}
              >
                <IconForms className="h-4 w-4" style={{ color: "#c45a1a" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: "#1a1a1a" }}>Briefing</p>
                  <p className="text-[10px]" style={{ color: "#8a8580" }}>Preencher briefing criativo</p>
                </div>
                <IconArrowRight
                  className="h-3 w-3 transition-transform group-hover:translate-x-1"
                  style={{ color: "#c45a1a", opacity: 0.5 }}
                />
              </a>
            )}
            {data.drive_url && (
              <a
                href={data.drive_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 p-4 transition-all"
                style={{ backgroundColor: "#fff" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#faf8f5"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#fff"; }}
              >
                <IconBrandGoogleDrive className="h-4 w-4" style={{ color: "#c45a1a" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: "#1a1a1a" }}>Google Drive</p>
                  <p className="text-[10px]" style={{ color: "#8a8580" }}>Pasta de arquivos</p>
                </div>
                <IconArrowRight
                  className="h-3 w-3 transition-transform group-hover:translate-x-1"
                  style={{ color: "#c45a1a", opacity: 0.5 }}
                />
              </a>
            )}
            {data.miro_url && (
              <a
                href={data.miro_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 p-4 transition-all"
                style={{ backgroundColor: "#fff" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#faf8f5"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#fff"; }}
              >
                <IconLayoutBoard className="h-4 w-4" style={{ color: "#c45a1a" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: "#1a1a1a" }}>Miro</p>
                  <p className="text-[10px]" style={{ color: "#8a8580" }}>Direcao criativa e retornos</p>
                </div>
                <IconArrowRight
                  className="h-3 w-3 transition-transform group-hover:translate-x-1"
                  style={{ color: "#c45a1a", opacity: 0.5 }}
                />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Media Coverage */}
      {data.media_coverage && data.media_coverage.length > 0 && (
        <div>
          <SectionHeader
            number={String(++sectionNum).padStart(2, "0")}
            title={`${clientCompany ?? "Incorporadora"} na Midia`}
          />
          <div className="space-y-px overflow-hidden rounded-lg" style={{ backgroundColor: "#d9d4cd" }}>
            {data.media_coverage.map((item, i) => (
              <a
                key={i}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-4 p-4 transition-all"
                style={{ backgroundColor: "#fff" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#faf8f5"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#fff"; }}
              >
                <IconNews className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#c45a1a" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: "#1a1a1a" }}>
                    {item.title}
                  </p>
                  <p className="text-[10px] mt-0.5 uppercase tracking-wider" style={{ color: "#8a8580" }}>
                    {item.source}
                  </p>
                </div>
                <IconArrowRight
                  className="h-3 w-3 flex-shrink-0 mt-1 transition-transform group-hover:translate-x-1"
                  style={{ color: "#c45a1a", opacity: 0.5 }}
                />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
