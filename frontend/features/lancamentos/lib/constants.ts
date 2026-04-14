// ── Phase Definitions ───────────────────────────────────────────────────────

export const PHASE_DEFINITIONS = [
  {
    number: 1,
    name: "Fundação",
    description: "Diagnóstico de mercado, definição de persona, posicionamento, tese de investimento e indicadores-alvo.",
    defaultItems: [
      "Diagnóstico de mercado concluído",
      "Persona definida e validada",
      "Posicionamento do empreendimento",
      "Tese de investimento documentada",
      "Indicadores-alvo definidos",
    ],
  },
  {
    number: 2,
    name: "Estratégia",
    description: "Definição de canais, funil de conversão, política comercial, tabela de preços e estrutura de comissão.",
    defaultItems: [
      "Canais de aquisição definidos",
      "Funil de conversão estruturado",
      "Política comercial aprovada",
      "Tabela de preços finalizada",
      "Estrutura de comissão definida",
    ],
  },
  {
    number: 3,
    name: "Ativos",
    description: "Produção de materiais, landing pages, apresentações, vídeos e todos os assets para operação.",
    defaultItems: [
      "Landing page publicada",
      "Materiais de venda produzidos",
      "Apresentação comercial pronta",
      "Vídeos institucionais entregues",
      "Assets de mídia aprovados",
    ],
  },
  {
    number: 4,
    name: "Aquecimento",
    description: "Geração de demanda qualificada, construção de lista, validação de interesse antes da abertura.",
    defaultItems: [
      "Campanha de captação ativa",
      "Lista de interessados qualificada",
      "Validação de interesse concluída",
      "Base aquecida com comunicação",
      "Meta de leads pré-abertura atingida",
    ],
  },
  {
    number: 5,
    name: "Conversão",
    description: "Abertura de vendas com base validada. Processo comercial estruturado. Execução do funil.",
    defaultItems: [
      "Vendas abertas oficialmente",
      "Equipe comercial treinada",
      "Processo de atendimento ativo",
      "Funil de vendas em execução",
      "Reservas em andamento",
    ],
  },
  {
    number: 6,
    name: "Gestão",
    description: "Monitoramento de KPIs, ajustes em tempo real, controle de performance por canal e equipe.",
    defaultItems: [
      "Dashboard de KPIs ativo",
      "Reuniões de gestão semanais",
      "Ajustes de mídia por performance",
      "Controle de CAC por canal",
      "Relatório de conversão atualizado",
    ],
  },
  {
    number: 7,
    name: "Equity",
    description: "Construção de ativo de marca. Documentação de aprendizados. Redução progressiva de CAC.",
    defaultItems: [
      "Retrospectiva do lançamento",
      "Aprendizados documentados",
      "Base de clientes catalogada",
      "Estratégia de marca atualizada",
      "Playbook atualizado para próximo ciclo",
    ],
  },
] as const;

// ── KPI Templates ───────────────────────────────────────────────────────────

export const DEFAULT_KPIS = [
  { name: "VGV Realizado", category: "financial" as const, unit: "R$", phase_number: null },
  { name: "Unidades Vendidas", category: "operational" as const, unit: "un", phase_number: null },
  { name: "Taxa de Conversão", category: "conversion" as const, unit: "%", phase_number: null },
  { name: "CAC", category: "financial" as const, unit: "R$", phase_number: null },
  { name: "Leads Gerados", category: "engagement" as const, unit: "un", phase_number: 4 },
  { name: "Visitas Realizadas", category: "conversion" as const, unit: "un", phase_number: 5 },
  { name: "Ticket Médio", category: "financial" as const, unit: "R$", phase_number: null },
  { name: "Velocidade de Vendas", category: "operational" as const, unit: "un/mês", phase_number: 6 },
] as const;

// ── Status Labels ───────────────────────────────────────────────────────────

export const LAUNCH_STATUS_LABELS: Record<string, string> = {
  planning: "Planejamento",
  active: "Ativo",
  paused: "Pausado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

export const LAUNCH_STATUS_COLORS: Record<string, string> = {
  planning: "#6366f1",
  active: "#22c55e",
  paused: "#f59e0b",
  completed: "#3b82f6",
  cancelled: "#ef4444",
};

export const PHASE_STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  in_progress: "Em andamento",
  completed: "Concluída",
  blocked: "Bloqueada",
};

export const KPI_CATEGORY_LABELS: Record<string, string> = {
  conversion: "Conversão",
  financial: "Financeiro",
  operational: "Operacional",
  engagement: "Engajamento",
};
