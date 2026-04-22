---
description: Rules for RBAC, permissions, and role-based access control
globs: ["**/rbac/**", "**/auth/**", "**/permissions/**", "**/middleware/**", "**/guards/**", "**/*guard*", "**/*permission*", "**/*role*"]
---

# RBAC Rules (3 Roles)

## Hierarchy
admin (4) > lider (2) > colaborador (1)

> Source of truth: `frontend/lib/permissions.ts`
> Super-admins: hardcoded email list em `SUPER_ADMIN_EMAILS` (marco@, ruy@) — sempre tratados como admin

## Permission Matrix (espelha `PERMISSION_MATRIX` em permissions.ts)
- Financeiro (DRE, Caixa, Pipeline): admin ONLY (`financeiro.view`, `pipeline.view`)
- Intelligence: admin full, lider parcial, colaborador NEVER
- RBAC management: admin ONLY (`rbac.manage`)
- Audit logs: admin ONLY (`audit_logs.view`)
- OKRs criar: admin. Check-in: todos (proprios)
- Projetos criar: admin + lider. Ver todos: admin + lider. Colaborador: so atribuidos
- 1:1 conduzir: admin + lider. Participar: todos
- Reconhecimentos: todos
- Chat criar canal: admin + lider. Manage/delete: admin
- Review aprovar: admin + lider. Deletar: admin
- Carreira: manage admin. Promover: admin + lider

## Implementation Rules
- ALWAYS dual-layer: RBACGuard component (frontend) + RLS policy (Supabase backend)
- NEVER trust frontend-only guards for security
- Dashboard MUST render different widgets per role
- Data above permission level MUST be hidden, not just disabled
- Use RBACGuard component with minRole or allowedRoles props
- Para permissoes granulares use `hasPermission(role, "key")` em vez de comparar string
- Para checagem hierarquica use `hasMinRole(role, "admin" | "lider" | "colaborador")`
- NUNCA hardcode `role === "admin"` em novas telas — use `isAdmin(role)` ou `hasPermission()`
