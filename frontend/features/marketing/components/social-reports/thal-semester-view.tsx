"use client";

import {
  IconUsers,
  IconEye,
  IconPointer,
  IconUserSearch,
  IconPhoto,
  IconVideo,
  IconHeart,
  IconShare,
  IconBookmark,
  IconBrandInstagram,
  IconChartBar,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ReportKpiCard,
  SectionHeader,
  InsightCallout,
  MetricTable,
} from "./report-primitives";
import {
  SEMESTER_SUMMARY as DEFAULT_SUMMARY,
  SEMESTER_FEED as DEFAULT_FEED,
  SEMESTER_REELS as DEFAULT_REELS,
  SEMESTER_STORIES as DEFAULT_STORIES,
  SEMESTER_COMPARISON as DEFAULT_COMPARISON,
} from "../../data/thal-instagram-report";

const fmt = (n: number) => n.toLocaleString("pt-BR");

interface ThalSemesterProps {
  semesterSummary?: typeof DEFAULT_SUMMARY;
  semesterFeed?: typeof DEFAULT_FEED;
  semesterReels?: typeof DEFAULT_REELS;
  semesterStories?: typeof DEFAULT_STORIES;
  semesterComparison?: typeof DEFAULT_COMPARISON;
}

export function ThalSemesterView({
  semesterSummary,
  semesterFeed,
  semesterReels,
  semesterStories,
  semesterComparison,
}: ThalSemesterProps = {}) {
  const SEMESTER_SUMMARY = semesterSummary ?? DEFAULT_SUMMARY;
  const SEMESTER_FEED = semesterFeed ?? DEFAULT_FEED;
  const SEMESTER_REELS = semesterReels ?? DEFAULT_REELS;
  const SEMESTER_STORIES = semesterStories ?? DEFAULT_STORIES;
  const SEMESTER_COMPARISON = semesterComparison ?? DEFAULT_COMPARISON;
  return (
    <div className="space-y-8">
      {/* ── 07 Sumário Executivo ── */}
      <section className="space-y-4">
        <SectionHeader number="07" title="Sumário Executivo — 6 Meses" />
        <InsightCallout title="Visão do semestre">
          Crescimento exponencial: visualizações +736%, interações +867%, visitas ao perfil +114%. Estratégia combinada de mídia paga e produção orgânica consolidou 5.172 seguidores com base sólida em Curitiba.
        </InsightCallout>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ReportKpiCard icon={<IconUsers className="h-4 w-4" />} label="Seguidores" value={fmt(SEMESTER_SUMMARY.followers)} sub="total da conta" />
          <ReportKpiCard icon={<IconEye className="h-4 w-4" />} label="Visualizações Totais" value={fmt(SEMESTER_SUMMARY.views.value)} metric={SEMESTER_SUMMARY.views} accent />
          <ReportKpiCard icon={<IconUserSearch className="h-4 w-4" />} label="Visitas ao Perfil" value={fmt(SEMESTER_SUMMARY.profileVisits.value)} metric={SEMESTER_SUMMARY.profileVisits} />
          <ReportKpiCard icon={<IconPointer className="h-4 w-4" />} label="Interações Totais" value={fmt(SEMESTER_SUMMARY.interactions.value)} metric={SEMESTER_SUMMARY.interactions} />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <ReportKpiCard icon={<IconEye className="h-4 w-4" />} label="Alcance Total (30d)" value={fmt(SEMESTER_SUMMARY.reachTotal.value)} metric={SEMESTER_SUMMARY.reachTotal} />
          <ReportKpiCard icon={<IconEye className="h-4 w-4" />} label="Alcance Pago (30d)" value={fmt(SEMESTER_SUMMARY.reachPaid.value)} metric={SEMESTER_SUMMARY.reachPaid} />
          <ReportKpiCard icon={<IconEye className="h-4 w-4" />} label="Alcance Orgânico (30d)" value={fmt(SEMESTER_SUMMARY.reachOrganic.value)} metric={SEMESTER_SUMMARY.reachOrganic} />
        </div>
      </section>

      {/* ── 08 Feed 6M ── */}
      <section className="space-y-4">
        <SectionHeader number="08" title="Postagens do Feed — 6 Meses" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ReportKpiCard icon={<IconPhoto className="h-4 w-4" />} label="Publicações" value={String(SEMESTER_FEED.overview.posts.value)} metric={SEMESTER_FEED.overview.posts} />
          <ReportKpiCard icon={<IconPointer className="h-4 w-4" />} label="Interações" value={fmt(SEMESTER_FEED.overview.interactions.value)} metric={SEMESTER_FEED.overview.interactions} accent />
          <ReportKpiCard icon={<IconShare className="h-4 w-4" />} label="Compartilhamentos" value={fmt(SEMESTER_FEED.overview.shares.value)} metric={SEMESTER_FEED.overview.shares} />
          <ReportKpiCard icon={<IconBookmark className="h-4 w-4" />} label="Salvamentos" value={fmt(SEMESTER_FEED.overview.saves.value)} metric={SEMESTER_FEED.overview.saves} />
        </div>

        <InsightCallout title="Qualidade vs. Quantidade">
          Volume de postagens caiu -24,19%, mas todas as métricas de engajamento explodiram: compartilhamentos +585%, salvamentos +487%, interações +468%. Curadoria melhorou substancialmente.
        </InsightCallout>

        <MetricTable
          title="Top 5 — Publicações de Maior Alcance"
          icon={<IconPhoto className="h-4 w-4 text-muted-foreground" />}
          columns={[
            { key: "title", label: "Publicação", align: "left" },
            { key: "type", label: "Tipo", align: "center", hideOnMobile: true },
            { key: "views", label: "Visualiz.", align: "right", format: (v) => fmt(v as number) },
            { key: "reach", label: "Alcance", align: "right", format: (v) => fmt(v as number) },
            { key: "interactions", label: "Interações", align: "right", hideOnMobile: true },
            { key: "engRate", label: "Taxa Eng.", align: "right", format: (v) => `${v}%`, className: "font-semibold" },
            { key: "likes", label: "Curtidas", align: "right", hideOnMobile: true },
            { key: "shares", label: "Compart.", align: "right", hideOnMobile: true },
          ]}
          rows={SEMESTER_FEED.topPosts}
          highlightKey="engRate"
        />

        <InsightCallout title="Padrão dos top performers">
          Todos os 5 conteúdos de maior alcance são Reels com narrativas institucionais ou de produto. Conteúdos que reforçam solidez, propósito e legado geram engajamento de até 10,43%.
        </InsightCallout>
      </section>

      {/* ── 09 Reels 6M ── */}
      <section className="space-y-4">
        <SectionHeader number="09" title="Reels — 6 Meses" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ReportKpiCard icon={<IconVideo className="h-4 w-4" />} label="Publicados" value={String(SEMESTER_REELS.overview.published.value)} metric={SEMESTER_REELS.overview.published} />
          <ReportKpiCard icon={<IconPointer className="h-4 w-4" />} label="Interações" value={fmt(SEMESTER_REELS.overview.interactions.value)} metric={SEMESTER_REELS.overview.interactions} accent />
          <ReportKpiCard icon={<IconHeart className="h-4 w-4" />} label="Curtidas" value={fmt(SEMESTER_REELS.overview.likes.value)} metric={SEMESTER_REELS.overview.likes} />
          <ReportKpiCard icon={<IconShare className="h-4 w-4" />} label="Compartilhamentos" value={fmt(SEMESTER_REELS.overview.shares.value)} metric={SEMESTER_REELS.overview.shares} />
        </div>
        <InsightCallout title="Reels: motor do semestre">
          Interações cresceram +736% e curtidas +881%. Os 348 compartilhamentos (+461%) são o dado mais estratégico: compartilhamento é o sinal mais forte de distribuição orgânica no Instagram.
        </InsightCallout>
      </section>

      {/* ── 10 Stories 6M ── */}
      <section className="space-y-4">
        <SectionHeader number="10" title="Stories — 6 Meses" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ReportKpiCard icon={<IconBrandInstagram className="h-4 w-4" />} label="Publicados" value={String(SEMESTER_STORIES.overview.published.value)} deltaLabel="Inauguração" />
          <ReportKpiCard icon={<IconEye className="h-4 w-4" />} label="Visualizações" value={fmt(SEMESTER_STORIES.overview.views.value)} deltaLabel="Inauguração" />
          <ReportKpiCard icon={<IconPointer className="h-4 w-4" />} label="Interações" value={fmt(SEMESTER_STORIES.overview.interactions.value)} deltaLabel="Inauguração" />
          <ReportKpiCard icon={<IconShare className="h-4 w-4" />} label="Compartilhamentos" value={fmt(SEMESTER_STORIES.overview.shares.value)} deltaLabel="Inauguração" />
        </div>

        <MetricTable
          title="Top 6 Stories — por Retenção"
          icon={<IconBrandInstagram className="h-4 w-4 text-muted-foreground" />}
          columns={[
            { key: "date", label: "Data", align: "left" },
            { key: "views", label: "Visualiz.", align: "right", format: (v) => fmt(v as number) },
            { key: "reach", label: "Alcance", align: "right", format: (v) => fmt(v as number) },
            { key: "retention", label: "Retenção", align: "right", format: (v) => `${v}%`, className: "font-semibold text-emerald-600" },
            { key: "interactions", label: "Interações", align: "right", hideOnMobile: true },
            { key: "shares", label: "Compart.", align: "right", hideOnMobile: true },
          ]}
          rows={SEMESTER_STORIES.topStories}
          highlightKey="retention"
        />

        <InsightCallout title="Benchmark de retenção">
          Retenção acima de 92% é referência de excelência — a média do mercado fica entre 70-80%. Stories de novembro/2025 consistentemente acima de 92%.
        </InsightCallout>
      </section>

      {/* ── 11 Comparativo Semestral ── */}
      <section className="space-y-4">
        <SectionHeader number="11" title="Comparativo Semestral Completo" />
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <IconChartBar className="h-4 w-4 text-muted-foreground" />
              Semestre Anterior vs. Semestre Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Métrica</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Sem. Anterior</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Sem. Atual</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Variação</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {SEMESTER_COMPARISON.map((row) => {
                    const hasLabel = "deltaLabel" in row;
                    const delta = hasLabel ? 0 : row.delta;
                    const isPositive = delta > 0;
                    return (
                      <tr key={row.metric} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2.5 font-medium">{row.metric}</td>
                        <td className="px-4 py-2.5 text-right text-muted-foreground tabular-nums">{fmt(row.previous)}</td>
                        <td className="px-4 py-2.5 text-right font-medium tabular-nums">{fmt(row.current)}</td>
                        <td className="px-4 py-2.5 text-right">
                          {hasLabel ? (
                            <Badge variant="secondary" className="text-[10px]">{(row as { deltaLabel: string }).deltaLabel}</Badge>
                          ) : (
                            <span className={`text-xs font-semibold ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
                              {isPositive ? "+" : ""}{delta.toFixed(delta % 1 === 0 ? 0 : 2)}%
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <InsightCallout title="Síntese comparativa">
          Com menos conteúdo publicado, a Thal gerou 10x mais interações totais e 8x mais visualizações no semestre. Evolução qualitativa da produção: conteúdo mais estratégico, melhor direção criativa.
        </InsightCallout>
      </section>

      {/* ── 12 Direcionamentos ── */}
      <section className="space-y-4">
        <SectionHeader number="12" title="Conclusões e Direcionamentos Estratégicos" />
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-emerald-200 dark:border-emerald-900/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-600">Conquistas do Semestre</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2"><span className="text-emerald-500 shrink-0">+</span> +867% em interações totais</li>
                <li className="flex gap-2"><span className="text-emerald-500 shrink-0">+</span> Reels com engajamento de até 10,43%</li>
                <li className="flex gap-2"><span className="text-emerald-500 shrink-0">+</span> Stories inaugurados com retenção acima de 92%</li>
                <li className="flex gap-2"><span className="text-emerald-500 shrink-0">+</span> Menos publicações com maior qualidade e engajamento</li>
              </ul>
            </CardContent>
          </Card>
          <Card className="border-orange-200 dark:border-orange-900/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#E85102]">Prioridades próximo semestre</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2"><span className="text-[#E85102] shrink-0">→</span> Consolidar Reels (min. 2-3/mês)</li>
                <li className="flex gap-2"><span className="text-[#E85102] shrink-0">→</span> Calendário de Stories semanal</li>
                <li className="flex gap-2"><span className="text-[#E85102] shrink-0">→</span> Série de conteúdo para o AUMA</li>
                <li className="flex gap-2"><span className="text-[#E85102] shrink-0">→</span> Otimizar mídia paga alinhada a conteúdos orgânicos de alta performance</li>
                <li className="flex gap-2"><span className="text-[#E85102] shrink-0">→</span> Crescimento qualificado de seguidores via CTA</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
