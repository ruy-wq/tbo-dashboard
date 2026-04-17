// ============================================================================
// Gera dois DOCX de passo-a-passo:
//   1. docs/guides/guia-emails-cadencia-pipeline.docx
//   2. docs/guides/guia-newsletter.docx
//
// Executar com: node docs/guides/build-guides.js
// ============================================================================

const fs = require("fs");
const path = require("path");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  Header,
  Footer,
  AlignmentType,
  LevelFormat,
  HeadingLevel,
  BorderStyle,
  WidthType,
  ShadingType,
  PageNumber,
  ExternalHyperlink,
} = require("docx");

// ─── Constantes de estilo ────────────────────────────────────────────

const COLORS = {
  tbo: "E85102",
  tboDark: "0A0A0A",
  text: "171717",
  muted: "525252",
  border: "E5E5E5",
  bgTip: "FFF5EE",
  bgWarn: "FEF3C7",
  bgCode: "F4F4F5",
};

const FONT = "Helvetica";
const FONT_MONO = "Consolas";

const border = {
  style: BorderStyle.SINGLE,
  size: 4,
  color: COLORS.border,
};
const cellBorders = { top: border, bottom: border, left: border, right: border };

// ─── Helpers de paragrafos ───────────────────────────────────────────

function title(text) {
  return new Paragraph({
    heading: HeadingLevel.TITLE,
    alignment: AlignmentType.LEFT,
    spacing: { before: 0, after: 120 },
    children: [new TextRun({ text, bold: true, size: 56, color: COLORS.tboDark, font: FONT })],
  });
}

function subtitle(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 0, after: 400 },
    children: [new TextRun({ text, size: 24, color: COLORS.muted, font: FONT })],
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 180 },
    children: [new TextRun({ text, bold: true, size: 36, color: COLORS.tbo, font: FONT })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 140 },
    children: [new TextRun({ text, bold: true, size: 28, color: COLORS.tboDark, font: FONT })],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, bold: true, size: 24, color: COLORS.text, font: FONT })],
  });
}

function p(runsOrText) {
  const children = Array.isArray(runsOrText)
    ? runsOrText
    : [new TextRun({ text: runsOrText, size: 22, color: COLORS.text, font: FONT })];
  return new Paragraph({
    spacing: { before: 80, after: 80, line: 300 },
    children,
  });
}

function b(text) {
  return new TextRun({ text, bold: true, size: 22, color: COLORS.tboDark, font: FONT });
}
function t(text) {
  return new TextRun({ text, size: 22, color: COLORS.text, font: FONT });
}
function code(text) {
  return new TextRun({
    text,
    size: 20,
    color: COLORS.tboDark,
    font: FONT_MONO,
    shading: { type: ShadingType.CLEAR, fill: COLORS.bgCode },
  });
}
function link(text, url) {
  return new ExternalHyperlink({
    link: url,
    children: [new TextRun({ text, size: 22, color: COLORS.tbo, font: FONT, underline: {} })],
  });
}

function bullet(text, level = 0) {
  const children = typeof text === "string" ? [t(text)] : text;
  return new Paragraph({
    numbering: { reference: "bullets", level },
    spacing: { before: 40, after: 40, line: 280 },
    children,
  });
}

function numbered(text, level = 0) {
  const children = typeof text === "string" ? [t(text)] : text;
  return new Paragraph({
    numbering: { reference: "numbers", level },
    spacing: { before: 60, after: 60, line: 280 },
    children,
  });
}

