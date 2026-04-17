// ============================================================================
// Stage Playbooks — define as 3 variações de email por etapa do funil.
//
// Cada playbook tem 3 slots fixos (label + tom + objetivo + pool de ângulos).
// O prompt recebe o playbook do stage atual e a IA escolhe 1 ângulo de cada
// pool, priorizando variação vs. gerações anteriores.
//
// Adicionar um novo stage: inclua a chave em STAGE_PLAYBOOKS + adicione fuzzy
// match em resolvePlaybookKey se o stage vier de crm_stages (UUID custom).
// ============================================================================

export interface PlaybookVariant {
  label: string;         // Nome curto da variação (aparece no tab do drawer)
  tone: string;          // Tom descritivo (salvo em variant.tone)
  objective: string;     // O que este email precisa fazer
  angles: string[];      // Pool de ângulos; a IA escolhe 1 por geração
  placeholderHint:
    | "recommended"      // Sugerir {{imagem}} natural (ex: após case)
    | "optional"         // Pode ou não inserir
    | "avoid";           // Não inserir placeholder nesta variação
  /**
   * Se a variação deve incluir a seção `### Trending now` (estilo newsletter editorial)
   * com 2-3 bullets de tendências/observações recentes do mercado.
   * Default: "avoid" (se omitido).
   */
  trendingHint?: "recommended" | "avoid";
}

export interface StagePlaybook {
  stageKey: string;
  stageLabel: string;
  stagePsychology: string;   // Estado do lead NESTA etapa (injetado no prompt)
  variants: [PlaybookVariant, PlaybookVariant, PlaybookVariant];
}

// ──────────────────────────────────────────────────────────────────────
// Playbooks
// ──────────────────────────────────────────────────────────────────────

