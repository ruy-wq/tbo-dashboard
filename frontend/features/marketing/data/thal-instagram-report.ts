// Relatório de Desempenho — Instagram Business — Thal Engenharia
// Fonte: Relatório gerado em abril de 2026 pela Rafaela / TBO

export const THAL_REPORT = {
  client: "Thal Engenharia",
  handle: "@thal_engenharia",
  platform: "instagram" as const,
  generatedAt: "2026-04",
  periods: {
    monthly: { start: "2026-03-08", end: "2026-04-06", compareStart: "2026-02-06", compareEnd: "2026-03-07" },
    semester: { start: "2025-10-06", end: "2026-04-06", compareStart: "2025-04-06", compareEnd: "2025-10-05" },
  },
} as const;

// ── 30 DIAS ─────────────────────────────────────────────────────

export interface MetricWithDelta {
  value: number;
  previous: number;
  delta: number; // percentage
}

export const MONTHLY_SUMMARY = {
  followers: 5172,
  reachOrganic: { value: 2156, previous: 1422, delta: 51.62 },
  reachPaid: { value: 67098, previous: 115333, delta: -41.82 },
  reachTotal: { value: 69254, previous: 116755, delta: -40.68 },
  views: { value: 325188, previous: 605313, delta: -46.28 },
  profileVisits: { value: 1166, previous: 2030, delta: -42.56 },
  interactions: { value: 687, previous: 1155, delta: -40.52 },
} satisfies Record<string, number | MetricWithDelta>;

export const MONTHLY_FEED = {
  overview: {
    posts: { value: 9, previous: 3, delta: 200 },
    reach: { value: 1956, previous: 987, delta: 98.18 },
    interactions: { value: 200, previous: 101, delta: 98.02 },
    likes: { value: 143, previous: 65, delta: 120 },
    comments: { value: 4, previous: 2, delta: 100 },
    shares: { value: 21, previous: 10, delta: 110 },
    saves: { value: 6, previous: 11, delta: -45.45 },
  },
  posts: [
    { title: "Essencia de alma a cada metro quadrado — AUMA", type: "Imagem", views: 1640, reach: 846, interactions: 36, engRate: 4.26, likes: 29, shares: 3 },
    { title: "Muito grata por cada mulher que faz parte...", type: "Imagem", views: 1300, reach: 778, interactions: 22, engRate: 2.83, likes: 15, shares: 4 },
    { title: "A cobertura duplex do AUMA e para quem busca...", type: "Carrossel", views: 1207, reach: 605, interactions: 22, engRate: 3.64, likes: 15, shares: 5 },
    { title: "Algo especial esta chegando ao Tingui...", type: "Reels", views: 901, reach: 529, interactions: 13, engRate: 2.46, likes: 10, shares: 2 },
    { title: "A Harmonia entre o ser, o espaco e o tempo — AUMA", type: "Imagem", views: 1010, reach: 522, interactions: 29, engRate: 5.56, likes: 26, shares: 1 },
  ],
};

export const MONTHLY_REELS = {
  overview: {
    published: { value: 1, previous: 1, delta: 0 },
    reach: { value: 1410, previous: 1980, delta: -28.79 },
    interactions: { value: 219, previous: 547, delta: -59.96 },
    likes: { value: 121, previous: 442, delta: -72.62 },
    comments: { value: 1, previous: 20, delta: -95 },
    shares: { value: 44, previous: 33, delta: 33.33 },
    saves: { value: 8, previous: 12, delta: -33.33 },
  },
};

export const MONTHLY_STORIES = {
  overview: {
    published: { value: 3, previous: 0, delta: 100 },
    views: { value: 1296, previous: 0, delta: 100 },
    reach: { value: 1019, previous: 0, delta: 100 },
    interactions: { value: 23, previous: 0, delta: 100 },
    replies: { value: 1, previous: 0, delta: 100 },
    shares: { value: 2, previous: 0, delta: 100 },
  },
  stories: [
    { date: "05/04/2026", views: 570, reach: 445, interactions: 11, retention: 80.67, shares: 1 },
    { date: "29/03/2026", views: 466, reach: 354, interactions: 8, retention: 74.58, shares: 1 },
    { date: "20/03/2026", views: 260, reach: 220, interactions: 4, retention: 57.73, shares: 0 },
  ],
};

export const AUDIENCE = {
  geo: [
    { city: "Curitiba, Parana", followers: 2434 },
    { city: "Pinhais, Parana", followers: 287 },
    { city: "Colombo, Parana", followers: 218 },
    { city: "Sao Paulo, SP", followers: 208 },
    { city: "Sao Jose dos Pinhais, Parana", followers: 170 },
    { city: "Piraquara, Parana", followers: 99 },
  ],
  gender: { female: 57.79, male: 42.21 },
  topAgeRanges: ["25-34", "35-44"],
};

// ── SEMESTRAL ───────────────────────────────────────────────────

