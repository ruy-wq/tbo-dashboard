// Project status configuration — matches legacy TBO_QUADRO_PROJETOS._STATUS
export const PROJECT_STATUS = {
  em_andamento: {
    label: "Em Andamento",
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.12)",
    icon: "play-circle",
  },
  em_revisao: {
    label: "Em Revisão",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
    icon: "eye",
  },
  concluido: {
    label: "Concluído",
    color: "#22c55e",
    bg: "rgba(34,197,94,0.12)",
    icon: "check-circle-2",
  },
} as const;

export type ProjectStatusKey = keyof typeof PROJECT_STATUS;

// Project priority configuration (same levels as TASK_PRIORITY, applied to projects)
export const PROJECT_PRIORITY = {
  urgente: { label: "Urgente", color: "#ef4444", bg: "rgba(239,68,68,0.12)", sort: 0 },
  alta: { label: "Alta", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", sort: 1 },
  media: { label: "Média", color: "#3b82f6", bg: "rgba(59,130,246,0.12)", sort: 2 },
  baixa: { label: "Baixa", color: "#6b7280", bg: "rgba(107,114,128,0.12)", sort: 3 },
} as const;

export type ProjectPriorityKey = keyof typeof PROJECT_PRIORITY;

// Task status configuration — matches legacy TBO_TAREFAS statuses
export const TASK_STATUS = {
  pendente: { label: "Pendente", color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
  em_andamento: { label: "Em Andamento", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  revisao: { label: "Revisão", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  concluida: { label: "Concluída", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  bloqueada: { label: "Bloqueada", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  cancelada: { label: "Cancelada", color: "#9ca3af", bg: "rgba(156,163,175,0.12)" },
} as const;

export type TaskStatusKey = keyof typeof TASK_STATUS;

// Task priority configuration
export const TASK_PRIORITY = {
  urgente: { label: "Urgente", color: "#ef4444", bg: "rgba(239,68,68,0.12)", sort: 0 },
  alta: { label: "Alta", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", sort: 1 },
  media: { label: "Média", color: "#3b82f6", bg: "rgba(59,130,246,0.12)", sort: 2 },
  baixa: { label: "Baixa", color: "#6b7280", bg: "rgba(107,114,128,0.12)", sort: 3 },
} as const;

export type TaskPriorityKey = keyof typeof TASK_PRIORITY;

// Task approval status configuration (T01)
export const TASK_APPROVAL_STATUS = {
  none: { label: "Sem aprovação", color: "#9ca3af", bg: "rgba(156,163,175,0.12)" },
  pending: { label: "Pendente", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  approved: { label: "Aprovado", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  changes_requested: { label: "Revisão", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
} as const;

export type TaskApprovalStatusKey = keyof typeof TASK_APPROVAL_STATUS;

// Task recurrence options (T04)
export const TASK_RECURRENCE = {
  none: { label: "Sem repetição", icon: "x" },
  daily: { label: "Diariamente", icon: "repeat" },
  weekly: { label: "Semanalmente", icon: "repeat" },
  monthly: { label: "Mensalmente", icon: "repeat" },
} as const;

export type TaskRecurrenceKey = keyof typeof TASK_RECURRENCE;

// Project health status (A07 — calculated client-side)
export const PROJECT_HEALTH = {
  on_track: { label: "No prazo", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  at_risk: { label: "Em risco", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  off_track: { label: "Atrasado", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
} as const;

export type ProjectHealthKey = keyof typeof PROJECT_HEALTH;

/** Compute project health from task stats. */
export function computeProjectHealth(stats: {
  total: number;
  overdue: number;
}): ProjectHealthKey {
  if (stats.total === 0) return "on_track";
  const pct = stats.overdue / stats.total;
  if (pct >= 0.5) return "off_track";
  if (pct >= 0.2) return "at_risk";
  return "on_track";
}

// BU (Business Unit) list — ordered for tab display
export const BU_LIST = ["Digital 3D", "Branding", "Marketing", "Audiovisual", "Gamificação", "Interiores"] as const;
export type BUKey = (typeof BU_LIST)[number];

// BU badge colors — matches legacy TBO_QUADRO_PROJETOS._BU_COLORS
export const BU_COLORS: Record<string, { bg: string; color: string; icon: string }> = {
  "Digital 3D": { bg: "#ede9fe", color: "#5b21b6", icon: "cube" },
  Branding: { bg: "#fef3c7", color: "#92400e", icon: "palette" },
  Marketing: { bg: "#d1fae5", color: "#065f46", icon: "speakerphone" },
  Audiovisual: { bg: "#fce7f3", color: "#9d174d", icon: "movie" },
  Interiores: { bg: "#e0f2fe", color: "#0c4a6e", icon: "armchair" },
};

// BU workflow method pages — static HTML in /metodo/
export const BU_METHOD_PAGES: Record<string, { slug: string; label: string }> = {
  "Digital 3D": { slug: "d3d", label: "Fluxo de Projeto — Imagens 3D" },
  Branding: { slug: "branding", label: "Fluxo de Projeto — Branding" },
  Marketing: { slug: "marketing", label: "Fluxo de Projeto — Marketing ON/OFF" },
  Audiovisual: { slug: "audiovisual", label: "Fluxo de Serviços — Audiovisual" },
};

// BU default phases — used by portal Track Project when no DB-tracked stages exist
export const BU_DEFAULT_PHASES: Record<string, { key: string; label: string }[]> = {
  "Digital 3D": [
    { key: "briefing", label: "Briefing" },
    { key: "direcao_visual", label: "Direção Visual" },
    { key: "modelagem", label: "Modelagem 3D" },
    { key: "clay_render", label: "Clay Render" },
    { key: "emissao", label: "Emissão Inicial" },
    { key: "revisoes", label: "Revisões" },
    { key: "entrega", label: "Entrega Final" },
  ],
  Branding: [
    { key: "briefing", label: "Briefing" },
    { key: "pesquisa", label: "Pesquisa" },
    { key: "conceito", label: "Conceito" },
    { key: "design", label: "Design" },
    { key: "revisao", label: "Revisão" },
    { key: "entrega", label: "Entrega" },
  ],
  Marketing: [
    { key: "briefing", label: "Briefing" },
    { key: "estrategia", label: "Estratégia" },
    { key: "producao", label: "Produção" },
    { key: "revisao", label: "Revisão" },
    { key: "publicacao", label: "Publicação" },
  ],
  Audiovisual: [
    { key: "briefing", label: "Briefing" },
    { key: "pre_producao", label: "Pré-Produção" },
    { key: "captacao", label: "Captação" },
    { key: "pos_producao", label: "Pós-Produção" },
    { key: "revisao", label: "Revisão" },
    { key: "entrega", label: "Entrega" },
  ],
};

// Lançamento Imobiliário is cross-BU (not tied to a single BU)
export const LANCAMENTO_METHOD_PAGE = { slug: "lancamento", label: "Jornada do Lançamento Imobiliário" };

// People status configuration
export const PEOPLE_STATUS = {
  active: { label: "Ativo", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  inactive: { label: "Inativo", color: "#9ca3af", bg: "rgba(156,163,175,0.12)" },
  vacation: { label: "Férias", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  away: { label: "Afastado", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  onboarding: { label: "Onboarding", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
  offboarding: { label: "Offboarding", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
} as const;

export type PeopleStatusKey = keyof typeof PEOPLE_STATUS;

// Client status configuration
export const CLIENT_STATUS = {
  lead: { label: "Lead", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
  prospect: { label: "Prospect", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  ativo: { label: "Ativo", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  vip: { label: "VIP", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  inativo: { label: "Inativo", color: "#9ca3af", bg: "rgba(156,163,175,0.12)" },
} as const;

export type ClientStatusKey = keyof typeof CLIENT_STATUS;

// Client interaction types
export const INTERACTION_TYPES = {
  email: { label: "E-mail", icon: "mail" },
  reuniao: { label: "Reunião", icon: "video" },
  call: { label: "Ligação", icon: "phone" },
  whatsapp: { label: "WhatsApp", icon: "message-circle" },
  presencial: { label: "Presencial", icon: "users" },
} as const;

export type InteractionTypeKey = keyof typeof INTERACTION_TYPES;

// Contract status configuration (aligned with DB check constraint)
export const CONTRACT_STATUS = {
  draft: { label: "Rascunho", color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
  active: { label: "Ativo", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  expired: { label: "Expirado", color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
  cancelled: { label: "Cancelado", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  renewed: { label: "Renovado", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
} as const;

export type ContractStatusKey = keyof typeof CONTRACT_STATUS;

// Contract category configuration
export const CONTRACT_CATEGORY = {
  cliente: { label: "Cliente", color: "#f97316", bg: "rgba(249,115,22,0.12)" },
  equipe: { label: "Equipe", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
  fornecedor: { label: "Fornecedor", color: "#06b6d4", bg: "rgba(6,182,212,0.12)" },
  distrato: { label: "Distrato", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
} as const;

export type ContractCategoryKey = keyof typeof CONTRACT_CATEGORY;

// Contract type configuration (DB check constraint)
export const CONTRACT_TYPE = {
  pj: { label: "PJ" },
  nda: { label: "NDA" },
  aditivo: { label: "Aditivo" },
  freelancer: { label: "Freelancer" },
  clt: { label: "CLT" },
  outro: { label: "Outro" },
} as const;

export type ContractTypeKey = keyof typeof CONTRACT_TYPE;

// Tab configuration for contracts page
export const CONTRACT_TABS = [
  { key: "all", label: "Visão Geral", categories: undefined },
  { key: "clientes", label: "Clientes", categories: ["cliente"] as const },
  { key: "terceirizados", label: "Terceirizados", categories: ["fornecedor"] as const },
  { key: "colaboradores", label: "Colaboradores", categories: ["equipe"] as const },
] as const;

// ─── Contract advanced filter options ────────────────────────────────
export const CONTRACT_RENEWAL_WINDOWS = [
  { value: 30, label: "30 dias" },
  { value: 60, label: "60 dias" },
  { value: 90, label: "90 dias" },
] as const;

export const CONTRACT_SORT_OPTIONS = [
  { value: "created_desc", label: "Data de criação (recente)" },
  { value: "created_asc", label: "Data de criação (antiga)" },
  { value: "end_date_asc", label: "Vencimento (mais próximo)" },
  { value: "end_date_desc", label: "Vencimento (mais distante)" },
  { value: "value_desc", label: "Valor (maior)" },
  { value: "value_asc", label: "Valor (menor)" },
  { value: "title_asc", label: "Nome (A → Z)" },
  { value: "title_desc", label: "Nome (Z → A)" },
] as const;

export type ContractSortValue = (typeof CONTRACT_SORT_OPTIONS)[number]["value"];

/** Dynamic status filters — computed client-side from DB fields */
export const CONTRACT_DYNAMIC_STATUS = {
  awaiting_signature: {
    label: "Aguardando Assinatura",
    color: "#eab308",
    bg: "rgba(234,179,8,0.12)",
    match: (c: { status: string | null; file_url: string | null }) =>
      c.status === "draft" && !c.file_url,
  },
  legal_review: {
    label: "Em Revisão Jurídica",
    color: "#a855f7",
    bg: "rgba(168,85,247,0.12)",
    match: (c: { status: string | null; file_url: string | null }) =>
      c.status === "draft" && !!c.file_url,
  },
  archived: {
    label: "Arquivado",
    color: "#64748b",
    bg: "rgba(100,116,139,0.12)",
    match: (c: { status: string | null }) =>
      c.status === "expired" || c.status === "cancelled",
  },
} as const;

export type ContractDynamicStatusKey = keyof typeof CONTRACT_DYNAMIC_STATUS;

// ─── Deal pipeline stages (CRM) ──────────────────────────────────────
export const DEAL_STAGES = {
  lead: { label: "Lead", color: "#6366f1", bg: "rgba(99,102,241,0.12)", order: 0 },
  qualificacao: { label: "Qualificação", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", order: 1 },
  proposta: { label: "Proposta Enviada", color: "#3b82f6", bg: "rgba(59,130,246,0.12)", order: 2 },
  negociacao: { label: "Negociação", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)", order: 3 },
  fechado_ganho: { label: "Fechado Ganho", color: "#22c55e", bg: "rgba(34,197,94,0.12)", order: 4 },
  fechado_perdido: { label: "Fechado Perdido", color: "#ef4444", bg: "rgba(239,68,68,0.12)", order: 5 },
} as const;

export type DealStageKey = keyof typeof DEAL_STAGES;

export const DEAL_SOURCES = ["site", "indicacao", "linkedin", "evento", "outbound", "outro"] as const;

// ─── Deal follow-up cadence (max days without activity per stage) ───
export const STAGE_CADENCE: Record<DealStageKey, number> = {
  lead: 5,
  qualificacao: 3,
  proposta: 5,
  negociacao: 2,
  fechado_ganho: 999,
  fechado_perdido: 999,
};

// ─── Loss reasons ───────────────────────────────────────────────────
export const LOSS_REASONS = [
  { value: "preco", label: "Preço acima do esperado" },
  { value: "timing", label: "Timing inadequado" },
  { value: "concorrencia", label: "Concorrência" },
  { value: "escopo", label: "Escopo não atendido" },
  { value: "budget", label: "Budget insuficiente" },
  { value: "sem_resposta", label: "Sem resposta do cliente" },
  { value: "outro", label: "Outro" },
] as const;

export type LossReasonValue = (typeof LOSS_REASONS)[number]["value"];

// ─── Lead scoring thresholds ────────────────────────────────────────
export const SCORE_THRESHOLDS = {
  hot: 70,
  warm: 40,
} as const;

// ─── OKR status / levels ─────────────────────────────────────────────
export const OKR_STATUS = {
  on_track: { label: "No caminho", color: "#16a34a", bg: "rgba(34,197,94,0.1)" },
  attention: { label: "Atenção", color: "#d97706", bg: "rgba(245,158,11,0.1)" },
  at_risk: { label: "Em risco", color: "#dc2626", bg: "rgba(239,68,68,0.1)" },
  behind: { label: "Atrasado", color: "#dc2626", bg: "rgba(239,68,68,0.1)" },
} as const;

export type OkrStatusKey = keyof typeof OKR_STATUS;

export const OKR_LEVELS = {
  company: { label: "Empresa", color: "#7c3aed", bg: "rgba(139,92,246,0.1)" },
  directorate: { label: "Diretoria", color: "#2563eb", bg: "rgba(59,130,246,0.1)" },
  squad: { label: "Squad", color: "#0891b2", bg: "rgba(8,145,178,0.1)" },
  individual: { label: "Individual", color: "#16a34a", bg: "rgba(34,197,94,0.1)" },
} as const;

export type OkrLevelKey = keyof typeof OKR_LEVELS;

// ─── Demand status configuration (legacy demands table) ─────────────
export const DEMAND_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  Briefing: { label: "Briefing", color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
  Aprovado: { label: "Aprovado", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  Cronograma: { label: "Cronograma", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
  "Apresentação": { label: "Apresentação", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  Desenvolvimento: { label: "Desenvolvimento", color: "#0ea5e9", bg: "rgba(14,165,233,0.12)" },
  "Revisão Interna": { label: "Revisão Interna", color: "#d97706", bg: "rgba(217,119,6,0.12)" },
  Pausado: { label: "Pausado", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  "Concluído": { label: "Concluído", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  Concluido: { label: "Concluído", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
};

// Demand priority configuration
export const DEMAND_PRIORITY: Record<string, { label: string; color: string }> = {
  urgente: { label: "Urgente", color: "#ef4444" },
  alta: { label: "Alta", color: "#f59e0b" },
  media: { label: "Média", color: "#3b82f6" },
  baixa: { label: "Baixa", color: "#6b7280" },
};

// Board columns for demands (status order)
export const DEMAND_BOARD_COLUMNS = [
  "Briefing",
  "Aprovado",
  "Cronograma",
  "Desenvolvimento",
  "Apresentação",
  "Revisão Interna",
  "Pausado",
  "Concluído",
] as const;

// Navigation items for the sidebar
export const NAV_ITEMS = [
  { href: "/servicos", label: "Hub de Servicos", icon: "apps", module: "dashboard" },
  { href: "/dashboard", label: "TBO HUB", icon: "layout-dashboard", module: "dashboard" },
  { href: "/projetos", label: "Projetos", icon: "folder-kanban", module: "projetos" },
  { href: "/tarefas", label: "Minhas Tarefas", icon: "list-checks", module: "tarefas" },
  { href: "/pessoas", label: "Pessoas", icon: "users", module: "pessoas" },
  { href: "/agenda", label: "Agenda", icon: "calendar", module: "agenda" },
  { href: "/financeiro", label: "Financeiro", icon: "dollar-sign", module: "financeiro" },
  { href: "/clientes", label: "Clientes", icon: "building-2", module: "clientes" },
  { href: "/contratos", label: "Contratos", icon: "file-text", module: "contratos" },
  { href: "/comercial", label: "Comercial", icon: "briefcase", module: "comercial" },
  { href: "/mercado", label: "Inteligência Estratégica", icon: "radar", module: "mercado" },
  { href: "/cultura/okrs", label: "OKRs", icon: "target", module: "okrs" },
  { href: "/chat", label: "Chat", icon: "message-square", module: "chat" },
  { href: "/cultura", label: "Cultura", icon: "heart-handshake", module: "cultura" },
  { href: "/rewards", label: "Rewards", icon: "gift", module: "cultura" },
  { href: "/marketing", label: "Marketing", icon: "speakerphone", module: "marketing" },
  { href: "/relatorios", label: "Relatórios", icon: "bar-chart-3", module: "relatorios" },
  { href: "/alerts", label: "Alertas", icon: "bell", module: "alerts" },
  { href: "/portal-cliente", label: "Portal Cliente", icon: "globe", module: "portal-cliente" },
  { href: "/conteudo", label: "Conteúdo", icon: "pen-tool", module: "conteudo" },
  { href: "/revisoes", label: "Revisões", icon: "check-circle", module: "revisoes" },
  { href: "/inteligencia", label: "Inteligência", icon: "lightbulb", module: "inteligencia" },
  { href: "/diretoria", label: "Diretoria", icon: "presentation", module: "diretoria" },
  { href: "/permissoes", label: "Permissões", icon: "lock", module: "permissoes" },
  { href: "/admin", label: "Admin", icon: "shield", module: "admin" },
  { href: "/system-health", label: "System Health", icon: "activity", module: "system-health" },
  { href: "/changelog", label: "Changelog", icon: "history", module: "changelog" },
  { href: "/configuracoes", label: "Configurações", icon: "settings", module: "configuracoes" },
] as const;

// Settings tabs
export const SETTINGS_TABS = [
  { id: "perfil", label: "Perfil & Conta", icon: "user", group: "pessoal" },
  { id: "aparencia", label: "Aparência", icon: "palette", group: "pessoal" },
  { id: "notificacoes", label: "Notificações", icon: "bell", group: "pessoal" },
  { id: "workspace", label: "Workspace", icon: "building", group: "admin" },
  { id: "integracoes", label: "Integrações", icon: "plug", group: "admin" },
  { id: "usuarios", label: "Usuários", icon: "users", group: "admin" },
  { id: "audit", label: "Logs de Auditoria", icon: "shield", group: "admin" },
] as const;

export type SettingsTabId = (typeof SETTINGS_TABS)[number]["id"];

// ─── Custom Field types ───────────────────────────────────────────────
export const CUSTOM_FIELD_TYPES = {
  text: { label: "Texto", icon: "type" },
  number: { label: "Numero", icon: "hash" },
  date: { label: "Data", icon: "calendar" },
  select: { label: "Select", icon: "list" },
  multi_select: { label: "Multi Select", icon: "list-checks" },
  checkbox: { label: "Checkbox", icon: "check-square" },
  url: { label: "URL", icon: "link" },
} as const;

export type CustomFieldTypeKey = keyof typeof CUSTOM_FIELD_TYPES;

// ─── Activity action labels ──────────────────────────────────────────
export const ACTIVITY_ACTIONS: Record<string, string> = {
  created: "criou",
  updated: "atualizou",
  deleted: "excluiu",
  moved: "moveu",
  commented: "comentou",
  attached: "anexou",
  assigned: "atribuiu",
  unassigned: "removeu atribuicao",
  completed: "concluiu",
  reopened: "reabriu",
};

// ─── Cultura categories ──────────────────────────────────────────────
export const CULTURA_CATEGORIES = {
  pilar: { label: "Pilares", icon: "columns-3", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
  ritual: { label: "Rituais", icon: "repeat", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  politica: { label: "Politicas", icon: "shield", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  reconhecimento: { label: "Reconhecimentos", icon: "award", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  valor: { label: "Valores", icon: "heart", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  documento: { label: "Documentos", icon: "file-text", color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
  manual: { label: "Manual", icon: "book-open", color: "#0ea5e9", bg: "rgba(14,165,233,0.12)" },
} as const;

export type CulturaCategoryKey = keyof typeof CULTURA_CATEGORIES;

// ─── TBO Culture hub sidebar navigation ─────────────────────────────
export const CULTURA_NAV_ITEMS = [
  { href: "/cultura/pilares", label: "Valores & Pilares", icon: "heart" },
  { href: "/cultura/rituais", label: "Rituais", icon: "repeat" },
  { href: "/cultura/reconhecimentos", label: "Reconhecimentos", icon: "award" },
  { href: "/cultura/recompensas", label: "Recompensas", icon: "gift" },
  { href: "/cultura/okrs", label: "OKRs", icon: "target" },
  { href: "/cultura/conhecimento", label: "Conhecimento", icon: "book-marked" },
  { href: "/cultura/blog", label: "Blog", icon: "article" },
  { href: "/cultura/decisoes", label: "Decisões", icon: "scale" },
  { href: "/cultura/academy", label: "TBO Academy", icon: "school" },
  { href: "/cultura/calendario-rh", label: "Calendário RH", icon: "calendar-heart" },
  { href: "/cultura/pesquisa-clima", label: "Pesquisa de Clima", icon: "clipboard-check" },
  { href: "/cultura/diagnostico", label: "Diagnóstico", icon: "stethoscope" },
  { href: "/cultura/analytics", label: "Analytics", icon: "chart-bar", min_role: "admin" as const },
] as const;

// ─── TBO Company Values ─────────────────────────────────────────────
export const TBO_VALUES = [
  { id: "ownership", name: "Ownership", emoji: "🏆", color: "#f59e0b" },
  { id: "excelencia", name: "Excelência", emoji: "⭐", color: "#8b5cf6" },
  { id: "colaboracao", name: "Colaboração", emoji: "🤝", color: "#3b82f6" },
  { id: "inovacao", name: "Inovação", emoji: "💡", color: "#22c55e" },
  { id: "transparencia", name: "Transparência", emoji: "🔍", color: "#0ea5e9" },
  { id: "cliente", name: "Foco no Cliente", emoji: "❤️", color: "#ef4444" },
] as const;

// ─── Recognition sources ────────────────────────────────────────────
export const RECOGNITION_SOURCES = {
  manual: { label: "Manual", color: "#3b82f6" },
  fireflies: { label: "Fireflies (IA)", color: "#8b5cf6" },
  slack: { label: "Slack", color: "#e01e5a" },
} as const;

// ─── Reward types ───────────────────────────────────────────────────
export const REWARD_TYPES = {
  experiencia: { label: "Experiência", icon: "sparkles", color: "#8b5cf6" },
  produto: { label: "Produto", icon: "package", color: "#3b82f6" },
  beneficio: { label: "Benefício", icon: "heart", color: "#ef4444" },
  folga: { label: "Day Off", icon: "calendar", color: "#22c55e" },
  digital: { label: "Digital", icon: "monitor", color: "#8b5cf6" },
  "bem-estar": { label: "Bem-estar", icon: "heart", color: "#ec4899" },
  aprendizado: { label: "Aprendizado", icon: "graduation-cap", color: "#f59e0b" },
  gastronomia: { label: "Gastronomia", icon: "utensils", color: "#ef4444" },
  lifestyle: { label: "Lifestyle", icon: "palette", color: "#d946ef" },
  liberdade: { label: "Liberdade", icon: "sun", color: "#22c55e" },
  saude: { label: "Saúde", icon: "activity", color: "#14b8a6" },
  lazer: { label: "Lazer", icon: "film", color: "#f97316" },
  branding: { label: "Branding", icon: "award", color: "#0ea5e9" },
  utilidade: { label: "Utilidade", icon: "credit-card", color: "#64748b" },
  cultura: { label: "Cultura", icon: "book-open", color: "#a855f7" },
  mimo: { label: "Mimo", icon: "coffee", color: "#fb923c" },
} as const;

// ─── Recognition tiers ──────────────────────────────────────────────
export const RECOGNITION_TIERS = [
  { name: "Bronze", minPoints: 0, maxPoints: 49, color: "#cd7f32", icon: "🥉" },
  { name: "Prata", minPoints: 50, maxPoints: 149, color: "#c0c0c0", icon: "🥈" },
  { name: "Ouro", minPoints: 150, maxPoints: 299, color: "#ffd700", icon: "🥇" },
  { name: "Diamante", minPoints: 300, maxPoints: Infinity, color: "#b9f2ff", icon: "💎" },
] as const;

// ─── Cultura item status ─────────────────────────────────────────────
export const CULTURA_STATUS = {
  draft: { label: "Rascunho", color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
  published: { label: "Publicado", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  archived: { label: "Arquivado", color: "#9ca3af", bg: "rgba(156,163,175,0.12)" },
} as const;

export type CulturaStatusKey = keyof typeof CULTURA_STATUS;

// ─── Policy categories ───────────────────────────────────────────────
export const POLICY_CATEGORIES = {
  etica: { label: "Etica", icon: "scale", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
  pessoas: { label: "Pessoas", icon: "users", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  comercial: { label: "Comercial", icon: "briefcase", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  governanca: { label: "Governanca", icon: "landmark", color: "#0ea5e9", bg: "rgba(14,165,233,0.12)" },
  compliance: { label: "Compliance", icon: "shield-check", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
} as const;

export type PolicyCategoryKey = keyof typeof POLICY_CATEGORIES;

// ─── Policy status ──────────────────────────────────────────────────
export const POLICY_STATUS = {
  draft: { label: "Rascunho", color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
  active: { label: "Ativa", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  archived: { label: "Arquivada", color: "#9ca3af", bg: "rgba(156,163,175,0.12)" },
} as const;

export type PolicyStatusKey = keyof typeof POLICY_STATUS;

// ─── Changelog tags ───────────────────────────────────────────────────
export const CHANGELOG_TAGS = {
  feature: { label: "Nova Funcionalidade", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  fix: { label: "Correção", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  improvement: { label: "Melhoria", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  breaking: { label: "Breaking Change", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
} as const;

export type ChangelogTagKey = keyof typeof CHANGELOG_TAGS;


// ─── Service catalog configuration ──────────────────────────────────
export const SERVICE_TYPE = {
  fee_mensal: { label: "Fee Mensal", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
  projeto: { label: "Projeto", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  hora: { label: "Hora", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  pacote: { label: "Pacote", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
} as const;

export type ServiceTypeKey = keyof typeof SERVICE_TYPE;

export const SERVICE_STATUS = {
  active: { label: "Ativo", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  draft: { label: "Rascunho", color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
  archived: { label: "Arquivado", color: "#9ca3af", bg: "rgba(156,163,175,0.12)" },
} as const;

export type ServiceStatusKey = keyof typeof SERVICE_STATUS;

export const SERVICE_UNIT = {
  unidade: { label: "Unidade", short: "un" },
  hora: { label: "Hora", short: "h" },
  mes: { label: "Mes", short: "/mes" },
  pacote: { label: "Pacote", short: "pct" },
  projeto: { label: "Projeto", short: "proj" },
} as const;

export type ServiceUnitKey = keyof typeof SERVICE_UNIT;

// ─── Module sub-navigation items (L2 sidebar) ──────────────────────
// Each module that has an L2 sidebar defines its nav items here.
// Pattern follows CULTURA_NAV_ITEMS: { href, label, icon, min_role? }

export type SubNavItem = {
  readonly href: string;
  readonly label: string;
  readonly icon: string;
  readonly min_role?: "admin" | "lider";
};

export const TAREFAS_NAV_ITEMS: readonly SubNavItem[] = [
  { href: "/tarefas", label: "Minhas Tarefas", icon: "user-check" },
  { href: "/tarefas/todas", label: "Todas as Tarefas", icon: "list-check" },
] as const;

export const PROJETOS_NAV_ITEMS: readonly SubNavItem[] = [
  { href: "/projetos", label: "Visao Geral", icon: "home" },
  { href: "/projetos/board", label: "Board", icon: "layout-kanban" },
  { href: "/projetos/lista", label: "Lista", icon: "list" },
  { href: "/projetos/gantt", label: "Gantt", icon: "chart-gantt" },
  { href: "/projetos/timeline", label: "Timeline", icon: "clock" },
  { href: "/projetos/calendario", label: "Calendario", icon: "calendar" },
  { href: "/projetos/portfolio", label: "Portfolio", icon: "chart-pie" },
  { href: "/projetos/workload", label: "Workload", icon: "users" },
  { href: "/projetos/arquivos", label: "Arquivos", icon: "folder" },
  { href: "/projetos/fluxo-3d", label: "Fluxo 3D", icon: "cube" },
  { href: "/projetos/templates", label: "Templates", icon: "copy" },
  { href: "/projetos/configuracoes", label: "Configuracoes", icon: "settings", min_role: "admin" },
] as const;

export const PESSOAS_NAV_ITEMS: readonly SubNavItem[] = [
  { href: "/pessoas/colaboradores", label: "Colaboradores", icon: "users" },
  { href: "/pessoas/organograma", label: "Organograma", icon: "git-branch" },
  { href: "/pessoas/1on1", label: "1:1", icon: "message-square" },
  { href: "/pessoas/carreira", label: "Carreira", icon: "trending-up" },
  { href: "/pessoas/pdi", label: "PDI", icon: "target" },
  { href: "/pessoas/performance", label: "Performance", icon: "activity" },
  { href: "/pessoas/timeline", label: "Timeline", icon: "activity" },
  { href: "/pessoas/timesheet", label: "Timesheet", icon: "clock" },
  { href: "/pessoas/alocacao", label: "Alocação", icon: "calendar-range" },
  { href: "/pessoas/custo-hora", label: "Custo/Hora", icon: "calculator" },
] as const;

export const FINANCEIRO_NAV_ITEMS: readonly SubNavItem[] = [
  { href: "/financeiro/operacional", label: "Operacional", icon: "activity" },
  { href: "/financeiro/performance", label: "Performance", icon: "trending-up" },
  { href: "/financeiro/fluxo-caixa", label: "Fluxo de Caixa", icon: "trending-up" },
  { href: "/financeiro/contas", label: "Contas", icon: "file-warning" },
  { href: "/financeiro/conciliacao", label: "Conciliação", icon: "git-compare" },
  { href: "/financeiro/boletos", label: "Boletos", icon: "receipt" },
  { href: "/financeiro/fiscal", label: "Fiscal", icon: "file-check-2" },
  { href: "/financeiro/dre", label: "DRE", icon: "table-2" },
  { href: "/financeiro/transacoes", label: "Transações", icon: "list" },
  { href: "/financeiro/recorrentes", label: "Recorrentes", icon: "repeat" },
] as const;

export const COMERCIAL_NAV_ITEMS: readonly SubNavItem[] = [
  { href: "/comercial/leads", label: "Leads", icon: "user-plus" },
  { href: "/comercial/propostas", label: "Propostas", icon: "file-text" },
  { href: "/comercial/servicos", label: "Serviços", icon: "package" },
  { href: "/comercial/precificacao", label: "Precificação", icon: "calculator" },
  { href: "/comercial/atividades", label: "Atividades", icon: "activity" },
  { href: "/comercial/demandas", label: "Demandas", icon: "inbox" },
  { href: "/comercial/relatorios", label: "Relatórios", icon: "bar-chart-3" },
] as const;


export const OKRS_NAV_ITEMS: readonly SubNavItem[] = [
  { href: "/cultura/okrs/company", label: "Company OKRs", icon: "building" },
  { href: "/cultura/okrs/teams", label: "Teams", icon: "users" },
  { href: "/cultura/okrs/individuais", label: "Individuais", icon: "user" },
  { href: "/cultura/okrs/check-ins", label: "Check-ins", icon: "check-circle" },
  { href: "/cultura/okrs/dashboard", label: "Dashboard", icon: "bar-chart-3" },
  { href: "/cultura/okrs/configuracoes", label: "Configurações", icon: "settings" },
] as const;

export const MERCADO_NAV_ITEMS: readonly SubNavItem[] = [
  { href: "/mercado/censo", label: "Censo IBGE", icon: "map-pin" },
  { href: "/mercado/lancamentos", label: "Lançamentos", icon: "building-2" },
  { href: "/mercado/indicadores", label: "Indicadores", icon: "trending-up" },
] as const;

// ─── Marketing module ───────────────────────────────────────────────

export const MARKETING_CAMPAIGN_STATUS = {
  planejamento: { label: "Planejamento", color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
  briefing: { label: "Briefing", color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
  em_producao: { label: "Em Producao", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  ativa: { label: "Ativa", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  pausada: { label: "Pausada", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  finalizada: { label: "Finalizada", color: "#9ca3af", bg: "rgba(156,163,175,0.12)" },
  cancelada: { label: "Cancelada", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
} as const;

export type MarketingCampaignStatusKey = keyof typeof MARKETING_CAMPAIGN_STATUS;

export const MARKETING_CONTENT_STATUS = {
  ideia: { label: "Ideia", color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
  briefing: { label: "Briefing", color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
  em_producao: { label: "Em Producao", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  revisao: { label: "Revisao", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  aprovado: { label: "Aprovado", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  agendado: { label: "Agendado", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
  publicado: { label: "Publicado", color: "#0ea5e9", bg: "rgba(14,165,233,0.12)" },
  arquivado: { label: "Arquivado", color: "#9ca3af", bg: "rgba(156,163,175,0.12)" },
} as const;

export type MarketingContentStatusKey = keyof typeof MARKETING_CONTENT_STATUS;

export const EMAIL_CAMPAIGN_STATUS = {
  draft: { label: "Rascunho", color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
  scheduled: { label: "Agendada", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
  sending: { label: "Enviando", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  sent: { label: "Enviada", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  paused: { label: "Pausada", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  cancelled: { label: "Cancelada", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
} as const;

export type EmailCampaignStatusKey = keyof typeof EMAIL_CAMPAIGN_STATUS;

export const MARKETING_NAV_ITEMS: readonly SubNavItem[] = [
  { href: "/marketing/campanhas", label: "Campanhas", icon: "speakerphone" },
  { href: "/marketing/conteudo", label: "Conteúdo", icon: "pencil" },
  { href: "/marketing/newsletter", label: "Newsletter", icon: "mail" },
  { href: "/marketing/redes-sociais", label: "Redes Sociais", icon: "brand-instagram" },
  { href: "/marketing/analytics", label: "Analytics", icon: "chart-bar", min_role: "admin" },
] as const;

// ─── Blog ────────────────────────────────────────────────────
export const BLOG_POST_STATUS = {
  rascunho: { label: "Rascunho", color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
  revisao: { label: "Revisao", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  publicado: { label: "Publicado", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  arquivado: { label: "Arquivado", color: "#9ca3af", bg: "rgba(156,163,175,0.12)" },
} as const;

export type BlogPostStatusKey = keyof typeof BLOG_POST_STATUS;

// ─── Contratos (promoted to full module) ──────────────────────────
export const CONTRATOS_NAV_ITEMS: readonly SubNavItem[] = [
  { href: "/contratos/ativos", label: "Ativos", icon: "file-check-2" },
  { href: "/contratos/renovacoes", label: "Renovações & Aditivos", icon: "refresh-cw" },
  { href: "/contratos/modelos", label: "Modelos", icon: "copy" },
  { href: "/contratos/alertas", label: "Alertas", icon: "bell" },
] as const;

// ─── Compras & Fornecedores ───────────────────────────────────────
export const COMPRAS_NAV_ITEMS: readonly SubNavItem[] = [
  { href: "/compras/fornecedores", label: "Fornecedores", icon: "truck" },
  { href: "/compras/orcamentos", label: "Orçamentos", icon: "file-text" },
  { href: "/compras/aprovacoes", label: "Aprovações", icon: "check-circle" },
  { href: "/compras/historico", label: "Histórico", icon: "history" },
] as const;

// ─── Ativos & Acervo ──────────────────────────────────────────────
export const ATIVOS_NAV_ITEMS: readonly SubNavItem[] = [
  { href: "/ativos/equipamentos", label: "Equipamentos", icon: "monitor" },
  { href: "/ativos/licencas", label: "Licenças", icon: "key" },
  { href: "/ativos/acervo", label: "Acervo Digital", icon: "image" },
] as const;

// ─── Base de Conhecimento ─────────────────────────────────────────
export const SOPS_NAV_ITEMS: readonly SubNavItem[] = [
  { href: "/cultura/conhecimento/sops/digital-3d", label: "Digital 3D", icon: "cube" },
  { href: "/cultura/conhecimento/sops/branding", label: "Branding", icon: "palette" },
  { href: "/cultura/conhecimento/sops/marketing", label: "Marketing", icon: "speakerphone" },
  { href: "/cultura/conhecimento/sops/audiovisual", label: "Audiovisual", icon: "video" },
  { href: "/cultura/conhecimento/sops/gamificacao", label: "Gamificação", icon: "device-gamepad-2" },
  { href: "/cultura/conhecimento/sops/operacoes", label: "Operações", icon: "settings" },
  { href: "/cultura/conhecimento/sops/atendimento", label: "Atendimento", icon: "headset" },
  { href: "/cultura/conhecimento/sops/comercial", label: "Comercial", icon: "chart-line" },
  { href: "/cultura/conhecimento/sops/financeiro", label: "Financeiro", icon: "currency-dollar" },
  { href: "/cultura/conhecimento/sops/recursos-humanos", label: "RH", icon: "users" },
  { href: "/cultura/conhecimento/sops/relacionamentos", label: "Relacionamentos", icon: "heart-handshake" },
  { href: "/cultura/conhecimento/sops/politicas", label: "Políticas", icon: "shield-check" },
] as const;

export const KNOWLEDGE_BASE_NAV_ITEMS = {
  sops: SOPS_NAV_ITEMS,
  templates: { href: "/cultura/conhecimento/templates", label: "Templates", icon: "copy" },
  guias: { href: "/cultura/conhecimento/guias", label: "Guias & Processos", icon: "map" },
} as const;

export const WEBSITE_ADMIN_NAV_ITEMS: readonly SubNavItem[] = [
  { href: "/website-admin/projetos", label: "Projetos", icon: "folder" },
  { href: "/website-admin/paginas", label: "Seções do Site", icon: "layout" },
  { href: "/website-admin/config", label: "Configurações", icon: "settings" },
] as const;

export const REVIEW_NAV_ITEMS: readonly SubNavItem[] = [
  { href: "/review", label: "Todos os Projetos", icon: "layout-grid" },
] as const;