export const STAGE_PLAYBOOKS: Record<string, StagePlaybook> = {
  lead: {
    stageKey: "lead",
    stageLabel: "Lead",
    stagePsychology:
      "Primeiro contato frio. O lead nunca ouviu falar da TBO ou mal nos conhece. Não tem contexto, não tem urgência, não espera ser contatado. Qualquer frase que soe a pitch é descartada em 2 segundos. O objetivo do email NÃO é vender, é fazer o lead parar pra ler a segunda frase.",
    variants: [
      {
        label: "Consultivo",
        tone: "reflexivo",
        objective:
          "Abrir uma visão nova sobre algo que o decisor convive todo dia mas não articulou. Deve provocar o pensamento 'faz sentido isso'.",
        angles: [
          "Padrão de mercado — 'tem um ponto que observo com frequência em lançamentos desse perfil'",
          "Comportamento do comprador final — como ele compara/decide hoje em segmento premium",
          "Evolução do setor — o que mudou recentemente em lançamentos desse tipo",
          "Fricção invisível — parte do processo que ninguém mede mas impacta venda",
          "Percepção vs. realidade — gap entre o que o produto é e como chega no comprador",
        ],
        placeholderHint: "optional",
      },
      {
        label: "Observação",
        tone: "específico",
        objective:
          "Mostrar que observou a incorporadora com atenção — cita algo concreto do perfil dela (produto, região, última entrega, posicionamento aparente). Reduz a sensação de email em massa.",
        angles: [
          "Pelo perfil dos produtos que a empresa vem lançando — observação sobre padrão do portfólio",
          "Pela região em que atuam — dinâmica do mercado regional (sul, interior paulista, litoral, etc)",
          "Pelo porte — comparar com referências do segmento equivalente em outra praça",
          "Pelo timing — momento do mercado (ciclo, taxa, concorrência regional)",
          "Pelo canal — observação sobre como se apresentam hoje (site, redes, stand)",
        ],
        placeholderHint: "recommended",
        trendingHint: "recommended",
      },
      {
        label: "Provocação",
        tone: "direto",
        objective:
          "Abrir um gap de percepção com uma pergunta curta e específica que o decisor não consegue responder sem pensar. Não é retórica — é pergunta genuína de executivo pra executivo.",
        angles: [
          "O quanto do material atual aguenta o nível de concorrência da próxima safra de lançamentos",
          "Como medir se o material está carregando a venda ou o comercial está compensando",
          "O que o comprador enxerga antes de pisar no estande — e se isso está alinhado",
          "Como o produto aparece vs. como ele foi concebido internamente",
          "Onde está a maior perda de percepção entre os pontos de contato",
        ],
        placeholderHint: "avoid",
      },
    ],
  },

  qualificacao: {
    stageKey: "qualificacao",
    stageLabel: "Qualificação",
    stagePsychology:
      "Lead já respondeu uma vez ou engajou de alguma forma. Sabe que a TBO existe, mas ainda não sabe exatamente o que a gente faz diferente de qualquer outro fornecedor. Está sondando. Aqui o objetivo é aprofundar entendimento do projeto dele e criar autoridade pontual.",
    variants: [
      {
        label: "Diagnóstico",
        tone: "autoavaliação",
        objective:
          "Dar ao lead uma lente pra avaliar o material/posicionamento atual dele sem que a TBO pareça estar vendendo. Termina com pergunta sobre quais sinais ressoam.",
        angles: [
          "Sinais de fragmentação entre peças (5 pontos)",
          "Sinais de percepção aquém do produto (4 pontos)",
          "Sinais de que o comercial compensa por falta de apresentação (5 pontos)",
          "Sinais de que o conceito se dilui ao longo do funil (4 pontos)",
          "Sinais de que o comprador compara demais (5 pontos)",
          "Sinais específicos pro tipo de projeto do deal (criar a partir do escopo)",
        ],
        placeholderHint: "avoid",
      },
      {
        label: "Case/Prova",
        tone: "tangibilização",
        objective:
          "Tangibilizar o que a TBO faz através de um caso similar, sem nome próprio. Problema → intervenção → resultado. Deixa o lead projetar no próprio cenário.",
        angles: [
          "Projeto em cidade do sul (Joinville, Curitiba, Porto Alegre, Blumenau, Florianópolis)",
          "Projeto em cidade do sudeste (São Paulo interior, Campinas, Ribeirão, Belo Horizonte)",
          "Lançamento que reestruturou apresentação antes de abrir VSO",
          "Projeto que ajustou só um pilar (só 3D, ou só narrativa audiovisual) e mudou leitura",
          "Incorporadora que centralizou fornecedores após fragmentação",
          "Projeto premium com percepção mediana — intervenção elevou percepção",
          "Caso em que o corretor precisava explicar demais — material passou a 'vender sozinho'",
        ],
        placeholderHint: "recommended",
      },
      {
        label: "Próximo Passo",
        tone: "direcionado",
        objective:
          "Fazer 1-2 perguntas dirigidas ao projeto específico do lead, demonstrando competência sem pitch. A pergunta precisa revelar que a TBO entende o problema em profundidade.",
        angles: [
          "Pergunta sobre estágio do produto vs. estágio do material hoje",
          "Pergunta sobre quem carrega a narrativa hoje (produto, incorporadora, corretor)",
          "Pergunta sobre o canal primário de descoberta do comprador",
          "Pergunta sobre o nível de alinhamento entre marketing e comercial",
          "Pergunta sobre o que faria o lançamento 'soar diferente' no mercado regional",
        ],
        placeholderHint: "optional",
      },
    ],
  },

  proposta: {
    stageKey: "proposta",
    stageLabel: "Proposta em Aberto",
    stagePsychology:
      "Lead já recebeu proposta/orçamento. Está comparando, adiando, ou em reunião interna. As dúvidas reais aqui são: preço faz sentido? vale a diferença vs. fornecedor atual? agora é o momento? Email precisa reforçar valor sem soar como cobrança e sem repetir o que já está na proposta.",
    variants: [
      {
        label: "Reforço de Valor",
        tone: "consultivo",
        objective:
          "Reenquadrar a decisão NÃO pelo custo isolado, mas pelo custo de fazer o lançamento sem o nível de direção que estamos propondo. Sem CTA, sem urgência artificial.",
        angles: [
          "Custo da fragmentação entre fornecedores vs. centralização",
          "Impacto da direção criativa única na percepção do comprador final",
          "Retrabalho evitado quando material e narrativa saem alinhados desde o start",
          "Como a consistência entre peças reduz fricção no comercial",
          "O que o VGV-alvo pede em termos de material — e o que aceita de baixo disso",
        ],
        placeholderHint: "optional",
      },
      {
        label: "Resposta a Objeção",
        tone: "antecipativo",
        objective:
          "Antecipar e dissolver a objeção invisível mais provável (fornecedor atual, preço, timing, 'a gente faz internamente'). Sem mencionar a proposta diretamente.",
        angles: [
          "Sobre fornecedor atual — quando a troca faz sentido e quando não faz",
          "Sobre fazer internamente — onde o in-house entrega e onde esbarra",
          "Sobre timing — por que começar antes do lançamento público muda o resultado",
          "Sobre diferença de preço — o que está sendo comprado que não é horas de trabalho",
          "Sobre comparação com outros orçamentos — como avaliar além do número final",
        ],
        placeholderHint: "avoid",
      },
      {
        label: "Case Similar",
        tone: "prova",
        objective:
          "Contar um caso de projeto que fechou em cenário parecido (mesmo porte, mesma dúvida, mesmo momento) e o que aconteceu depois. Sem nome, sem números inflados.",
        angles: [
          "Incorporadora que hesitou por 60 dias — o que mudou quando o material entrou no ar",
          "Projeto com proposta em aberto que virou lançamento âncora da região",
          "Lançamento em que o primeiro corte de escopo custou mais do que economizou",
          "Caso de centralização pós-fragmentação — ganho de consistência percebida",
          "Projeto que começou pelo digital antes do stand físico e ganhou 3 meses de curva",
        ],
        placeholderHint: "recommended",
      },
    ],
  },

  negociacao: {
    stageKey: "negociacao",
    stageLabel: "Negociação",
    stagePsychology:
      "Discutindo termos, escopo ou preço. O lead está 'perto do sim' mas querendo encaixar orçamento, ajustar entregáveis ou sentir segurança final. Aqui NÃO é hora de novos argumentos estratégicos — é hora de reduzir atrito e reforçar o porquê de ser a TBO, não o concorrente.",
    variants: [
      {
        label: "Segurança na Escolha",
        tone: "consolidativo",
        objective:
          "Reduzir a ansiedade da decisão com observação concreta sobre como outros clientes avaliaram retrospectivamente a escolha da TBO. Não é depoimento — é padrão observado.",
        angles: [
          "Padrão de feedback pós-lançamento: o que os clientes identificam como o ganho real",
          "O que incorporadoras que centralizaram na TBO dizem 6 meses depois",
          "Como o comercial do cliente percebe a diferença quando material carrega a venda",
          "Sinais de que a decisão foi certa: o que aparece no funil pós-lançamento",
          "Retrospectiva de projetos que bateram VGV antes da meta — o que estava no material",
        ],
        placeholderHint: "recommended",
      },
      {
        label: "Diferenciação Final",
        tone: "comparativo",
        objective:
          "Sem mencionar concorrente, deixar claro o que a TBO entrega que qualquer outro fornecedor tecnicamente competente NÃO entrega. Foco em processo, direção e consistência, não em 'qualidade'.",
        angles: [
          "Direção criativa única atravessando todas as peças — o que muda na percepção",
          "Processo de aprovação integrado — por que não há 'retrabalho entre BUs' na TBO",
          "Fio condutor narrativo — como o comprador percebe continuidade entre os pontos de contato",
          "Entrega orquestrada — timing do rollout de material alinhado ao calendário comercial",
          "Padrão de sênior na mesa — quem conduz a conversa do projeto",
        ],
        placeholderHint: "optional",
      },
      {
        label: "ROI Percebido",
        tone: "econômico",
        objective:
          "Conectar investimento em material/direção com resultado comercial observável (aceleração de venda, preço médio, menor desconto, menos visita perdida). Sem prometer números.",
        angles: [
          "Preço médio sustentado vs. desconto médio aplicado — onde o material influencia",
          "Velocidade de venda nos 90 dias iniciais — o que o material precisa sustentar",
          "Taxa de conversão de visita em proposta — como o material prepara a visita",
          "Redução do tempo de decisão do comprador quando a narrativa é coesa",
          "VSO em praças competitivas — o papel do material antes da visita presencial",
        ],
        placeholderHint: "avoid",
      },
    ],
  },

  fechado_ganho: {
    stageKey: "fechado_ganho",
    stageLabel: "Fechado (Ganho)",
    stagePsychology:
      "Cliente já fechou. Email outbound aqui é para follow-up consultivo, kickoff informal ou abertura de nova frente (upsell/cross-sell/indicação). NUNCA soar como venda, sempre como 'time de dentro da operação'.",
    variants: [
      {
        label: "Alinhamento de Expectativa",
        tone: "parceria",
        objective:
          "Consolidar o nível de diálogo pós-fechamento. Mostrar como a TBO pensa o projeto nos próximos 90 dias, o que é esperado do cliente e o que não é.",
        angles: [
          "O que os primeiros 30 dias decidem sobre a curva do projeto inteiro",
          "Onde o cliente mais perde tempo quando não há papel claro de cada lado",
          "Como manter o projeto em trilho entre marketing, comercial e produto",
          "O ritmo de aprovação ideal pra não travar o rollout",
        ],
        placeholderHint: "optional",
      },
      {
        label: "Sugestão de Próxima Frente",
        tone: "consultivo",
        objective:
          "Abrir uma conversa sobre BU adjacente ou etapa futura (ex: se fechou 3D, provocar branding; se fechou branding, sugerir audiovisual). Sem pitch — é observação do time que viu o produto.",
        angles: [
          "Onde o projeto vai pedir mais material conforme o estande abre",
          "Que ponto do funil vai ficar exposto sem a peça complementar",
          "O que normalmente aparece como gap na segunda onda de comunicação",
          "Quando começar a preparar a peça seguinte pra não ter descontinuidade",
        ],
        placeholderHint: "recommended",
      },
      {
        label: "Ponte para Indicação",
        tone: "relacionamento",
        objective:
          "Abrir espaço natural pra indicação sem pedir diretamente. Posicionar a TBO como time que trabalha com pares do cliente e que indicações caem em lugar certo.",
        angles: [
          "Como outras incorporadoras do mesmo porte têm resolvido questão parecida",
          "Rede de relacionamento da TBO — quem são os pares naturais do cliente",
          "Quando faz sentido conectar o cliente com outra incorporadora (evento, troca de experiência)",
          "Observação sobre padrão de quem entra via indicação vs. outbound",
        ],
        placeholderHint: "avoid",
      },
    ],
  },

  fechado_perdido: {
    stageKey: "fechado_perdido",
    stageLabel: "Fechado (Perdido)",
    stagePsychology:
      "Lead já decidiu NÃO fechar — ficou com outro fornecedor, adiou, tirou do radar. O objetivo AQUI é re-engajamento de longo prazo. NUNCA soar como 'cobrança' ou 'e agora, fechou?'. Tem que parecer que o executivo lembrou do cliente por motivo específico.",
    variants: [
      {
        label: "Observação Recente",
        tone: "atento",
        objective:
          "Retomar contato citando algo concreto que aconteceu no mercado, na região ou no portfólio do cliente. Mostra que a TBO continua acompanhando, não esqueceu do lead.",
        angles: [
          "Movimento recente da concorrência direta do cliente na região",
          "Novo lançamento do cliente detectado — observação sobre o material dele",
          "Mudança regulatória/mercado que impacta o segmento específico do lead",
          "Publicação/estudo novo sobre o tema do produto do cliente",
          "Evento/feira regional que faz sentido acompanhar",
        ],
        placeholderHint: "recommended",
        trendingHint: "recommended",
      },
      {
        label: "Mudança de Cenário",
        tone: "relevante",
        objective:
          "Comunicar mudança interna na TBO (nova BU, nova capacidade, novo formato de projeto) que muda a equação que o cliente considerou antes. Direto, sem nostalgia.",
        angles: [
          "Nova capacidade da TBO que resolve gap que o cliente tinha apontado antes",
          "Novo formato de engajamento (projeto curto, diagnóstico, piloto)",
          "Expansão de BU que cobre o que a TBO não tinha quando conversamos",
          "Caso recente que mostra resultado no mesmo tipo de projeto que o cliente tem",
        ],
        placeholderHint: "optional",
      },
      {
        label: "Diagnóstico Sem Compromisso",
        tone: "ofertivo-consultivo",
        objective:
          "Oferecer uma análise/diagnóstico rápido e específico do material atual do cliente, sem cobrar e sem condicionar a fechar nada. Abre espaço pra retomar conversa em contexto útil pra ele.",
        angles: [
          "Análise comparativa do material atual vs. melhores referências do segmento",
          "Diagnóstico de coerência entre peças (site, 3D, institucional, stand)",
          "Leitura da percepção que o comprador tem hoje vs. posicionamento desejado",
          "Revisão do fio narrativo ao longo do funil de vendas do cliente",
        ],
        placeholderHint: "avoid",
      },
    ],
  },
};

