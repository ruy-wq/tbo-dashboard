-- ============================================================================
-- Migration: Seed proposta Essenza Tambaú Apart Hotel (Eleven Incorporadora)
-- Date: 2026-04-10
-- Padrão: Veredas Campeche (proposta D3D com imagens 3D agrupadas por bloco)
-- Já executada em produção — migration apenas para versionamento.
-- ============================================================================

DO $$
DECLARE
  v_tenant_id UUID := '89080d1a-bc79-4c3f-8fce-20aabc561c0d';
  v_proposal_id UUID;
  v_exists BOOLEAN;
BEGIN
  -- Verificar se já existe (idempotência)
  SELECT EXISTS(
    SELECT 1 FROM proposals
    WHERE tenant_id = v_tenant_id AND ref_code = 'TBO-2026-043'
  ) INTO v_exists;

  IF v_exists THEN
    RAISE NOTICE 'Proposta TBO-2026-043 já existe, pulando.';
    RETURN;
  END IF;

  -- 1. Inserir proposta
  INSERT INTO proposals (
    tenant_id, name, company, project_type, project_location, ref_code,
    valid_days, status, urgency_flag, package_discount_flag,
    subtotal, discount_amount, value, show_d3d_flow,
    introduction, notes, payment_conditions
  ) VALUES (
    v_tenant_id,
    'Essenza Tambaú Apart Hotel — Visualização Arquitetônica',
    'Eleven Incorporadora',
    'Hotel / Resort',
    'Tambaú — João Pessoa, PB',
    'TBO-2026-043',
    15,
    'rascunho',
    false,
    false,
    25000.00,
    0.00,
    25000.00,
    true,
    'A produção de imagens é uma das decisões mais críticas na preparação comercial de um empreendimento. É o primeiro ponto de contato do comprador com o produto — e, muitas vezes, o que define a velocidade de vendas nas primeiras semanas.

Para o Essenza Tambaú, posicionado como apart hotel em uma das localizações mais valorizadas de João Pessoa, esse material visual precisa traduzir não apenas o projeto, mas a experiência de hospedagem e investimento que ele oferece.

O programa do empreendimento é denso e diversificado: fachada contemporânea com implantação urbana, cobertura com bar panorâmico, e um 4º andar completo com piscina, terraço, spa, pracinha, restaurante, coworking, área de jogos e academia — além de uma recepção que precisa comunicar hospitalidade e sofisticação desde o primeiro passo.

Cada imagem desta proposta foi pensada com visão de produto: a fachada é o hero da comunicação digital, a implantação contextualiza o empreendimento no entorno urbano, o bar da cobertura vende o lifestyle aspiracional, as áreas de lazer do 4º andar constroem o argumento de conveniência e lazer completo, e a recepção fecha o argumento de experiência hoteleira premium.',
    'Revisões: até 2 rodadas de ajustes por imagem incluídas. Alterações estruturais orçadas à parte.

Entrega: imagens em alta resolução (4K+), JPEG e PNG.

Não incluso: direção criativa avançada, animações 3D, tour 360°, implantações urbanísticas e material gráfico.

Cronograma: detalhado após aprovação, com marcos por bloco. Início sujeito à disponibilidade de agenda.',
    '[
      {"label": "Opção A — Parcelado por marcos", "description": "3× de R$ 8.333,33", "highlight": false, "details": "Parcelas vinculadas às entregas: 1ª no kickoff, 2ª na revisão, 3ª na entrega final. Boleto bancário emitido pela TBO."},
      {"label": "Opção B — À vista com desconto", "description": "R$ 23.750,00", "highlight": true, "details": "5% de desconto para pagamento integral na aprovação da proposta. Melhor condição disponível."}
    ]'::jsonb
  )
  RETURNING id INTO v_proposal_id;

  -- 2. Inserir itens do escopo (padrão Veredas: modelagem base + imagens agrupadas por bloco)

  INSERT INTO proposal_items (proposal_id, tenant_id, title, description, bu, quantity, unit_price, discount_pct, sort_order)
  VALUES
    -- Modelagem 3D
    (v_proposal_id, v_tenant_id,
     'Modelagem 3D Completa',
     'Maquete digital com precisão técnica — volumetria, fachada, áreas comuns, cobertura, recepção e paisagismo. Base para todas as imagens.',
     'Digital 3D', 1, 5500.00, 0, 1),

    -- Fachada e Implantação (2 imagens)
    (v_proposal_id, v_tenant_id,
     'Imagens Estáticas — Fachada e Implantação',
     'Fachada principal (hero comunicação digital) e implantação aérea com entorno urbano e paisagismo.',
     'Digital 3D', 2, 1500.00, 0, 2),

    -- Cobertura (2 imagens)
    (v_proposal_id, v_tenant_id,
     'Imagens Estáticas — Bar da Cobertura',
     'Bar panorâmico da cobertura em dois ângulos — lifestyle aspiracional e vista privilegiada.',
     'Digital 3D', 2, 1500.00, 0, 3),

    -- 4º Andar (8 imagens)
    (v_proposal_id, v_tenant_id,
     'Imagens Estáticas — Áreas de Lazer (4º Andar)',
     'Piscina, terraço com mesas (norte), spa, pracinha, restaurante, coworking, área de jogos e academia — argumento de conveniência e lazer completo.',
     'Digital 3D', 8, 1500.00, 0, 4),

    -- Recepção (1 imagem)
    (v_proposal_id, v_tenant_id,
     'Imagem Estática — Recepção',
     'Lobby e recepção do apart hotel — experiência hoteleira premium, hospitalidade e sofisticação.',
     'Digital 3D', 1, 1500.00, 0, 5);

  RAISE NOTICE 'Proposta Essenza Tambaú criada: id=%, ref=TBO-2026-043', v_proposal_id;
END $$;
