// ─── Video Embed Utils ──────────────────────────────────────────────────────
// Detecta fonte de video (Vimeo, YouTube, Drive, MP4) e gera embed URL/props.

export type VideoSource = "vimeo" | "youtube" | "google_drive" | "direct" | "unknown";

export interface VideoEmbed {
  source: VideoSource;
  embedUrl: string;
  thumbnailUrl: string | null;
}

// ── Regex patterns ──────────────────────────────────────────────────────────

const VIMEO_REGEX = /(?:vimeo\.com\/)(?:video\/)?(\d+)/;
const YOUTUBE_REGEX =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
const DRIVE_REGEX = /drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/;
const DIRECT_VIDEO_REGEX = /\.(mp4|webm|mov|avi)(\?.*)?$/i;

// ── Detection ───────────────────────────────────────────────────────────────

export function detectVideoSource(url: string): VideoSource {
  if (!url) return "unknown";
  if (VIMEO_REGEX.test(url)) return "vimeo";
  if (YOUTUBE_REGEX.test(url)) return "youtube";
  if (DRIVE_REGEX.test(url)) return "google_drive";
  if (DIRECT_VIDEO_REGEX.test(url)) return "direct";
  return "unknown";
}

export function getVideoEmbed(url: string): VideoEmbed | null {
  if (!url) return null;

  const source = detectVideoSource(url);

  switch (source) {
    case "vimeo": {
      const match = url.match(VIMEO_REGEX);
      if (!match) return null;
      const id = match[1];
      return {
        source,
        embedUrl: `https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0&dnt=1`,
        thumbnailUrl: `https://vumbnail.com/${id}.jpg`,
      };
    }

    case "youtube": {
      const match = url.match(YOUTUBE_REGEX);
      if (!match) return null;
      const id = match[1];
      return {
        source,
        embedUrl: `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`,
        thumbnailUrl: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
      };
    }

    case "google_drive": {
      const match = url.match(DRIVE_REGEX);
      if (!match) return null;
      const id = match[1];
      return {
        source,
        embedUrl: `https://drive.google.com/file/d/${id}/preview`,
        thumbnailUrl: `https://drive.google.com/thumbnail?id=${id}&sz=w640`,
      };
    }

    case "direct": {
      return {
        source,
        embedUrl: url,
        thumbnailUrl: null,
      };
    }

    default:
      return null;
  }
}

// ── Source labels ────────────────────────────────────────────────────────────

export const VIDEO_SOURCE_LABELS: Record<VideoSource, string> = {
  vimeo: "Vimeo",
  youtube: "YouTube",
  google_drive: "Google Drive",
  direct: "Video direto",
  unknown: "Link",
};
