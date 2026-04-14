// ─── Portfolio Item Types ────────────────────────────────────────────────────

export interface PortfolioItem {
  id: string;
  tenant_id: string;
  project_id: string | null;
  project_name: string | null;
  client_name: string | null;
  client_company: string | null;
  bu: string;
  category: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  media_urls: string[];
  external_url: string | null;
  year: number | null;
  is_featured: boolean;
  featured_by: string | null;
  tags: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PortfolioInsert {
  tenant_id: string;
  project_id?: string | null;
  project_name?: string | null;
  client_name?: string | null;
  client_company?: string | null;
  bu: string;
  category: string;
  title: string;
  description?: string | null;
  thumbnail_url?: string | null;
  media_urls?: string[];
  external_url?: string | null;
  year?: number | null;
  is_featured?: boolean;
  featured_by?: string | null;
  tags?: string[];
  created_by?: string | null;
}

export type PortfolioUpdate = Partial<Omit<PortfolioInsert, "tenant_id">>;

// ─── Category taxonomy per BU ───────────────────────────────────────────────

export const PORTFOLIO_CATEGORIES: Record<string, string[]> = {
  Audiovisual: [
    "Institucional",
    "Teaser",
    "Breve Lancamento",
    "Filme",
    "Filme Evento",
    "Short Video",
    "Drone",
    "Making Of",
  ],
  "Digital 3D": [
    "Imagem Estática",
    "Planta Humanizada",
    "Implantação",
    "Tour Virtual",
    "Animação",
  ],
  Branding: ["Logo", "Identidade Visual", "Papelaria", "Sinalização", "Naming"],
  Marketing: [
    "Campanha",
    "Social Media",
    "Material Impresso",
    "Apresentação",
    "Email Marketing",
  ],
  Interiores: ["Decoração", "Ambientação", "Home Staging"],
  Gamificação: ["App Interativo", "Experiência VR", "Maquete Digital"],
};

/** Flat list of all categories for validation */
export const ALL_CATEGORIES = Object.values(PORTFOLIO_CATEGORIES).flat();
