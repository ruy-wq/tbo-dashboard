-- ============================================================================
-- Seed — cadências do Notion E-MAIL MARKETING (2026)
-- Fonte: https://www.notion.so/E-MAIL-MARKETING-2026-343b27ff29e380e49518eebe5327c403
--
-- 3 cadências sistema (tenant_id = NULL, is_system = true):
--   1. Prospecção Alto Padrão (stage=lead) — 6 e-mails, intervalo 2-3 dias
--   2. Nutrição Oportunidade (stage=qualificacao) — 8 e-mails, intervalo 10-14 dias
--   3. Proposta em Aberto — 1 por BU (6 BUs), stage=proposta, intervalo 3-5 dias
--
-- Body usa tokens {{primeiro_nome}} e {{empresa}} (resolvidos no envio).
-- Todos os textos vieram literais do Notion — edição posterior via UI.
-- ============================================================================

-- ── 1. PROSPECÇÃO ALTO PADRÃO (6 e-mails) ─────────────────────────────────
WITH cad AS (
  INSERT INTO public.cadences (
    tenant_id, slug, name, description, stage_trigger, bu,
    default_interval_days, is_active, is_system, source, source_url
  ) VALUES (
    NULL, 'prospeccao-alto-padrao',
    'Prospecção Alto Padrão',
    'Cadência de 6 e-mails pra aquecer leads outbound (frios). Constrói percepção de valor antes de pitch. Alto padrão.',
    'lead', NULL, 3, true, true, 'notion',
    'https://www.notion.so/343b27ff29e3808eae73d65d3eb3f606'
  ) RETURNING id
)
INSERT INTO public.cadence_steps (cadence_id, step_order, name, subject_template, body_template, objective, role, days_from_previous, angles)
SELECT id, step_order, name, subject, body, objective, role, days, angles FROM cad, (VALUES
  (1, 'E-mail 1 — Descompressão',
   'Uma leitura rápida (sem pitch)',
   'Fala, {{primeiro_nome}} — tudo bem?

Vou ser direto.

Não é um e-mail comercial.

Tenho acompanhado alguns lançamentos recentes de médio/alto padrão e tem um ponto específico na forma como os projetos são apresentados que tem chamado atenção.

Nada básico — mais um ajuste fino de percepção mesmo.

Quero te mandar alguns pontos rápidos ao longo dos próximos dias.

Se não fizer sentido pra você, me avisa que eu paro por aqui sem problema.',
   'Abrir canal sem gatilho comercial. Reduzir barreira de resposta.',
   'descompressao', 0,
   '{"objecao_invisivel": "não quero entrar em mais uma conversa comercial", "camada": "consciencia"}'::jsonb),

  (2, 'E-mail 2 — Ponto cego refinado',
   'Um ajuste fino que faz diferença',
   '{{primeiro_nome}},

Em projetos de médio/alto padrão, dificilmente o problema está no produto.

Normalmente também não está na qualidade dos materiais.

Mas tem um ponto mais sutil que, quando não está bem resolvido, começa a impactar o processo de venda: a precisão da percepção.

Não é sobre estética. É sobre o quanto o cliente entende exatamente o que está sendo proposto — sem ruído, sem distorção, sem simplificação excessiva.

Já vi bons projetos perderem força não por falta de qualidade, mas por perda de precisão na leitura do produto.

Aí te pergunto — vocês costumam olhar isso de forma estruturada ou ainda é algo mais intuitivo?',
   'Aprofundar camada de dor. Mostrar ponto cego que ele não está vendo.',
   'ponto_cego', 3,
   '{"objecao_invisivel": "não vejo tanta diferença entre empresas", "camada": "dor"}'::jsonb),

  (3, 'E-mail 3 — Quebra de "alto padrão também erra"',
   'Onde até bons projetos perdem força',
   '{{primeiro_nome}},

Uma coisa interessante: no alto padrão, raramente você vê materiais ruins. Mas ainda assim, alguns projetos performam melhor que outros. E nem sempre a diferença está no produto em si.

Em um projeto recente que acompanhamos, o desafio não era elevar o nível estético. Isso já estava bem resolvido. O ponto era outro: o projeto estava sendo percebido de forma mais genérica do que deveria.

E isso, no alto padrão, é crítico. Porque quando o produto perde especificidade, ele entra em comparação. Mesmo sendo bom.

Quando ajustamos essa construção, o efeito foi sutil visualmente. Mas claro no comportamento: mais clareza de proposta, menos necessidade de argumentação, maior aderência ao conceito.

Na tua visão, hoje o maior desafio está mais em execução ou em manter essa precisão de percepção?',
   'Quebrar a ideia de que qualidade de material = sucesso comercial.',
   'quebra', 3,
   '{"objecao_invisivel": "estamos satisfeitos com o atual", "camada": "valor"}'::jsonb),

  (4, 'E-mail 4 — Impacto direto no posicionamento',
   'Isso impacta mais do que parece',
   '{{primeiro_nome}},

Tem um ponto que começa a aparecer mais no meio do lançamento. Não no início.

Quando a apresentação não sustenta com precisão o conceito do produto, o que acontece: o cliente interpreta de forma mais genérica, o corretor precisa complementar com discurso, o posicionamento começa a diluir.

E isso é sutil. Mas no alto padrão, faz diferença. Porque o valor não está só no que é entregue — está na forma como isso é percebido.

E quando essa percepção perde força, o produto começa a ser comparado por critérios mais superficiais.

Aí te pergunto — vocês já perceberam algo assim em algum momento de lançamento?',
   'Conectar o ponto teórico com o momento de venda real. Criar urgência silenciosa.',
   'impacto', 3,
   '{"objecao_invisivel": "isso pode ser resolvido depois", "camada": "reflexao"}'::jsonb),

  (5, 'E-mail 5 — TBO entra com autoridade',
   'Um movimento que tem evoluído',
   '{{primeiro_nome}},

O que tenho visto com mais frequência em incorporadoras de alto padrão: uma evolução na forma de estruturar a apresentação do produto.

Não só como material. Mas como construção de percepção. Ou seja: definir o que precisa ser percebido, controlar a ordem dessa percepção, alinhar isso com o perfil do cliente final.

Nos projetos onde isso acontece, a diferença não está só no material. Está na consistência do posicionamento ao longo de toda a jornada.

Aqui na TBO, a gente tem atuado bastante nessa linha — integrando Digital 3D, audiovisual, branding e experiências imersivas dentro de uma mesma lógica estratégica. Não como entregas isoladas. Mas como construção de leitura do produto.

Mas me diz — hoje vocês conseguem manter essa coerência de ponta a ponta ou ainda existem variações ao longo do processo?',
   'Introduzir a TBO como ponto de referência, não como vendedor.',
   'autoridade', 3,
   '{"objecao_invisivel": "já temos fornecedor", "camada": "posicionamento"}'::jsonb),

  (6, 'E-mail 6 — Abertura + portfólio',
   'Se fizer sentido, te mostro um exemplo',
   '{{primeiro_nome}},

Se esses pontos fizerem sentido pra você, posso te mostrar alguns exemplos práticos onde esse tipo de construção ajudou a sustentar melhor o posicionamento do produto.

Nada longo — mais para tangibilizar o raciocínio. Sem proposta, sem compromisso.

Mas me diz — vocês têm algum projeto novo entrando ainda esse ano ou estão mais em fase de estruturação?',
   'Abrir convite pra próximo passo. Baixíssima pressão comercial.',
   'portfolio', 3,
   '{"objecao_invisivel": "não temos previsão de lançamento", "camada": "proximo_passo"}'::jsonb)
) AS t(step_order, name, subject, body, objective, role, days, angles);