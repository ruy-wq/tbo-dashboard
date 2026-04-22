/**
 * Extension Tiptap: divisor semântico de seção com label opcional.
 *
 * Renderiza a mesma linha + label central do template TBO (ex: "— FICHA
 * TÉCNICA —"). Cria um node atômico (bloco inteiro selecionável como
 * unidade). Serializa em markdown como `--- LABEL ---` (ou `---` se vazio).
 *
 * Uso: `editor.chain().insertContent({ type: 'tboSectionDivider', attrs: { label: 'FICHA TÉCNICA' }}).run()`
 */

import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    tboSectionDivider: {
      insertSectionDivider: (label?: string) => ReturnType;
    };
  }
}

export const TboSectionDivider = Node.create({
  name: "tboSectionDivider",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      label: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-label") ?? "",
        renderHTML: (attrs) =>
          attrs.label ? { "data-label": String(attrs.label) } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-tbo-divider]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const label = String(node.attrs.label ?? "").trim();
    const base = mergeAttributes(HTMLAttributes, {
      "data-tbo-divider": "",
      class: "tbo-section-divider",
    });
    if (!label) {
      return [
        "div",
        base,
        ["span", { class: "tbo-section-divider-line" }],
      ];
    }
    return [
      "div",
      base,
      ["span", { class: "tbo-section-divider-line" }],
      ["span", { class: "tbo-section-divider-label" }, label],
      ["span", { class: "tbo-section-divider-line" }],
    ];
  },

  addCommands() {
    return {
      insertSectionDivider:
        (label = "") =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { label },
          }),
    };
  },
});