// Caixa visual (tip / alerta) usando tabela 1×1 com shading
function calloutBox(label, bodyRuns, bgColor) {
  const labelRun = new TextRun({
    text: label.toUpperCase(),
    bold: true,
    size: 18,
    color: COLORS.tbo,
    font: FONT_MONO,
  });
  const bodyChildren = Array.isArray(bodyRuns)
    ? bodyRuns
    : [new TextRun({ text: bodyRuns, size: 22, color: COLORS.text, font: FONT })];

  return new Table({
    width: { size: 9026, type: WidthType.DXA }, // A4 content width ~ 9026 dxa
    columnWidths: [9026],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: {
              top: { style: BorderStyle.SINGLE, size: 16, color: COLORS.tbo },
              left: { style: BorderStyle.SINGLE, size: 32, color: COLORS.tbo },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border },
              right: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border },
            },
            width: { size: 9026, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: bgColor },
            margins: { top: 180, bottom: 180, left: 260, right: 220 },
            children: [
              new Paragraph({
                spacing: { before: 0, after: 80 },
                children: [labelRun],
              }),
              new Paragraph({
                spacing: { before: 0, after: 0, line: 280 },
                children: bodyChildren,
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function tip(text) {
  const runs = Array.isArray(text) ? text : [t(text)];
  return calloutBox("DICA", runs, COLORS.bgTip);
}
function warn(text) {
  const runs = Array.isArray(text) ? text : [t(text)];
  return calloutBox("ATENÇÃO", runs, COLORS.bgWarn);
}

// Divisor fino abaixo de um parágrafo
function divider() {
  return new Paragraph({
    spacing: { before: 120, after: 120 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: COLORS.border, space: 4 },
    },
    children: [new TextRun({ text: "", size: 2 })],
  });
}

// Spacer
function spacer(size = 200) {
  return new Paragraph({ spacing: { before: size / 2, after: size / 2 }, children: [new TextRun({ text: "" })] });
}

// Tabela simples 2 colunas (key-value)
function kvTable(rows) {
  const tableRows = rows.map(([k, v]) =>
    new TableRow({
      children: [
        new TableCell({
          borders: cellBorders,
          width: { size: 3000, type: WidthType.DXA },
          shading: { type: ShadingType.CLEAR, fill: "FAFAFA" },
          margins: { top: 100, bottom: 100, left: 160, right: 120 },
          children: [
            new Paragraph({
              children: [new TextRun({ text: k, bold: true, size: 20, color: COLORS.tboDark, font: FONT })],
            }),
          ],
        }),
        new TableCell({
          borders: cellBorders,
          width: { size: 6026, type: WidthType.DXA },
          margins: { top: 100, bottom: 100, left: 160, right: 120 },
          children: [
            new Paragraph({
              children: Array.isArray(v)
                ? v
                : [new TextRun({ text: v, size: 20, color: COLORS.text, font: FONT })],
            }),
          ],
        }),
      ],
    }),
  );
  return new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: [3000, 6026],
    rows: tableRows,
  });
}

// Tabela de cabeçalho + linhas (n colunas)
function dataTable(headers, rows, colWidths) {
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) =>
      new TableCell({
        borders: cellBorders,
        width: { size: colWidths[i], type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, fill: COLORS.tboDark },
        margins: { top: 120, bottom: 120, left: 140, right: 120 },
        children: [
          new Paragraph({
            children: [new TextRun({ text: h, bold: true, size: 20, color: "FFFFFF", font: FONT })],
          }),
        ],
      }),
    ),
  });
  const dataRows = rows.map((row) =>
    new TableRow({
      children: row.map((cell, i) =>
        new TableCell({
          borders: cellBorders,
          width: { size: colWidths[i], type: WidthType.DXA },
          margins: { top: 100, bottom: 100, left: 140, right: 120 },
          children: [
            new Paragraph({
              children: Array.isArray(cell)
                ? cell
                : [new TextRun({ text: String(cell), size: 20, color: COLORS.text, font: FONT })],
            }),
          ],
        }),
      ),
    }),
  );
  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...dataRows],
  });
}

// ─── Configuração comum de documento ─────────────────────────────────

function buildDocConfig(title, sectionChildren) {
  return new Document({
    creator: "TBO OS",
    title,
    styles: {
      default: { document: { run: { font: FONT, size: 22, color: COLORS.text } } },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 36, bold: true, font: FONT, color: COLORS.tbo },
          paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 0 },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 28, bold: true, font: FONT, color: COLORS.tboDark },
          paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 1 },
        },
        {
          id: "Heading3",
          name: "Heading 3",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 24, bold: true, font: FONT, color: COLORS.text },
          paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 },
        },
      ],
    },
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 540, hanging: 240 } } },
            },
            {
              level: 1,
              format: LevelFormat.BULLET,
              text: "◦",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 1020, hanging: 240 } } },
            },
          ],
        },
        {
          reference: "numbers",
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 540, hanging: 300 } } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [
                  new TextRun({
                    text: "TBO OS — Guia Interno",
                    size: 16,
                    color: COLORS.muted,
                    font: FONT_MONO,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: "Página ",
                    size: 16,
                    color: COLORS.muted,
                    font: FONT_MONO,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    color: COLORS.muted,
                    font: FONT_MONO,
                  }),
                ],
              }),
            ],
          }),
        },
        children: sectionChildren,
      },
    ],
  });
}

// ════════════════════════════════════════════════════════════════════
// DOC 1 — Emails por etapa do funil (/comercial/pipeline)
// ════════════════════════════════════════════════════════════════════

