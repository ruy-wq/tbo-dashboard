-- ============================================================================
-- TBO OS — Seed do template de e-mail "Prospecção Quente – TBO"
-- Usado pelo fluxo de campanha para leads quentes do /comercial/pipeline
-- Idempotente: só insere se não existir template com esse nome no tenant
-- Variáveis suportadas: {{primeiro_nome}}, {{nome}}, {{empresa}}, {{email}}
-- ============================================================================

DO $$
DECLARE
  v_tenant_id uuid;
  v_exists    boolean;
BEGIN
  SELECT id INTO v_tenant_id FROM tenants LIMIT 1;
  IF v_tenant_id IS NULL THEN
    RAISE NOTICE 'Nenhum tenant encontrado — seed pulado';
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.email_templates
     WHERE tenant_id = v_tenant_id
       AND name = 'Prospecção Quente – TBO'
  ) INTO v_exists;

  IF v_exists THEN
    RAISE NOTICE 'Template "Prospecção Quente – TBO" já existe — seed pulado';
    RETURN;
  END IF;

  INSERT INTO public.email_templates (
    tenant_id,
    name,
    subject,
    category,
    tags,
    html_content
  ) VALUES (
    v_tenant_id,
    'Prospecção Quente – TBO',
    '{{primeiro_nome}}, uma leitura sobre os materiais do próximo lançamento',
    'Prospecção',
    ARRAY['prospeccao', 'leads-quentes', 'lancamento']::text[],
    $html$<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>TBO</title>
  </head>
  <body style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:32px 40px 16px 40px;">
                <p style="margin:0 0 16px 0;font-size:15px;line-height:1.65;">Olá, {{primeiro_nome}}.</p>

                <p style="margin:0 0 16px 0;font-size:15px;line-height:1.65;">
                  Acompanhamos de perto o mercado de lançamentos imobiliários em Santa Catarina, e a {{empresa}} entrou no nosso radar pelo perfil dos produtos que vêm desenvolvendo.
                </p>

                <p style="margin:0 0 16px 0;font-size:15px;line-height:1.65;">
                  Existe um ponto que observamos com frequência em lançamentos nessa etapa de estruturação dos materiais comerciais: muitas incorporadoras tratam imagens 3D e audiovisual como entregas independentes. Faz sentido operacionalmente, mas na prática fragmenta a forma como o produto é percebido pelo mercado.
                </p>

                <p style="margin:0 0 16px 0;font-size:15px;line-height:1.65;">
                  Quando isso acontece, o empreendimento perde clareza na comunicação e o comprador não entende exatamente o posicionamento, nem o nível de produto que está sendo apresentado.
                </p>

                <p style="margin:0 0 16px 0;font-size:15px;line-height:1.65;color:#6b7280;font-style:italic;">
                  O 3D comunica uma coisa. O vídeo comunica outra.
                </p>

                <p style="margin:0 0 24px 0;font-size:15px;line-height:1.65;">
                  Isso gera dúvida, reduz segurança na decisão e impacta diretamente a velocidade de venda e a capacidade de sustentar preço.
                </p>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-left:3px solid #111827;background:#fafaf9;margin:0 0 24px 0;">
                  <tr>
                    <td style="padding:16px 20px;">
                      <p style="margin:0 0 12px 0;font-size:13px;line-height:1.6;color:#374151;font-weight:600;">
                        Um exemplo prático:
                      </p>
                      <p style="margin:0 0 12px 0;font-size:14px;line-height:1.65;color:#374151;">
                        Em um lançamento em Joinville/SC, fomos envolvidos no desenvolvimento dos materiais com um direcionamento claro: refletir a atmosfera característica da cidade — mais densa, com presença constante da chuva — algo que faz parte da identidade local e ressoa com o público.
                      </p>
                      <p style="margin:0 0 12px 0;font-size:14px;line-height:1.65;color:#374151;">
                        A partir disso, desenvolvemos as imagens 3D e o filme de lançamento sob a mesma direção criativa, com um storytelling unificado, mesma paleta, mesma atmosfera e mesma linguagem visual.
                      </p>
                      <p style="margin:0;font-size:14px;line-height:1.65;color:#374151;">
                        O resultado não foi apenas consistência estética, mas uma comunicação mais convincente — o material deixou de ser apenas bonito e passou a ser coerente com o contexto real do produto.
                      </p>
                    </td>
                  </tr>
                </table>

                <p style="margin:0 0 16px 0;font-size:15px;line-height:1.65;">
                  Na TBO, atuamos de ponta a ponta no lançamento imobiliário, integrando <strong>Render, Audiovisual, Branding, Marketing e Experiências Imersivas</strong> sob uma única direção criativa.
                </p>

                <p style="margin:0 0 24px 0;font-size:15px;line-height:1.65;">
                  Isso garante não só consistência de narrativa e linguagem, mas também centralização das demandas — evitando a fragmentação entre fornecedores e trazendo mais controle sobre o resultado final.
                </p>

                <p style="margin:0 0 24px 0;font-size:15px;line-height:1.65;">
                  Como vocês estão avaliando as propostas nesse momento, acredito que esse ponto pode ajudar na comparação — principalmente no impacto que cada abordagem pode ter na construção do produto no mercado.
                </p>

                <p style="margin:0 0 32px 0;font-size:15px;line-height:1.65;">
                  Se fizer sentido, posso te mostrar de forma mais objetiva como estruturamos isso nos projetos — inclusive comparando com cenários mais tradicionais de mercado.
                </p>

                <p style="margin:0 0 4px 0;font-size:14px;line-height:1.5;color:#6b7280;">Um abraço,</p>
                <p style="margin:0;font-size:15px;line-height:1.5;font-weight:600;color:#111827;">Equipe TBO</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px;border-top:1px solid #e5e7eb;background:#fafaf9;">
                <p style="margin:0;font-size:11px;line-height:1.5;color:#9ca3af;">
                  TBO — Render · Audiovisual · Branding · Marketing · Experiências Imersivas<br />
                  <a href="https://wearetbo.com.br" style="color:#9ca3af;text-decoration:underline;">wearetbo.com.br</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>$html$
  );

  RAISE NOTICE 'Template "Prospecção Quente – TBO" seed ok';
END $$;
