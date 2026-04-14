/** A single navigation item in the L1 sidebar. */
export interface NavGroupItem {
  readonly href: string;
  readonly label: string;
  readonly icon: string;
  readonly module: string;
}

/** A labeled group of navigation items (collapsible). */
export interface NavGroup {
  readonly label: string;
  readonly items: readonly NavGroupItem[];
}

/** Fixed top-level nav items — always visible, no collapsible group. */
export const PINNED_NAV_ITEMS: readonly NavGroupItem[] = [
  { href: "/servicos", label: "TBO Home", icon: "home", module: "dashboard" },
  { href: "/dashboard", label: "TBO HUB", icon: "layout-dashboard", module: "dashboard" },
  { href: "/chat", label: "Chat", icon: "message-square", module: "chat" },
  { href: "/atividades", label: "Atividades", icon: "activity", module: "atividades" },
  { href: "/favoritos", label: "Favoritos", icon: "bookmark", module: "favoritos" },
] as const;

/**
 * Main sidebar navigation groups.
 * Each item's `module` is checked against RBAC (canSee).
 * Sub-routes are accessed via ModuleCards inside each hub page.
 */
export const SIDEBAR_NAV_GROUPS: readonly NavGroup[] = [
  // ── TBO Projects (projetos & tarefas) ─────────────────────────────
  {
    label: "TBO Projects",
    items: [
      { href: "/projetos", label: "Projetos", icon: "briefcase", module: "projetos" },
      { href: "/tarefas", label: "Tarefas", icon: "list-checks", module: "tarefas" },
    ],
  },
  // ── Receita & Caixa (motor comercial + financeiro) ──────────────
  {
    label: "Receita & Caixa",
    items: [
      { href: "/comercial", label: "Pipeline", icon: "briefcase", module: "comercial" },
      { href: "/portfolio", label: "Portfolio", icon: "photo", module: "comercial" },
      { href: "/clientes", label: "Clientes", icon: "building-2", module: "clientes" },
      { href: "/contratos", label: "Contratos", icon: "file-text", module: "contratos" },
      { href: "/financeiro", label: "Financeiro", icon: "dollar-sign", module: "financeiro" },
      { href: "/compras", label: "Compras & Fornecedores", icon: "truck", module: "compras" },
    ],
  },
  // ── Pessoas (time & gestão de pessoas) ───────────────────────────
  {
    label: "Pessoas",
    items: [
      { href: "/pessoas", label: "Pessoas", icon: "users", module: "pessoas" },
    ],
  },
  // ── TBO Culture (identidade, rituais, OKRs, conhecimento) ──────
  {
    label: "TBO Culture",
    items: [
      { href: "/cultura", label: "Culture Hub", icon: "heart-handshake", module: "cultura" },
      { href: "/cultura/okrs", label: "OKRs", icon: "target", module: "okrs" },
      { href: "/cultura/conhecimento", label: "Conhecimento", icon: "book-marked", module: "conhecimento" },
      { href: "/cultura/blog", label: "Blog", icon: "file-text", module: "cultura" },
    ],
  },
  // ── TBO Rewards (reconhecimentos & recompensas) ─────────────────
  {
    label: "TBO Rewards",
    items: [
      { href: "/rewards", label: "Rewards Hub", icon: "gift", module: "cultura" },
      { href: "/rewards/reconhecimentos", label: "Reconhecimentos", icon: "award", module: "cultura" },
      { href: "/rewards/recompensas", label: "Recompensas", icon: "gift", module: "cultura" },
    ],
  },
  // ── Inteligência Estratégica (radar competitivo, mercado, dados) ──
  {
    label: "Inteligência Estratégica",
    items: [
      { href: "/mercado", label: "Radar de Mercado", icon: "radar", module: "mercado" },
      { href: "/mercado/catalogo", label: "Catálogo Regional", icon: "map-pin", module: "mercado" },
      { href: "/mercado/orulo", label: "Órulo (API Live)", icon: "building-2", module: "mercado" },
      { href: "/mercado/indicadores", label: "Indicadores", icon: "trending-up", module: "mercado" },
      { href: "/inteligencia", label: "AI Insights", icon: "lightbulb", module: "inteligencia" },
    ],
  },
  // ── Estratégia (marketing & relatórios) ─────────────────────────
  {
    label: "Estratégia",
    items: [
      { href: "/marketing", label: "Marketing", icon: "speakerphone", module: "marketing" },
      { href: "/relatorios", label: "Relatórios", icon: "bar-chart-3", module: "relatorios" },
    ],
  },
  // ── Intranet (serviços internos) ─────────────────────────────────
  {
    label: "Intranet",
    items: [
      { href: "/helpdesk", label: "IT Helpdesk", icon: "headset", module: "helpdesk" },
    ],
  },
  // ── Sistema (admin, CMS & configuração) ─────────────────────────
  {
    label: "Sistema",
    items: [
      { href: "/website-admin", label: "Website Admin", icon: "world", module: "website-admin" },
      { href: "/usuarios", label: "Usuários", icon: "users-cog", module: "usuarios" },
      { href: "/configuracoes", label: "Configurações", icon: "settings", module: "configuracoes" },
      { href: "/audit-log", label: "Audit Log", icon: "shield", module: "audit-log" },
      { href: "/changelog", label: "Changelog", icon: "history", module: "changelog" },
    ],
  },
] as const;

/** Footer nav items (always visible, outside collapsible groups). */
export const FOOTER_NAV_ITEMS = [] as const;