function buildEmailsFunilDoc() {
  const children = [];

  // Capa
  children.push(
    new Paragraph({
      spacing: { before: 600, after: 0 },
      children: [
        new TextRun({
          text: "GUIA INTERNO · TBO OS",
          bold: true,
          size: 18,
          color: COLORS.tbo,
          font: FONT_MONO,
        }),
      ],
    }),
  );
  children.push(title("Geração de emails por etapa do funil"));
  children.push(
    subtitle(
      "Como usar a IA do TBO OS para gerar emails personalizados em cada estágio do pipeline comercial — do login ao disparo do rascunho.",
    ),
  );

  children.push(
    kvTable([
      ["Módulo", "Comercial / Pipeline"],
      ["Rota", [code("/comercial/pipeline")]],
      ["Feature", "Rascunhos de e-mail com IA (drawer lateral)"],
      ["Modelo de IA", "Claude Sonnet 4.6"],
      ["Destinatário", "1 por deal (email 1-a-1, não campanha em massa)"],
      ["Quem pode usar", "Founder, Diretoria, Líder, Colaborador (conforme RBAC)"],
    ]),
  );

  children.push(spacer(400));

  // Visão geral
  children.push(h1("Visão geral"));
  children.push(
    p(
      "O TBO OS gera automaticamente 3 variações de email para cada deal, adaptadas à etapa do funil em que o deal está. Cada etapa tem um playbook próprio (labels, tons, ângulos, placeholders). Você escolhe a variação, revisa, edita se precisar, e dispara.",
    ),
  );
  children.push(
    p([
      b("O sistema é contextual: "),
      t(
        "o mesmo deal em “Lead” e em “Proposta em Aberto” recebe abordagens completamente diferentes. A IA considera nome do deal (escopo), empresa, valor estimado, origem, histórico de atividades e posts recentes do blog TBO.",
      ),
    ]),
  );

  // Variações por etapa
  children.push(h2("Variações disponíveis por etapa"));
  children.push(
    dataTable(
      ["Etapa", "3 variações geradas", "Foco editorial"],
      [
        ["Lead", "Consultivo · Observação · Provocação", "Aquecer contato frio"],
        ["Qualificação", "Diagnóstico · Case/Prova · Próximo Passo", "Aprofundar entendimento"],
        ["Proposta em Aberto", "Reforço de Valor · Resposta a Objeção · Case Similar", "Sustentar valor sem pressionar"],
        ["Negociação", "Segurança na Escolha · Diferenciação · ROI Percebido", "Reduzir atrito final"],
        ["Fechado Ganho", "Alinhamento · Próxima Frente · Ponte pra Indicação", "Relacionamento e expansão"],
        ["Fechado Perdido", "Observação Recente · Mudança de Cenário · Diagnóstico", "Re-engajamento discreto"],
      ],
      [2200, 3500, 3326],
    ),
  );

  children.push(spacer(300));

  // Passo a passo
  children.push(h1("Passo a passo"));

  children.push(h2("1. Acessar o TBO OS"));
  children.push(
    numbered([
      t("Abra "),
      link("https://tbo-dashboard-main.vercel.app", "https://tbo-dashboard-main.vercel.app"),
      t(" (ou o domínio de produção que o time usar)."),
    ]),
  );
  children.push(numbered("Faça login com Google usando seu email @agenciatbo.com.br ou @wearetbo.com.br."));
  children.push(
    tip([
      t("Se o login não aparecer com Google, confirme com o admin se sua conta foi adicionada ao RBAC. O TBO OS é "),
      b("single-tenant"),
      t(" — só esses dois domínios têm acesso."),
    ]),
  );

  children.push(h2("2. Navegar até o Pipeline"));
  children.push(numbered("No menu superior (topbar), clique no ícone do grupo Comercial."));
  children.push(
    numbered([
      t("Clique em "),
      b("Pipeline"),
      t(" no submenu. A URL muda para "),
      code("/comercial/pipeline"),
      t("."),
    ]),
  );
  children.push(
    p(
      "Você vai ver o kanban de deals agrupados por etapa, KPIs no topo (Pipeline Ativo, Forecast Ponderado, Ganhos, Conversão) e filtros por busca, etapa e responsável.",
    ),
  );

  children.push(h2("3. Localizar ou criar o deal"));
  children.push(
    bullet([
      b("Deal existente: "),
      t("use a busca no topo ou filtros. Clique no card do deal para abrir o detalhe lateral."),
    ]),
  );
  children.push(
    bullet([
      b("Deal novo: "),
      t("clique em "),
      code("+ Novo Deal"),
      t(" no canto superior direito e preencha nome, empresa, contato, email, valor e etapa inicial."),
    ]),
  );
  children.push(
    warn([
      t("O campo "),
      b("email do contato"),
      t(" é obrigatório pra geração de IA funcionar bem. Sem ele, a IA ainda gera texto, mas você não consegue enviar depois."),
    ]),
  );

  children.push(h2("4. Abrir o drawer de rascunhos com IA"));
  children.push(
    numbered(
      "Com o deal aberto (drawer de detalhe visível à direita), localize a aba ou botão que diz “Rascunhos de email com IA” (ícone de estrela/sparkles).",
    ),
  );
  children.push(
    numbered("Clique para expandir o painel lateral de rascunhos. Esse é o cockpit da feature."),
  );
  children.push(
    p([
      t("O drawer mostra o nome do deal e da empresa no topo, um botão "),
      code("Gerar rascunhos"),
      t(" e abaixo uma lista vazia (ou com rascunhos de gerações anteriores, se houver)."),
    ]),
  );

  children.push(h2("5. Gerar os 3 rascunhos"));
  children.push(
    numbered([
      t("Clique em "),
      code("Gerar rascunhos"),
      t(" (ou "),
      code("Gerar novos"),
      t(" se já houver rascunho anterior)."),
    ]),
  );
  children.push(numbered("Aguarde 15-25s. Um banner violeta indica que a IA está montando o contexto e consultando Claude."));
  children.push(
    numbered(
      "Quando terminar, um cartão novo aparece no topo do drawer com 3 abas — uma por variação (ex.: Reforço de Valor / Resposta a Objeção / Case Similar para um deal em Proposta).",
    ),
  );
  children.push(
    tip([
      b("O que a IA usa como contexto: "),
      t(
        "nome do deal (escopo do projeto), empresa, contato, valor, origem, últimas atividades, posts recentes do blog TBO (para não repetir), cases featured do portfólio e o playbook da etapa atual.",
      ),
    ]),
  );

  children.push(h2("6. Navegar entre as variações"));
  children.push(
    p(
      "Cada aba mostra uma variação com tom e ângulo distintos. Clique na aba pra alternar. A variação selecionada fica marcada com um check verde — é a que será editada e, eventualmente, enviada.",
    ),
  );
  children.push(h3("O que ver em cada variação"));
  children.push(bullet([b("Assunto: "), t("em capitalização natural, sem pontuação final.")]));
  children.push(bullet([b("Corpo: "), t("até 180 palavras, com saudação humana usando o primeiro nome em negrito.")]));
  children.push(
    bullet([
      b("Placeholders de mídia: "),
      code("{{imagem}}"),
      t(", "),
      code("{{video}}"),
      t(" ou "),
      code("{{gif}}"),
      t(" aparecem como blocos visuais tracejados no preview."),
    ]),
  );
  children.push(bullet([b("Tipografia: "), t("negrito em dados/nomes/conceitos, itálico em termos estrangeiros, separador decorativo . . . . entre blocos.")]));

  children.push(h2("7. Preview e edição"));
  children.push(h3("Modo Preview (padrão)"));
  children.push(
    p(
      "Mostra o email renderizado com o template TBO completo — eyebrow (ex.: BOA TARDE), logo, H1, corpo formatado e rodapé oficial. É o que o destinatário vai ver.",
    ),
  );
  children.push(h3("Modo Texto"));
  children.push(
    p("Mostra o corpo em markdown cru. Útil pra ver a estrutura exata (bolds, itálicos, separadores, placeholders) antes de editar."),
  );
  children.push(h3("Editar"));
  children.push(
    numbered([
      t("Clique em "),
      code("Editar"),
      t(" no rodapé da variação ativa."),
    ]),
  );
  children.push(numbered("O assunto vira input e o corpo vira textarea. A toolbar acima do corpo mostra botões de ação."));
  children.push(numbered("Edite à vontade. A saudação já usa {{primeiro_nome}} — o Mailchimp troca pelo nome real no envio."));
  children.push(
    numbered([
      t("Quando terminar, clique em "),
      code("Salvar edição"),
      t(". O status do draft muda de rascunho para “editado”."),
    ]),
  );

  children.push(h2("8. Inserir mídia (imagem, GIF, vídeo)"));
  children.push(
    p(
      "A IA insere placeholders automaticamente onde faz sentido (ex.: depois do parágrafo do case). Você troca por mídia real de duas formas:",
    ),
  );
  children.push(h3("Opção A — Drag and drop"));
  children.push(
    numbered("Arraste um arquivo de imagem/vídeo da sua área de trabalho direto sobre o textarea do corpo."),
  );
  children.push(
    numbered(
      "Se houver um placeholder do tipo correspondente (ex.: placeholder de imagem e você arrastou uma imagem), ele é substituído automaticamente.",
    ),
  );
  children.push(
    numbered("Se não houver placeholder, a mídia é inserida na posição do cursor."),
  );
  children.push(h3("Opção B — Toolbar"));
  children.push(
    numbered([
      t("Clique em "),
      code("Imagem"),
      t(", "),
      code("GIF"),
      t(" ou "),
      code("Vídeo"),
      t(" na toolbar."),
    ]),
  );
  children.push(
    numbered(
      "O dialog abre. Escolha upload local (até 10 MB) ou cole uma URL externa (YouTube/Vimeo pra vídeo).",
    ),
  );
  children.push(
    numbered([
      t("Adicione um "),
      b("texto alt"),
      t(" curto e clique em "),
      code("Inserir"),
      t("."),
    ]),
  );
  children.push(h3("Adicionar novo placeholder"));
  children.push(
    p([
      t("Use o botão "),
      code("+ Placeholder"),
      t(" (dropdown) se quiser adicionar um token extra de mídia no corpo. Pessoa enche depois."),
    ]),
  );
  children.push(
    tip([
      b("Importante: "),
      t("placeholders que ficarem "),
      b("não preenchidos"),
      t(" até o envio são removidos automaticamente. O destinatário nunca vê o token "),
      code("{{imagem}}"),
      t("."),
    ]),
  );

  children.push(h2("9. Salvar ou descartar"));
  children.push(
    bullet([
      b("Salvar: "),
      t("mantém o rascunho no histórico. Fica disponível pra edição e envio mais tarde."),
    ]),
  );
  children.push(
    bullet([
      b("Descartar: "),
      t("o rascunho vai pro histórico com status “descartado” e some da lista ativa."),
    ]),
  );
  children.push(
    bullet([
      b("Gerar novos: "),
      t("cria outro cartão com 3 variações frescas, usando ângulos diferentes dos já tentados (anti-repetição)."),
    ]),
  );

  children.push(h2("10. Enviar (1-a-1)"));
  children.push(
    warn(
      "Neste momento, o botão Enviar mostra um toast “em breve” — a integração de envio 1-a-1 via Mailchimp está na próxima iteração. Por enquanto, copie o conteúdo final e envie manualmente pela sua caixa ou use o módulo Newsletter (pra campanha em lote).",
    ),
  );

  // Bonus: batch
  children.push(h1("Bônus: gerar em lote por etapa"));
  children.push(
    p(
      "No topo da página Pipeline há um botão Gerar emails IA que dispara geração para múltiplos deals de uma mesma etapa ao mesmo tempo.",
    ),
  );
  children.push(
    numbered([
      t("Clique em "),
      code("Gerar emails IA"),
      t(" no header da página."),
    ]),
  );
  children.push(numbered("Escolha a etapa (ex.: Proposta em Aberto) no dropdown do modal."));
  children.push(
    numbered(
      "Selecione os deals que devem receber (curadoria manual — não precisa gerar pra todos).",
    ),
  );
  children.push(
    numbered(
      "Clique em Gerar. Uma barra de progresso mostra concurrency 3 — 3 deals em paralelo.",
    ),
  );
  children.push(
    numbered(
      "Rascunhos ficam salvos por deal e podem ser revisados individualmente depois.",
    ),
  );

  // FAQ
  children.push(h1("Perguntas frequentes"));

  children.push(h3("Por que a IA gerou 3 variações com ângulos parecidos?"));
  children.push(
    p(
      "Pode ser que o deal esteja numa etapa com playbook apertado (ex.: Negociação). Tente “Gerar novos” — a IA recebe os ângulos já usados e escolhe abordagens diferentes.",
    ),
  );

  children.push(h3("Posso mudar o playbook de uma etapa?"));
  children.push(
    p([
      t("Sim, mas é alteração de código. Os playbooks ficam em "),
      code("supabase/functions/generate-ai-email-drafts/stage-playbooks.ts"),
      t(". Cada etapa tem 3 variações com label, tom, objetivo e pool de ângulos. Alinhe com o time comercial antes de mudar."),
    ]),
  );

  children.push(h3("A IA pode inventar casos que não existem?"));
  children.push(
    p(
      "O prompt instrui a IA a usar apenas cases do portfólio real fornecidos no contexto (tabela portfolio_items, itens featured). Mesmo assim, sempre revise antes de enviar. Se algum caso soa invenção, é.",
    ),
  );

  children.push(h3("Posso pausar a cadência quando o lead responder?"));
  children.push(
    p(
      "A lógica de scheduler automático (cadência com pausa em resposta) ainda não foi implementada. Por enquanto, cada geração é manual. Roadmap: tabela crm_deal_cadence + cron diário + badge no card do deal.",
    ),
  );

  children.push(h3("Posso usar isso em inglês?"));
  children.push(
    p(
      "Não — o sistema é especializado em português brasileiro com tom editorial executivo. Se precisar de outro idioma, alinhe com o time de produto.",
    ),
  );

  // Closing
  children.push(divider());
  children.push(
    p([
      b("Dúvidas técnicas: "),
      t("time de produto / "),
      link("contato@agenciatbo.com.br", "mailto:contato@agenciatbo.com.br"),
    ]),
  );

  return buildDocConfig("Guia: Emails por etapa do funil", children);
}

