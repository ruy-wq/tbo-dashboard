/**
 * Parser de escopo para geração automática de propostas.
 *
 * Recebe texto livre colado pelo usuário descrevendo o escopo de imagens 3D
 * e extrai itens estruturados (título, descrição, quantidade).
 *
 * Formatos suportados:
 *
 *   fachada e implantação (2 imagens)
 *
 *   cobertura:
 *   bar da cobertura
 *   (2 imagens)
 *
 *   4 andar:
 *   - piscina
 *   - terraço com mesas (norte)
 *   (8 imagens)
 *
 *   - recepção (1 imagem)
 */

export interface ParsedScopeItem {
  title: string;
  description: string;
  quantity: number;
  section: string;
}

export interface ParsedScope {
  items: ParsedScopeItem[];
  totalImages: number;
}

// Match "(N imagem)" or "(N imagens)"
const IMAGE_COUNT_RE = /\((\d+)\s*imagens?\)/i;

// Match section headers like "cobertura:", "4 andar:", "térreo:", "4º andar:"
const SECTION_HEADER_RE = /^(.+?)\s*:\s*$/;

// Match bullet items like "- piscina" or "• piscina"
const BULLET_RE = /^[-•*]\s+(.+)/;

/**
 * Limpa e normaliza uma linha de texto.
 */
function cleanLine(line: string): string {
  return line.trim().replace(/\s+/g, " ");
}

/**
 * Capitaliza a primeira letra de uma string.
 */
function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Gera o título do item no padrão TBO: "Imagem 3D — {Nome}"
 */
function formatItemTitle(name: string): string {
  return `Imagem 3D — ${capitalize(name.trim())}`;
}

/**
 * Parseia o texto de escopo e retorna itens estruturados.
 */
export function parseScope(rawText: string): ParsedScope {
  const lines = rawText.split("\n").map(cleanLine).filter(Boolean);
  const items: ParsedScopeItem[] = [];

  let currentSection = "";
  let pendingItems: string[] = [];

  function flushPendingItems(quantity: number) {
    if (pendingItems.length === 0) return;

    // Se a quantidade total é especificada para o grupo, distribuímos 1 por item
    // a menos que haja apenas 1 item pendente (nesse caso, recebe a qtd total)
    const qtyPerItem =
      pendingItems.length === 1 ? quantity : 1;

    for (const itemName of pendingItems) {
      items.push({
        title: formatItemTitle(itemName),
        description: currentSection
          ? capitalize(currentSection)
          : "",
        quantity: qtyPerItem,
        section: currentSection,
      });
    }
    pendingItems = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this line is just an image count like "(8 imagens)"
    const pureCountMatch = line.match(/^\((\d+)\s*imagens?\)$/i);
    if (pureCountMatch) {
      const count = parseInt(pureCountMatch[1], 10);
      // This count applies to all pending items in the current section
      if (pendingItems.length > 0) {
        // Distribute: each pending item gets 1 image, total = count
        // If count matches pending items length, 1 each. Otherwise distribute.
        const qtyPerItem =
          pendingItems.length === count
            ? 1
            : pendingItems.length === 1
              ? count
              : 1;
        for (const itemName of pendingItems) {
          items.push({
            title: formatItemTitle(itemName),
            description: currentSection
              ? capitalize(currentSection)
              : "",
            quantity: qtyPerItem,
            section: currentSection,
          });
        }
        pendingItems = [];
      }
      continue;
    }

    // Check if this is a section header like "cobertura:" or "4 andar:"
    const sectionMatch = line.match(SECTION_HEADER_RE);
    if (sectionMatch) {
      // Flush any pending items from previous section
      flushPendingItems(1);
      currentSection = sectionMatch[1].trim().toLowerCase();
      continue;
    }

    // Check if this is a bullet item like "- piscina"
    const bulletMatch = line.match(BULLET_RE);
    if (bulletMatch) {
      let itemText = bulletMatch[1];

      // Check if the bullet itself has an image count
      const inlineCount = itemText.match(IMAGE_COUNT_RE);
      if (inlineCount) {
        const count = parseInt(inlineCount[1], 10);
        itemText = itemText.replace(IMAGE_COUNT_RE, "").trim();
        items.push({
          title: formatItemTitle(itemText),
          description: currentSection
            ? capitalize(currentSection)
            : "",
          quantity: count,
          section: currentSection,
        });
      } else {
        pendingItems.push(itemText);
      }
      continue;
    }

    // Check if this is a standalone item with image count
    const inlineCount = line.match(IMAGE_COUNT_RE);
    if (inlineCount) {
      const count = parseInt(inlineCount[1], 10);
      const itemText = line.replace(IMAGE_COUNT_RE, "").trim();
      if (itemText) {
        // Flush pending items first
        flushPendingItems(1);
        items.push({
          title: formatItemTitle(itemText),
          description: currentSection
            ? capitalize(currentSection)
            : "",
          quantity: count,
          section: currentSection,
        });
      }
      continue;
    }

    // Otherwise it's a standalone item name (no count yet — accumulate as pending)
    pendingItems.push(line);
  }

  // Flush any remaining pending items with qty 1
  flushPendingItems(1);

  const totalImages = items.reduce((sum, item) => sum + item.quantity, 0);

  return { items, totalImages };
}
