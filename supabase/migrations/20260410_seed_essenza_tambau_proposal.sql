-- ============================================================================
-- Migration: Seed proposta Essenza Tambaú Apart Hotel (Eleven Incorporadora)
-- Date: 2026-04-10
-- Padrão: Veredas Campeche (proposta D3D com imagens 3D)
-- ============================================================================

DO $$
DECLARE
  v_tenant_id UUID := '89080d1a-bc79-4c3f-8fce-20aabc561c0d';
  v_proposal_id UUID;
  v_ref_code TEXT;
  v_count INT;
  v_unit_price NUMERIC(12,2) := 0;
  v_service_id UUID := NULL;
  v_subtotal NUMERIC(12,2);
  v_total_images INT := 13;
BEGIN
  -- Buscar preço do serviço de Imagem 3D do catálogo (se existir)
  SELECT id, base_price INTO v_service_id, v_unit_price
  FROM services
  WHERE tenant_id = v_tenant_id
    AND bu = 'Digital 3D'
    AND status = 'active'
    AND (
      (LOWER(name) LIKE '%imagem%' AND LOWER(name) LIKE '%estática%')
      OR LOWER(name) LIKE '%imagem%3d%'
      OR LOWER(name) LIKE '%render%'
    )
  ORDER BY
    CASE
      WHEN LOWER(name) LIKE '%imagem%estática%' THEN 1
      WHEN LOWER(name) LIKE '%imagem%' THEN 2
      ELSE 3
    END
  LIMIT 1;

  -- Gerar ref_code sequencial
  SELECT COUNT(*) INTO v_count FROM proposals WHERE tenant_id = v_tenant_id;
  v_ref_code := 'TBO-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || LPAD((v_count + 1)::TEXT, 4, '0');

  -- Calcular subtotal (13 imagens × preço unitário)
  v_subtotal := v_total_images * COALESCE(v_unit_price, 0);

  -- 1. Inserir proposta
  INSERT INTO proposals (
    tenant_id, name, company, contact_name, contact_email, contact_phone,
    project_type, project_location, ref_code, valid_days, status,
    urgency_flag, package_discount_flag, subtotal, discount_amount, value,
    notes, introduction, show_d3d_flow, payment_conditions
  ) VALUES (
    v_tenant_id,
    'Essenza Tambaú Apart Hotel',
    'Eleven Incorporadora',
    NULL, NULL, NULL,
    'Hotel / Resort',
    'Tambaú — João Pessoa, PB',
    v_ref_code,
    30,
    'draft',
    false,
    false,
    v_subtotal,
    0,
    v_subtotal,
    '• Prazo estimado: 20-25 dias úteis após aprovação e recebimento do material técnico (plantas, memorial, referências)
• Revisões incluídas: 2 rodadas de ajustes por imagem
• Formato de entrega: JPEG alta resolução (300dpi) + versão web otimizada
• Material necessário para início: projeto arquitetônico (DWG/RVT), memorial descritivo, referências visuais
• Proposta válida por 30 dias a partir da data de emissão',
    'Apresentamos a proposta de imagens 3D para o empreendimento Essenza Tambaú Apart Hotel da Eleven Incorporadora (Hotel / Resort).

O pacote de 13 imagens foi planejado para cobrir todos os ambientes-chave do projeto — desde a fachada e implantação até as áreas de lazer do 4º andar, cobertura e recepção — gerando o material visual completo para a comunicação comercial do lançamento.

O Essenza Tambaú se posiciona como um apart hotel em uma das localizações mais nobres de João Pessoa. As imagens serão produzidas com o padrão de qualidade TBO — fotorrealismo, iluminação cinematográfica e atenção aos detalhes de materialidade, paisagismo e ambientação de cada espaço.',
    true,
    '[
      {"label": "À vista", "description": "Pagamento integral via PIX ou transferência", "highlight": false, "details": "Parcela única com 5% de desconto"},
      {"label": "2x", "description": "50% na aprovação + 50% na entrega", "highlight": true, "details": "Duas parcelas iguais"},
      {"label": "3x", "description": "40% na aprovação + 30% no meio + 30% na entrega", "highlight": false, "details": "Três parcelas"}
    ]'::jsonb
  )
  RETURNING id INTO v_proposal_id;

  -- 2. Inserir itens do escopo

  -- FACHADA E IMPLANTAÇÃO (2 imagens)
  INSERT INTO proposal_items (proposal_id, service_id, tenant_id, title, description, bu, quantity, unit_price, discount_pct, sort_order)
  VALUES
    (v_proposal_id, v_service_id, v_tenant_id, 'Imagem 3D — Fachada', 'Vista principal do empreendimento com entorno e paisagismo', 'Digital 3D', 1, COALESCE(v_unit_price, 0), 0, 0),
    (v_proposal_id, v_service_id, v_tenant_id, 'Imagem 3D — Implantação', 'Vista aérea da implantação do empreendimento no terreno', 'Digital 3D', 1, COALESCE(v_unit_price, 0), 0, 1);

  -- COBERTURA (2 imagens)
  INSERT INTO proposal_items (proposal_id, service_id, tenant_id, title, description, bu, quantity, unit_price, discount_pct, sort_order)
  VALUES
    (v_proposal_id, v_service_id, v_tenant_id, 'Imagem 3D — Bar da Cobertura (Ângulo 1)', 'Cobertura — bar com vista panorâmica', 'Digital 3D', 1, COALESCE(v_unit_price, 0), 0, 2),
    (v_proposal_id, v_service_id, v_tenant_id, 'Imagem 3D — Bar da Cobertura (Ângulo 2)', 'Cobertura — segundo ângulo do bar', 'Digital 3D', 1, COALESCE(v_unit_price, 0), 0, 3);

  -- 4º ANDAR (8 imagens)
  INSERT INTO proposal_items (proposal_id, service_id, tenant_id, title, description, bu, quantity, unit_price, discount_pct, sort_order)
  VALUES
    (v_proposal_id, v_service_id, v_tenant_id, 'Imagem 3D — Piscina', '4º Andar — área da piscina', 'Digital 3D', 1, COALESCE(v_unit_price, 0), 0, 4),
    (v_proposal_id, v_service_id, v_tenant_id, 'Imagem 3D — Terraço com Mesas (Norte)', '4º Andar — terraço com mesas, orientação norte', 'Digital 3D', 1, COALESCE(v_unit_price, 0), 0, 5),
    (v_proposal_id, v_service_id, v_tenant_id, 'Imagem 3D — Spa', '4º Andar — espaço spa', 'Digital 3D', 1, COALESCE(v_unit_price, 0), 0, 6),
    (v_proposal_id, v_service_id, v_tenant_id, 'Imagem 3D — Pracinha', '4º Andar — área de recreação infantil', 'Digital 3D', 1, COALESCE(v_unit_price, 0), 0, 7),
    (v_proposal_id, v_service_id, v_tenant_id, 'Imagem 3D — Restaurante', '4º Andar — restaurante do empreendimento', 'Digital 3D', 1, COALESCE(v_unit_price, 0), 0, 8),
    (v_proposal_id, v_service_id, v_tenant_id, 'Imagem 3D — Coworking', '4º Andar — espaço de coworking', 'Digital 3D', 1, COALESCE(v_unit_price, 0), 0, 9),
    (v_proposal_id, v_service_id, v_tenant_id, 'Imagem 3D — Área de Jogos', '4º Andar — sala de jogos e entretenimento', 'Digital 3D', 1, COALESCE(v_unit_price, 0), 0, 10),
    (v_proposal_id, v_service_id, v_tenant_id, 'Imagem 3D — Academia', '4º Andar — espaço fitness', 'Digital 3D', 1, COALESCE(v_unit_price, 0), 0, 11);

  -- RECEPÇÃO (1 imagem)
  INSERT INTO proposal_items (proposal_id, service_id, tenant_id, title, description, bu, quantity, unit_price, discount_pct, sort_order)
  VALUES
    (v_proposal_id, v_service_id, v_tenant_id, 'Imagem 3D — Recepção', 'Lobby e recepção do apart hotel', 'Digital 3D', 1, COALESCE(v_unit_price, 0), 0, 12);

  RAISE NOTICE 'Proposta Essenza Tambaú criada com sucesso: id=%, ref=%', v_proposal_id, v_ref_code;
END $$;