// ════════════════════════════════════════════════════════════════════
// DOC 2 — Newsletter (/marketing/newsletter)
// ════════════════════════════════════════════════════════════════════

function buildNewsletterDoc() {
  const children = [];

  // Capa
  children.push(
    new Paragraph({
      spacing: { before: 600, after: 0 },
      children: [
        new TextRun({
          text: "GUIA INTERNO · TBO OS",
          bold: true,
          size: 18,
          color: COLORS.tbo,
          font: FONT_MONO,
        }),
      ],
    }),
  );
  children.push(title("Geração de Newsletter com IA"));
  children.push(
    subtitle(
      "Como usar a curadoria + IA do TBO OS pra gerar a newsletter editorial enviada pra toda a base (clientes, leads e inscritos).",
    ),
  );

  children.push(
    kvTable([
      ["Módulo", "Marketing / Newsletter"],
      ["Rota", [code("/marketing/newsletter/gerar")]],
      ["Feature", "Gerar Newsletter com IA (curadoria web + redação)"],
      ["Modelos de IA", "Haiku 4.5 (curadoria) · Sonnet 4.6 (redação)"],
      ["Destinatário", "Broadcast — toda a base ou segmento específico"],
      ["Frequência sugerida", "2-3 edições por semana (seguindo padrão editorial)"],
    ]),
  );

  children.push(spacer(400));

  // Visão geral
  children.push(h1("Visão geral"));
  children.push(
    p(
      "A newsletter do TBO OS é um canal editorial — não comercial. A graça é conteúdo denso e relevante no estilo de publicações como The News Business, Morning Brew, Monocle e Wallpaper. Zero pitch, zero CTA de venda.",
    ),
  );
  children.push(
    p([
      b("Cada edição tem estrutura fixa: "),
      t(
        "abertura com hook (storytelling), preview em blockquote, seção Trending Now opcional, 1-2 blocos principais, aspas do dia e fechamento leve. Máximo 600 palavras.",
      ),
    ]),
  );

  children.push(h2("Diferença entre Newsletter e email outbound"));
  children.push(
    dataTable(
      ["Característica", "Email Outbound (pipeline)", "Newsletter"],
      [
        ["Público", "1 lead específico", "Base inteira"],
        ["Tom", "Consultivo, executivo pra executivo", "Editorial, coluna denso-coloquial"],
        ["Objetivo", "Fazer o lead avançar no funil", "Criar familiaridade e autoridade"],
        ["Personalização", "Nome, empresa, escopo do projeto", "Apenas FNAME (primeiro nome)"],
        ["CTA", "Pergunta aberta sobre o negócio", "Nenhum — é editorial"],
        ["Tamanho", "Até 180 palavras", "Até 600 palavras"],
      ],
      [2200, 3400, 3426],
    ),
  );

  children.push(spacer(300));

  // Passo a passo
  children.push(h1("Passo a passo"));

  children.push(h2("1. Acessar o TBO OS"));
  children.push(
    numbered([
      t("Abra "),
      link("https://tbo-dashboard-main.vercel.app", "https://tbo-dashboard-main.vercel.app"),
      t(" e faça login com seu Google @agenciatbo.com.br ou @wearetbo.com.br."),
    ]),
  );

  children.push(h2("2. Navegar até Newsletter"));
  children.push(numbered("No topbar, clique no grupo Marketing."));
  children.push(
    numbered([
      t("Clique em "),
      b("Newsletter"),
      t(" no submenu. A URL muda para "),
      code("/marketing/newsletter"),
      t("."),
    ]),
  );
  children.push(
    p(
      "A home do módulo mostra KPIs (Templates, Segmentos, Campanhas, Enviadas, Envios) e um card destacado “Gerar Newsletter com IA” no topo, com badge “Novo” em laranja.",
    ),
  );

  children.push(h2("3. Iniciar a geração"));
  children.push(
    numbered([
      t("Clique no card laranja "),
      b("Gerar Newsletter com IA"),
      t(". A URL muda para "),
      code("/marketing/newsletter/gerar"),
      t("."),
    ]),
  );
  children.push(
    p(
      "A tela abre em layout split: painel de briefing à esquerda (400px), preview à direita. Abaixo do briefing fica o histórico de rascunhos recentes.",
    ),
  );

  children.push(h2("4. Preencher o briefing"));
  children.push(h3("4.1 Tema principal (obrigatório)"));
  children.push(
    p(
      "Textarea no topo. Descreva o ângulo editorial em 1-3 frases — não só a palavra-chave. Quanto mais específico, melhor o output.",
    ),
  );
  children.push(
    tip([
      b("Exemplo ruim: "),
      t("“arquitetura”"),
      t(". "),
      b("Exemplo bom: "),
      t(
        "“marcas próprias virando protagonistas no varejo de luxo — e o que isso ensina pra incorporação premium”.",
      ),
    ]),
  );

  children.push(h3("4.2 Sugerir temas do dia (atalho)"));
  children.push(
    p([
      t("Se você não tem um tema pronto, clique no botão "),
      b("✨ Sugerir temas do dia"),
      t(" acima do textarea."),
    ]),
  );
  children.push(
    numbered(
      "O modal “Sugestões do editor-chefe IA” abre. Clique em “Buscar temas do dia”.",
    ),
  );
  children.push(
    numbered(
      "Aguarde 30-60s. A IA (Haiku 4.5) faz 5 buscas web em fontes curadas (ArchDaily, Dezeen, Wallpaper, Casa Vogue, Valor, Metro Quadrado, Monocle, Mansion Global, Knight Frank e +40 outras), cruza com artigos já publicados no blog TBO nos últimos 30 dias e retorna 4-5 temas novos.",
    ),
  );
  children.push(
    numbered(
      "Cada card de tema mostra: título, universos cruzados (badges), ângulo completo, POV sugerido (caixa destacada em laranja), why now (gatilho temporal), SEO keyword e fontes linkadas.",
    ),
  );
  children.push(
    numbered([
      t("Clique em "),
      code("Usar este tema"),
      t(" no card desejado. O textarea é preenchido automaticamente com ângulo + POV + fontes."),
    ]),
  );
  children.push(
    tip([
      b("Regenerar: "),
      t(
        "se nenhum tema agradar, clique em “Regenerar” no canto superior direito do modal. A IA faz nova rodada com ângulos diferentes.",
      ),
    ]),
  );

  children.push(h3("4.3 Tom"));
  children.push(p("Select com 5 opções:"));
  children.push(
    bullet([
      b("Informativo denso "),
      t("— padrão. Newsletter factual com profundidade."),
    ]),
  );
  children.push(bullet([b("Provocativo "), t("— questiona consensos do mercado.")]));
  children.push(bullet([b("Reflexivo "), t("— convida à pausa e análise.")]));
  children.push(bullet([b("Curioso/descontraído "), t("— humor mais presente.")]));
  children.push(bullet([b("Analítico "), t("— dados e gráficos em primeiro plano.")]));

  children.push(h3("4.4 Horário"));
  children.push(
    p(
      "Define o eyebrow que aparece acima do título: BOM DIA (até 12h), BOA TARDE (12-18h) ou BOA NOITE (depois das 18h). Escolha o horário REAL em que vai enviar, não o de geração.",
    ),
  );

  children.push(h3("4.5 Público"));
  children.push(
    p(
      "Define o tom da audiência esperada, não o segmento de envio. As 4 opções são: Toda a base, Apenas clientes ativos, Apenas leads em nutrição, Incorporadoras no radar (outbound).",
    ),
  );

  children.push(h3("4.6 Destaques (opcional, até 3)"));
  children.push(
    p(
      "Se você quer GARANTIR que a edição desenvolva temas específicos (ex.: “Walmart redesenha Great Value”, “Brasil volta ao mercado de euros”), adicione aqui. A IA usa como âncoras dos blocos principais.",
    ),
  );
  children.push(
    p([
      t("Clique em "),
      code("+ Adicionar"),
      t(" pra incluir destaque. Clique no ícone de lixeira pra remover."),
    ]),
  );

  children.push(h3("4.7 Toggle Trending Now"));
  children.push(
    p(
      "Quando ligado (padrão), a IA inclui uma seção “### Trending Now” com 3 bullets curtos de tendências/observações recentes, incluindo links reais do blog TBO. Quando desligado, a edição vai mais enxuta, focada no tema principal.",
    ),
  );

  children.push(h2("5. Gerar a edição"));
  children.push(
    numbered([
      t("Clique no botão "),
      code("Gerar edição"),
      t(" no final do painel de briefing."),
    ]),
  );
  children.push(
    numbered(
      "Aguarde 10-20s. Um estado de loading com spinner laranja aparece no preview. A IA (Sonnet 4.6) redige a edição completa seguindo a estrutura obrigatória.",
    ),
  );
  children.push(
    numbered(
      "Quando terminar, o preview aparece à direita com o template TBO completo — eyebrow, logo, H1, corpo formatado, footer oficial.",
    ),
  );
  children.push(
    numbered(
      "O rascunho aparece no histórico (lado esquerdo, abaixo do briefing) com status “rascunho”.",
    ),
  );

  children.push(h2("6. Revisar e editar"));
  children.push(h3("6.1 Modos de visualização"));
  children.push(
    bullet([b("Preview: "), t("HTML renderizado como o destinatário vai ver (padrão).")]),
  );
  children.push(
    bullet([b("Markdown: "), t("corpo em markdown cru — útil pra revisar estrutura.")]),
  );

  children.push(h3("6.2 Editar"));
  children.push(
    numbered([
      t("Clique em "),
      code("Editar"),
      t(" no topo direito do preview."),
    ]),
  );
  children.push(
    p("Os 4 campos viram editáveis:"),
  );
  children.push(bullet([b("Eyebrow: "), t("label caps laranja no topo (ex.: BOA TARDE).")]));
  children.push(bullet([b("Assunto: "), t("o que aparece no inbox. Mantenha em minúscula ou capitalização natural, sem pontuação final.")]));
  children.push(bullet([b("Preheader: "), t("80-120 chars que complementam o assunto (preview do inbox).")]));
  children.push(
    bullet([
      b("Corpo (markdown): "),
      t("edite o conteúdo. Suporta **bold**, *itálico*, > blockquote, separador . . . ., `### Trending now` e placeholders "),
      code("{{imagem}}"),
      t("."),
    ]),
  );
  children.push(
    numbered([
      t("Clique em "),
      code("Salvar"),
      t(" no topo. O status muda pra “editado”."),
    ]),
  );

  children.push(h3("6.3 Regenerar se necessário"));
  children.push(
    p(
      "Se o resultado não agradou, volte ao briefing (a cópia fica preservada), ajuste tema/tom/destaques e clique em Gerar edição novamente. Cada rascunho é salvo separadamente — nada é perdido.",
    ),
  );

  children.push(h2("7. Histórico de rascunhos"));
  children.push(
    p(
      "No lado esquerdo, abaixo do briefing, lista até 8 rascunhos recentes. Cada item mostra título, assunto, tempo relativo e status badge (rascunho / editado / enviado / descartado).",
    ),
  );
  children.push(
    bullet([b("Clicar em um rascunho antigo: "), t("abre no painel direito pra revisar/editar.")]),
  );
  children.push(
    bullet([b("Descartar: "), t("botão no topo do preview. Sai do histórico ativo.")]),
  );

  children.push(h2("8. Enviar pra base"));
  children.push(
    warn(
      "Neste momento, o botão Enviar pra base mostra um toast “em breve” — a integração de envio broadcast via Mailchimp está na próxima iteração. Por enquanto, copie o assunto + HTML (modo Preview → view source, ou exporte via ferramenta) e crie a campanha manualmente no módulo /marketing/newsletter/campanhas.",
    ),
  );

  // Checklist editorial
  children.push(h1("Checklist editorial antes de enviar"));
  children.push(
    p("Rodar essa checklist em cada edição antes de disparar pra base:"),
  );
  children.push(bullet("Abertura tem HOOK real (storytelling, fato histórico, dado surpreendente) e não saudação genérica tipo “Olá!”"));
  children.push(bullet("Preview em blockquote resume a edição sem spoiler total"));
  children.push(bullet("Separadores . . . . estão entre blocos editoriais grandes (não entre parágrafos)"));
  children.push(bullet("Seção Trending Now (se incluída) tem 2-3 bullets com emoji + LABEL em caps"));
  children.push(bullet("Bloco principal tem dados em negrito e pelo menos 1 frase em blockquote de peso"));
  children.push(bullet("Aspas do dia é citação real, com atribuição (nome + cargo/empresa em itálico)"));
  children.push(bullet("Fechamento é leve, editorial (“Até a próxima.” / “Semana que vem tem mais.”) — nunca “cordialmente”"));
  children.push(bullet("Não tem linguagem de agência, “premium”, clichês ou fórmulas coaching"));
  children.push(bullet("Acentuação pt-BR completa (ç, ã, õ, acentos agudos e circunflexos) sem erro"));
  children.push(bullet("Máximo 600 palavras — densa mas não longa"));

  // FAQ
  children.push(h1("Perguntas frequentes"));

  children.push(h3("Quantas buscas web a IA faz por edição?"));
  children.push(
    p(
      "A curadoria de temas (botão Sugerir temas) faz 5 buscas agrupadas — uma por universo (Arquitetura, Interiores/Arte, Mercado BR, Branding, UHNW global). Cada busca combina 6-10 sites via operador OR. A redação da edição em si não faz busca web; usa o briefing + conhecimento interno do modelo.",
    ),
  );

  children.push(h3("Por que às vezes a curadoria trava ou demora?"));
  children.push(
    p(
      "Pode ser rate limit da Anthropic API (limite de tokens por minuto). Se aparecer mensagem “RATE_LIMIT: aguarde ~1 minuto”, é isso. Aguarde 60s e tente novamente. O sistema tem prompt caching ativo, então chamadas subsequentes ficam mais baratas/rápidas.",
    ),
  );

  children.push(h3("Posso salvar rascunho e voltar depois?"));
  children.push(
    p(
      "Sim. Todos os rascunhos ficam salvos automaticamente em ai_newsletter_drafts. O histórico mostra os 8 mais recentes. Rascunhos descartados saem do histórico ativo mas não são deletados do banco.",
    ),
  );

  children.push(h3("O que o eyebrow controla?"));
  children.push(
    p(
      "É o label caps acima do título (ex.: BOM DIA / BOA TARDE / BOA NOITE), renderizado em laranja TBO. Define tom do cumprimento. Você pode editar livremente — não precisa ser saudação, pode ser “EDIÇÃO #42” ou “TRENDING”.",
    ),
  );

  children.push(h3("Como saber se a IA está repetindo temas já publicados?"));
  children.push(
    p(
      "A curadoria consulta blog_posts (últimos 30 dias, status=publicado) e passa a lista pro modelo com instrução explícita de não repetir. Mesmo assim, sempre revise os temas sugeridos — se soar familiar, descarte e regenere.",
    ),
  );

  children.push(h3("A newsletter vai pra quem exatamente?"));
  children.push(
    p(
      "Por padrão, toda a base da audience Mailchimp “TBO - Prospeccao Outbound” (ID 3b6d78581f, account us21). Você pode escolher segmento específico no campo Público (ainda funciona só como contexto pra IA — segmentação real de envio é configurada no momento do disparo Mailchimp).",
    ),
  );

  // Closing
  children.push(divider());
  children.push(
    p([
      b("Dúvidas técnicas: "),
      t("time de produto / "),
      link("contato@agenciatbo.com.br", "mailto:contato@agenciatbo.com.br"),
    ]),
  );

  return buildDocConfig("Guia: Newsletter com IA", children);
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  const outDir = path.resolve(__dirname);

  const doc1 = buildEmailsFunilDoc();
  const buf1 = await Packer.toBuffer(doc1);
  const path1 = path.join(outDir, "guia-emails-cadencia-pipeline.docx");
  fs.writeFileSync(path1, buf1);
  console.log("✓", path1, `(${buf1.length} bytes)`);

  const doc2 = buildNewsletterDoc();
  const buf2 = await Packer.toBuffer(doc2);
  const path2 = path.join(outDir, "guia-newsletter.docx");
  fs.writeFileSync(path2, buf2);
  console.log("✓", path2, `(${buf2.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
