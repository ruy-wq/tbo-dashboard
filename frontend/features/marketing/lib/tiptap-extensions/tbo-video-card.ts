/**
 * Extension Tiptap: card clicável de vídeo (YouTube/Vimeo).
 *
 * Renderiza thumbnail + barra "▶ Assistir o vídeo" (igual a função `renderMedia`
 * em `lib/email-templates/tbo-outbound.ts` pra URLs de vídeo). Thumb do YouTube
 * vem automaticamente via `img.youtube.com/vi/{id}/maxresdefault.jpg`.
 *
 * Serializa em markdown como `![label](videoUrl)` — o template final sabe
 * detectar URL de vídeo via `isVideoUrl` e renderiza o card certo no e-mail.
 */

import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    tboVideoCard: {
      insertVideoCard: (opts: { url: string; label?: string }) => ReturnType;
      updateVideoCard: (opts: {
        url?: string;
        label?: string;
      }) => ReturnType;
    };
  }
}

const YOUTUBE_ID_RE =
  /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/;

export function extractYouTubeId(url: string): string | null {
  const m = YOUTUBE_ID_RE.exec(url);
  return m ? m[1] : null;
}

export function youtubeThumbUrl(id: string): string {
  return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
}

export function isYouTubeUrl(url: string): boolean {
  return /youtu\.be|youtube\.com/.test(url);
}

export function isVideoUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    isYouTubeUrl(lower) ||
    lower.includes("vimeo.com/") ||
    lower.endsWith(".mp4") ||
    lower.endsWith(".mov") ||
    lower.endsWith(".webm")
  );
}

export function resolveVideoThumb(url: string): string {
  const id = extractYouTubeId(url);
  return id ? youtubeThumbUrl(id) : "";
}

export const TboVideoCard = Node.create({
  name: "tboVideoCard",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      url: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-url") ?? "",
        renderHTML: (attrs) =>
          attrs.url ? { "data-url": String(attrs.url) } : {},
      },
      label: {
        default: "Assistir o vídeo",
        parseHTML: (el) =>
          el.getAttribute("data-label") ?? "Assistir o vídeo",
        renderHTML: (attrs) =>
          attrs.label ? { "data-label": String(attrs.label) } : {},
      },
      thumbUrl: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-thumb-url") ?? "",
        renderHTML: (attrs) =>
          attrs.thumbUrl
            ? { "data-thumb-url": String(attrs.thumbUrl) }
            : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-tbo-video]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const url = String(node.attrs.url ?? "");
    const label = String(node.attrs.label ?? "Assistir o vídeo");
    const thumb =
      String(node.attrs.thumbUrl ?? "") || resolveVideoThumb(url);

    const base = mergeAttributes(HTMLAttributes, {
      "data-tbo-video": "",
      class: "tbo-video-card",
    });

    const thumbEl = thumb
      ? [
          "div",
          { class: "tbo-video-thumb-wrap" },
          ["img", { src: thumb, class: "tbo-video-thumb", alt: label }],
          ["div", { class: "tbo-video-play-overlay" }, "▶"],
        ]
      : [
          "div",
          { class: "tbo-video-placeholder" },
          "Thumbnail indisponível",
        ];

    return [
      "div",
      base,
      thumbEl as never,
      [
        "div",
        { class: "tbo-video-caption" },
        [
          "span",
          { class: "tbo-video-cta-btn" },
          `▶   ${label.toUpperCase()}`,
        ],
      ],
    ];
  },

  addCommands() {
    return {
      insertVideoCard:
        ({ url, label }) =>
        ({ commands }) => {
          const thumb = resolveVideoThumb(url);
          return commands.insertContent({
            type: this.name,
            attrs: {
              url,
              label: label ?? "Assistir o vídeo",
              thumbUrl: thumb,
            },
          });
        },
      updateVideoCard:
        ({ url, label }) =>
        ({ commands }) => {
          const attrs: Record<string, string> = {};
          if (typeof url === "string") {
            attrs.url = url;
            attrs.thumbUrl = resolveVideoThumb(url);
          }
          if (typeof label === "string") attrs.label = label;
          return commands.updateAttributes(this.name, attrs);
        },
    };
  },
});
