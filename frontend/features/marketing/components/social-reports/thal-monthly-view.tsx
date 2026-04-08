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
  IconMapPin,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ReportKpiCard,
  SectionHeader,
  InsightCallout,
  MetricTable,
  ReachBar,
} from "./report-primitives";
import {
  MONTHLY_SUMMARY as DEFAULT_SUMMARY,
  MONTHLY_FEED as DEFAULT_FEED,
  MONTHLY_REELS as DEFAULT_REELS,
  MONTHLY_STORIES as DEFAULT_STORIES,
  AUDIENCE as DEFAULT_AUDIENCE,
} from "../../data/thal-instagram-report";

const fmt = (n: number) => n.toLocaleString("pt-BR");

interface ThalMonthlyProps {
  monthlySummary?: typeof DEFAULT_SUMMARY;
  monthlyFeed?: typeof DEFAULT_FEED;
  monthlyReels?: typeof DEFAULT_REELS;
  monthlyStories?: typeof DEFAULT_STORIES;
  audience?: typeof DEFAULT_AUDIENCE;
}

export function ThalMonthlyView({
  monthlySummary,
  monthlyFeed,
  monthlyReels,
  monthlyStories,
  audience,
}: ThalMonthlyProps = {}) {
  const MONTHLY_SUMMARY = monthlySummary ?? DEFAULT_SUMMARY;
  const MONTHLY_FEED = monthlyFeed ?? DEFAULT_FEED;
  const MONTHLY_REELS = monthlyReels ?? DEFAULT_REELS;
  const MONTHLY_STORIES = monthlyStories ?? DEFAULT_STORIES;
  const AUDIENCE = audience ?? DEFAULT_AUDIENCE;
  return (
    <div className="space-y-8">
      {/* ── 01 Sumário Executivo ── */}
      <section className="space-y-4">
        <SectionHeader number="01" title="Sumario Executivo" />
        <InsightCallout title="Contexto do periodo">
          Retomada consistente da producao de conteudo organico com 9 publicacoes no feed (+200% vs. anterior) e 3 stories. Alcance organico cresceu +51,62% mesmo com reducao no investimento pago.
        </InsightCallout>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ReportKpiCard icon={<IconUsers className="h-4 w-4" />} label="Seguidores" value={fmt(MONTHLY_SUMMARY.followers)} sub="total da conta" />
          <ReportKpiCard icon={<IconEye className="h-4 w-4" />} label="Alcance Organico" value={fmt(MONTHLY_SUMMARY.reachOrganic.value)} metric={MONTHLY_SUMMARY.reachOrganic} accent />
          <ReportKpiCard icon={<IconEye className="h-4 w-4" />} label="Alcance Pago" value={fmt(MONTHLY_SUMMARY.reachPaid.value)} metric={MONTHLY_SUMMARY.reachPaid} />
          <ReportKpiCard icon={<IconEye className="h-4 w-4" />} label="Alcance Total" value={fmt(MONTHLY_SUMMARY.reachTotal.value)} metric={MONTHLY_SUMMARY.reachTotal} />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <ReportKpiCard icon={<IconEye className="h-4 w-4" />} label="Visualizacoes" value={fmt(MONTHLY_SUMMARY.views.value)} metric={MONTHLY_SUMMARY.views} />
          <ReportKpiCard icon={<IconUserSearch className="h-4 w-4" />} label="Visitas ao Perfil" value={fmt(MONTHLY_SUMMARY.profileVisits.value)} metric={MONTHLY_SUMMARY.profileVisits} />
          <ReportKpiCard icon={<IconPointer className="h-4 w-4" />} label="Interacoes" value={fmt(MONTHLY_SUMMARY.interactions.value)} metric={MONTHLY_SUMMARY.interactions} />
        </div>
      </section>

      {/* ── Alcance Bar ── */}
      <ReachBar paid={MONTHLY_SUMMARY.reachPaid.value} organic={MONTHLY_SUMMARY.reachOrganic.value} />

      {/* ── 02 Postagens do Feed ── */}
      <section className="space-y-4">
        <SectionHeader number="02" title="Postagens do Feed" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ReportKpiCard icon={<IconPhoto className="h-4 w-4" />} label="Publicacoes" value={String(MONTHLY_FEED.overview.posts.value)} metric={MONTHLY_FEED.overview.posts} />
          <ReportKpiCard icon={<IconEye className="h-4 w-4" />} label="Alcance" value={fmt(MONTHLY_FEED.overview.reach.value)} metric={MONTHLY_FEED.overview.reach} accent />
          <ReportKpiCard icon={<IconHeart className="h-4 w-4" />} label="Curtidas" value={fmt(MONTHLY_FEED.overview.likes.value)} metric={MONTHLY_FEED.overview.likes} />
          <ReportKpiCard icon={<IconShare className="h-4 w-4" />} label="Compartilhamentos" value={fmt(MONTHLY_FEED.overview.shares.value)} metric={MONTHLY_FEED.overview.shares} />
        </div>

        <MetricTable
          title="Desempenho por Publicacao"
          icon={<IconPhoto className="h-4 w-4 text-muted-foreground" />}
          columns={[
            { key: "title", label: "Publicacao", align: "left" },
            { key: "type", label: "Tipo", align: "center", hideOnMobile: true },
            { key: "views", label: "Visualiz.", align: "right", format: (v) => fmt(v as number) },
            { key: "reach", label: "Alcance", align: "right", format: (v) => fmt(v as number) },
            { key: "interactions", label: "Interacoes", align: "right", hideOnMobile: true },
            { key: "engRate", label: "Taxa Eng.", align: "right", format: (v) => `${v}%`, className: "font-semibold" },
            { key: "likes", label: "Curtidas", align: "right", hideOnMobile: true },
            { key: "shares", label: "Compart.", align: "right", hideOnMobile: true },
          ]}
          rows={MONTHLY_FEED.posts}
          highlightKey="engRate"
        />

        <InsightCallout title="Destaque do periodo">
          Publicacao de harmonia e lifestyle do AUMA com a maior taxa de engajamento: 5,56%. Conteudos com apelo emocional e conexao com o empreendimento performam acima da media.
        </InsightCallout>
      </section>

      {/* ── 03 Reels ── */}
      <section className="space-y-4">
        <SectionHeader number="03" title="Reels" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ReportKpiCard icon={<IconVideo className="h-4 w-4" />} label="Publicados" value={String(MONTHLY_REELS.overview.published.value)} sub="estavel vs. anterior" />
          <ReportKpiCard icon={<IconEye className="h-4 w-4" />} label="Alcance" value={fmt(MONTHLY_REELS.overview.reach.value)} metric={MONTHLY_REELS.overview.reach} />
          <ReportKpiCard icon={<IconShare className="h-4 w-4" />} label="Compartilhamentos" value={fmt(MONTHLY_REELS.overview.shares.value)} metric={MONTHLY_REELS.overview.shares} accent />
          <ReportKpiCard icon={<IconBookmark className="h-4 w-4" />} label="Salvamentos" value={fmt(MONTHLY_REELS.overview.saves.value)} metric={MONTHLY_REELS.overview.saves} />
        </div>
        <InsightCallout title="Analise de Reels">
          Compartilhamento cresceu +33,33%, indicando potencial de distribuicao. Recomenda-se aumentar frequencia para 2-3 Reels/mes com formatos mais dinamicos.
        </InsightCallout>
      </section>

      {/* ── 04 Stories ── */}
      <section className="space-y-4">
        <SectionHeader number="04" title="Stories" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ReportKpiCard icon={<IconBrandInstagram className="h-4 w-4" />} label="Publicados" value={String(MONTHLY_STORIES.overview.published.value)} deltaLabel="Novo" />
          <ReportKpiCard icon={<IconEye className="h-4 w-4" />} label="Visualizacoes" value={fmt(MONTHLY_STORIES.overview.views.value)} deltaLabel="Novo" />
          <ReportKpiCard icon={<IconEye className="h-4 w-4" />} label="Alcance" value={fmt(MONTHLY_STORIES.overview.reach.value)} deltaLabel="Novo" />
          <ReportKpiCard icon={<IconPointer className="h-4 w-4" />} label="Interacoes" value={fmt(MONTHLY_STORIES.overview.interactions.value)} deltaLabel="Novo" />
        </div>

        <MetricTable
          title="Desempenho Individual — Stories"
          icon={<IconBrandInstagram className="h-4 w-4 text-muted-foreground" />}
          columns={[
            { key: "date", label: "Data", align: "left" },
            { key: "views", label: "Visualiz.", align: "right", format: (v) => fmt(v as number) },
            { key: "reach", label: "Alcance", align: "right", format: (v) => fmt(v as number) },
            { key: "interactions", label: "Interacoes", align: "right" },
            { key: "retention", label: "Retencao", align: "right", format: (v) => `${v}%`, className: "font-semibold text-emerald-600" },
            { key: "shares", label: "Compart.", align: "right", hideOnMobile: true },
          ]}
          rows={MONTHLY_STORIES.stories}
          highlightKey="retention"
        />

        <InsightCallout title="Analise de Stories">
          Retomada positiva. Story de 05/04 com retencao de 80,67% — acima da media de mercado. Manter frequencia semanal de 3-5 stories.
        </InsightCallout>
      </section>

      {/* ── 05 Audiencia ── */}
      <section className="space-y-4">
        <SectionHeader number="05" title="Audiencia" />
        <div className="grid gap-4 md:grid-cols-2">
          {/* Geo */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <IconMapPin className="h-4 w-4 text-muted-foreground" />
                Distribuicao Geografica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {AUDIENCE.geo.map((g) => {
                const maxGeo = AUDIENCE.geo[0].followers;
                return (
                  <div key={g.city} className="group flex items-center gap-3 cursor-default">
                    <span className="w-36 shrink-0 text-right text-sm text-muted-foreground group-hover:text-foreground transition-colors truncate">
                      {g.city}
                    </span>
                    <div className="flex-1 h-5 rounded bg-muted overflow-hidden">
                      <div
                        className="h-full rounded bg-primary/70 group-hover:bg-primary transition-all"
                        style={{ width: `${(g.followers / maxGeo) * 100}%` }}
                      />
                    </div>
                    <span className="w-12 shrink-0 text-right text-sm font-medium tabular-nums">
                      {fmt(g.followers)}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Gender */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <IconUsers className="h-4 w-4 text-muted-foreground" />
                Perfil de Audiencia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-8">
                <svg viewBox="0 0 120 120" width={120} height={120}>
                  <circle cx={60} cy={60} r={48} fill="none" className="stroke-muted" strokeWidth={18} />
                  <circle
                    cx={60} cy={60} r={48} fill="none" className="stroke-orange-500" strokeWidth={18}
                    strokeDasharray={`${(AUDIENCE.gender.female / 100) * 301.6} 301.6`}
                    transform="rotate(-90 60 60)" strokeLinecap="round"
                  />
                  <circle
                    cx={60} cy={60} r={48} fill="none" className="stroke-blue-500" strokeWidth={18}
                    strokeDasharray={`${(AUDIENCE.gender.male / 100) * 301.6} 301.6`}
                    strokeDashoffset={-((AUDIENCE.gender.female / 100) * 301.6)}
                    transform="rotate(-90 60 60)" strokeLinecap="round"
                  />
                </svg>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                    <span className="text-sm text-muted-foreground">Feminino</span>
                    <span className="text-sm font-semibold ml-auto">{AUDIENCE.gender.female}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span className="text-sm text-muted-foreground">Masculino</span>
                    <span className="text-sm font-semibold ml-auto">{AUDIENCE.gender.male}%</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    Concentrada nas faixas 25-34 e 35-44 anos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── 06 Conclusões ── */}
      <section className="space-y-4">
        <SectionHeader number="06" title="Conclusoes e Recomendacoes" />
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-emerald-200 dark:border-emerald-900/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-600">O que funcionou</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2"><span className="text-emerald-500 shrink-0">+</span> Volume de feed triplicou (+200%) com ganho em alcance e interacoes organicas</li>
                <li className="flex gap-2"><span className="text-emerald-500 shrink-0">+</span> Alcance organico +51,62% — algoritmo distribuindo melhor</li>
                <li className="flex gap-2"><span className="text-emerald-500 shrink-0">+</span> Retencao Stories acima de 80%</li>
                <li className="flex gap-2"><span className="text-emerald-500 shrink-0">+</span> Taxa de engajamento 5,56% em post conceitual (media do setor ~2-3%)</li>
              </ul>
            </CardContent>
          </Card>
          <Card className="border-orange-200 dark:border-orange-900/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#E85102]">Prioridades proximo mes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2"><span className="text-[#E85102] shrink-0">→</span> Aumentar Reels para 2-3/mes: maior potencial de distribuicao organica</li>
                <li className="flex gap-2"><span className="text-[#E85102] shrink-0">→</span> Stories com frequencia minima semanal</li>
                <li className="flex gap-2"><span className="text-[#E85102] shrink-0">→</span> Explorar carrosseis editoriais para salvamentos</li>
                <li className="flex gap-2"><span className="text-[#E85102] shrink-0">→</span> Impulsionar conteudos organicos de alta performance</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
