// RBAC -- Role-based access control for the frontend
// 3 tiers: admin > lider > colaborador

export type RoleSlug = "admin" | "lider" | "colaborador";

/**
 * Role hierarchy -- higher number = more privileges.
 * Used by hasMinRole() for permission checks.
 */
export const ROLE_HIERARCHY: Record<RoleSlug, number> = {
  admin: 4,
  lider: 2,
  colaborador: 1,
};

/**
 * Modules each role can SEE in the sidebar and access via URL.
 * Admin uses "*" wildcard = unrestricted access.
 */
export const ROLE_MODULES: Record<RoleSlug, string[]> = {
  admin: ["*"],
  lider: [
    "dashboard",
    "projetos",
    "tarefas",
    "pessoas",
    "agenda",
    "clientes",
    "comercial",
    "contratos",
    "okrs",
    "chat",
    "cultura",
    "mercado",
    "marketing",
    "relatorios",
    "conhecimento",
    "ativos",
    "review",
    "helpdesk",
  ],
  colaborador: [
    "dashboard",
    "projetos",
    "tarefas",
    "agenda",
    "comercial",
    "okrs",
    "chat",
    "cultura",
    "mercado",
    "conhecimento",
    "review",
    "helpdesk",
  ],
};

/**
 * All known module slugs -- used to resolve the "*" wildcard.
 */
const ALL_MODULES = [
  "dashboard",
  "projetos",
  "tarefas",
  "pessoas",
  "agenda",
  "financeiro",
  "comercial",
  "clientes",
  "contratos",
  "okrs",
  "chat",
  "cultura",
  "configuracoes",
  "changelog",
  "marketing",
  "relatorios",
  "mercado",
  "usuarios",
  "alerts",
  "portal-cliente",
  "admin",
  "permissoes",
  "conteudo",
  "revisoes",
  "diretoria",
  "system-health",
  "audit-logs",
  "audit-log",
  "ativos",
  "conhecimento",
  "review",
  "helpdesk",
  "atividades",
  "favoritos",
];

/**
 * Super-admin emails -- always treated as admin regardless of DB role.
 */
export const SUPER_ADMIN_EMAILS = [
  "marco@agenciatbo.com.br",
  "ruy@agenciatbo.com.br",
];

/**
 * Check if userRole meets a minimum role threshold using the hierarchy.
 */
export function hasMinRole(
  userRole: RoleSlug | null,
  minRole: RoleSlug,
): boolean {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole];
}

/** Check if a role can access a given module slug */
export function canAccessModule(role: RoleSlug, module: string): boolean {
  const allowed = ROLE_MODULES[role];
  if (!allowed) return false;
  return allowed.includes("*") || allowed.includes(module);
}

/** True for admin-tier role */
export function isAdmin(role: RoleSlug | null): boolean {
  return role === "admin";
}

/** True if email matches a hardcoded super-admin */
export function isSuperAdmin(email: string | undefined | null): boolean {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase());
}

/** Get the list of allowed module slugs for a role (resolves wildcard) */
export function getModulesForRole(role: RoleSlug): string[] {
  const modules = ROLE_MODULES[role];
  if (modules.includes("*")) {
    return [...ALL_MODULES];
  }
  return modules;
}

/** Default role when DB lookup fails or user has no assignment */
export const DEFAULT_ROLE: RoleSlug = "colaborador";

// ---------------------------------------------------------------------------
// Granular permission keys per architecture.md permission matrix
// ---------------------------------------------------------------------------

export type PermissionKey =
  | "financeiro.view"
  | "pipeline.view"
  | "okrs.create"
  | "okrs.checkin"
  | "projetos.create"
  | "projetos.view_all"
  | "rbac.manage"
  | "audit_logs.view"
  | "one_on_one.conduct"
  | "one_on_one.participate"
  | "reconhecimentos"
  | "chat.create_channel"
  | "chat.manage_channels"
  | "chat.delete_messages"
  | "review.approve"
  | "review.delete"
  | "career.manage"
  | "career.promote";

/**
 * Permission matrix from architecture.md.
 * Maps each permission to the roles that have it.
 */
const PERMISSION_MATRIX: Record<PermissionKey, RoleSlug[]> = {
  "financeiro.view": ["admin"],
  "pipeline.view": ["admin"],
  "okrs.create": ["admin"],
  "okrs.checkin": ["admin", "lider", "colaborador"],
  "projetos.create": ["admin", "lider"],
  "projetos.view_all": ["admin", "lider"],
  "rbac.manage": ["admin"],
  "audit_logs.view": ["admin"],
  "one_on_one.conduct": ["admin", "lider"],
  "one_on_one.participate": ["admin", "lider", "colaborador"],
  reconhecimentos: ["admin", "lider", "colaborador"],
  "chat.create_channel": ["admin", "lider"],
  "chat.manage_channels": ["admin"],
  "chat.delete_messages": ["admin"],
  "review.approve": ["admin", "lider"],
  "review.delete": ["admin"],
  "career.manage": ["admin"],
  "career.promote": ["admin", "lider"],
};

/** Check if a role has a specific granular permission */
export function hasPermission(
  role: RoleSlug | null,
  permission: PermissionKey,
): boolean {
  if (!role) return false;
  const allowed = PERMISSION_MATRIX[permission];
  return allowed ? allowed.includes(role) : false;
}