export const SEMESTER_SUMMARY = {
  followers: 5172,
  views: { value: 3528365, previous: 421692, delta: 736.72 },
  reachTotal: { value: 69329, previous: 47683, delta: 45.4 },
  reachPaid: { value: 67167, previous: 43785, delta: 53.4 },
  reachOrganic: { value: 2162, previous: 3898, delta: -44.54 },
  profileVisits: { value: 11770, previous: 5488, delta: 114.47 },
  interactions: { value: 7516, previous: 777, delta: 867.31 },
};

export const SEMESTER_FEED = {
  overview: {
    posts: { value: 47, previous: 62, delta: -24.19 },
    reach: { value: 1956, previous: 628, delta: 211.46 },
    interactions: { value: 1023, previous: 180, delta: 468.33 },
    likes: { value: 617, previous: 130, delta: 374.62 },
    comments: { value: 25, previous: 0, delta: 100 },
    shares: { value: 144, previous: 21, delta: 585.71 },
    saves: { value: 47, previous: 8, delta: 487.5 },
  },
  topPosts: [
    { title: "Elegancia, conforto e tecnologia — AUMA", type: "Reels", views: 5354, reach: 2896, interactions: 256, engRate: 8.84, likes: 195, shares: 41 },
    { title: "Pre-Lancamento AUMA — empreendimento concebido para...", type: "Reels", views: 3954, reach: 2730, interactions: 91, engRate: 3.33, likes: 56, shares: 21 },
    { title: "Expansao com proposito, solidez com visao — Thal", type: "Reels", views: 5222, reach: 2444, interactions: 255, engRate: 10.43, likes: 227, shares: 12 },
    { title: "Nada e mais valioso do que a seguranca de quem...", type: "Reels", views: 3721, reach: 2204, interactions: 141, engRate: 6.40, likes: 119, shares: 10 },
    { title: "Duas decadas construindo mais do que empreendimentos", type: "Reels", views: 3539, reach: 2127, interactions: 198, engRate: 9.31, likes: 167, shares: 10 },
  ],
};

export const SEMESTER_REELS = {
  overview: {
    published: { value: 23, previous: 32, delta: -28.13 },
    interactions: { value: 3798, previous: 454, delta: 736.56 },
    likes: { value: 2837, previous: 289, delta: 881.66 },
    comments: { value: 163, previous: 20, delta: 715 },
    shares: { value: 348, previous: 62, delta: 461.29 },
    saves: { value: 55, previous: 18, delta: 205.56 },
    reach: { value: 1410, previous: 3672, delta: -61.6 },
  },
};

export const SEMESTER_STORIES = {
  overview: {
    published: { value: 21, previous: 0, delta: 100 },
    views: { value: 17066, previous: 0, delta: 100 },
    interactions: { value: 268, previous: 0, delta: 100 },
    shares: { value: 56, previous: 0, delta: 100 },
  },
  topStories: [
    { date: "25/11/2025", views: 1880, reach: 1303, retention: 95.24, interactions: 21, shares: 7 },
    { date: "26/11/2025", views: 1478, reach: 1044, retention: 97.99, interactions: 16, shares: 6 },
    { date: "25/11/2025", views: 1594, reach: 971, retention: 93.82, interactions: 20, shares: 7 },
    { date: "25/11/2025", views: 1283, reach: 886, retention: 92.55, interactions: 16, shares: 4 },
    { date: "25/11/2025", views: 1653, reach: 884, retention: 93.55, interactions: 28, shares: 7 },
    { date: "26/11/2025", views: 1380, reach: 863, retention: 97.91, interactions: 12, shares: 4 },
  ],
};

export const SEMESTER_COMPARISON = [
  { metric: "Visualizacoes totais", previous: 421692, current: 3528365, delta: 736.72 },
  { metric: "Interacoes totais", previous: 777, current: 7516, delta: 867.31 },
  { metric: "Visitas ao perfil", previous: 5488, current: 11770, delta: 114.47 },
  { metric: "Alcance total (30d)", previous: 47683, current: 69329, delta: 45.4 },
  { metric: "Alcance pago (30d)", previous: 43785, current: 67167, delta: 53.4 },
  { metric: "Publicacoes feed", previous: 62, current: 47, delta: -24.19 },
  { metric: "Reels publicados", previous: 32, current: 23, delta: -28.13 },
  { metric: "Interacoes em Reels", previous: 454, current: 3798, delta: 736.56 },
  { metric: "Curtidas em Reels", previous: 289, current: 2837, delta: 881.66 },
  { metric: "Compartilhamentos Reels", previous: 62, current: 348, delta: 461.29 },
  { metric: "Stories publicados", previous: 0, current: 21, deltaLabel: "Inauguracao" },
  { metric: "Visualizacoes Stories", previous: 0, current: 17066, deltaLabel: "Inauguracao" },
] as const;
