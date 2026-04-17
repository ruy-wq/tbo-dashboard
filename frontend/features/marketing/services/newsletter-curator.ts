import type { SupabaseClient } from "@supabase/supabase-js";

export interface CuratedThemeSource {
  title: string;
  url: string;
}

export interface CuratedTheme {
  title: string;
  angle: string;
  universes_crossed: string[];
  why_now: string;
  seo_keyword: string;
  sources: CuratedThemeSource[];
  suggested_pov: string;
}

export interface CurateThemesResult {
  themes: CuratedTheme[];
  metadata: {
    model: string;
    input_tokens: number;
    output_tokens: number;
    web_searches_used: number;
    generation_ms: number;
    already_published_count: number;
  };
}

export async function curateNewsletterThemes(
  supabase: SupabaseClient,
): Promise<CurateThemesResult> {
  const { data, error } = await supabase.functions.invoke(
    "curate-newsletter-themes",
    { body: {} },
  );

  // Em HTTP não-2xx, supabase-js joga o body no error.context.response.
  // Tentamos extrair a mensagem útil (ex: rate limit) em vez de mostrar
  // "Edge Function returned a non-2xx status code" genérico.
  if (error) {
    const ctx = (error as unknown as { context?: { response?: Response } })
      .context;
    if (ctx?.response) {
      try {
        const body = await ctx.response.clone().json();
        if (body?.error) {
          throw new Error(body.error);
        }
      } catch {
        /* ignore; fall through to generic error */
      }
    }
    throw error;
  }

  if (!data?.success || !Array.isArray(data.themes)) {
    throw new Error(data?.error || "Falha ao curar temas");
  }
  return {
    themes: data.themes as CuratedTheme[],
    metadata: data.metadata,
  };
}