// ──────────────────────────────────────────────────────────────────────
// Resolve a chave do playbook a partir de stage (padrão ou UUID custom)
// ──────────────────────────────────────────────────────────────────────
export function resolvePlaybookKey(
  rawStage: string,
  stageLabel: string,
): keyof typeof STAGE_PLAYBOOKS {
  const k = rawStage.toLowerCase().trim();
  if (k in STAGE_PLAYBOOKS) return k as keyof typeof STAGE_PLAYBOOKS;

  // Fallback: fuzzy match pelo label resolvido (stages custom via crm_stages)
  const l = stageLabel.toLowerCase();
  if (/ganho|won|fechad[oa]\s*\(?\s*ganh/i.test(l)) return "fechado_ganho";
  if (/perdid|lost|fechad[oa]\s*\(?\s*perdid/i.test(l)) return "fechado_perdido";
  if (/negocia/i.test(l)) return "negociacao";
  if (/proposta|orçament|orcament/i.test(l)) return "proposta";
  if (/qualifica|reuniao|reunião|discovery|conver/i.test(l)) return "qualificacao";
  return "lead";
}

// ──────────────────────────────────────────────────────────────────────
// Gera a seção do prompt com o playbook específico do stage
// ──────────────────────────────────────────────────────────────────────
export function buildPlaybookSection(playbook: StagePlaybook): string {
  const parts: string[] = [];
  parts.push(`# ESTADO PSICOLÓGICO NESTA ETAPA DO FUNIL — ${playbook.stageLabel}`);
  parts.push(playbook.stagePsychology);
  parts.push(``);
  parts.push(`# VARIAÇÕES OBRIGATÓRIAS NESTA ETAPA`);
  parts.push(
    `Gere EXATAMENTE 3 variações com os labels e tons abaixo, nesta ordem. Cada variação tem um objetivo próprio e um pool de ângulos — escolha UM ângulo por variação, priorizando ângulos que NÃO foram usados em gerações anteriores deste mesmo lead.`,
  );
  parts.push(``);

  playbook.variants.forEach((v, i) => {
    parts.push(`## Variação ${i + 1} — ${v.label} (tom: ${v.tone})`);
    parts.push(`**Objetivo:** ${v.objective}`);
    parts.push(`**Ângulos possíveis (escolha 1):**`);
    v.angles.forEach((a) => parts.push(`- ${a}`));
    parts.push(
      `**Placeholder de mídia:** ${formatPlaceholderHint(v.placeholderHint)}`,
    );
    parts.push(
      `**Trending now:** ${formatTrendingHint(v.trendingHint ?? "avoid")}`,
    );
    parts.push(``);
  });

  return parts.join("\n");
}

function formatPlaceholderHint(hint: PlaybookVariant["placeholderHint"]): string {
  switch (hint) {
    case "recommended":
      return "INSIRA `{{imagem}}` em um ponto natural do corpo (tipicamente após o parágrafo-prova, caso ou observação específica). Serve pro usuário arrastar uma imagem do projeto depois.";
    case "optional":
      return "OPCIONAL: pode inserir `{{imagem}}` ou `{{video}}` UMA vez se fizer sentido natural. Se não couber, não insira.";
    case "avoid":
      return "NÃO insira placeholder nesta variação — o tom não pede apoio visual.";
  }
}

function formatTrendingHint(hint: NonNullable<PlaybookVariant["trendingHint"]>): string {
  switch (hint) {
    case "recommended":
      return "INCLUA uma seção `### Trending now` com 2-3 bullets curtos (formato `- 🔍 **LABEL:** texto`) sobre tendências/observações recentes do mercado imobiliário relevantes pra esta etapa. Posicione DEPOIS do corpo principal e ANTES da pergunta final. Use os links/blog posts fornecidos no contexto quando fizer sentido.";
    case "avoid":
      return "NÃO inclua seção `### Trending now` nesta variação — o tom pede foco no argumento central.";
  }
}
