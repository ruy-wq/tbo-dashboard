# TBO OS â€” Claude Code Memory

## Stack
- Next.js 14 (App Router) + TypeScript strict + React Query + shadcn/ui + Tailwind CSS
- Supabase (PostgreSQL + RLS + Edge Functions + Realtime)
- Vercel deploy
- Auth: Supabase Auth (Login Google) com RBAC
- Integracoes: OMIE (ERP), Fireflies (Transcricao)
- CRM: nativo (dados migrados do RD Station para Supabase — crm_deals, crm_deal_activities, rd_pipelines)

## Arquitetura
- 7 grupos modulares: Dashboard, Estrategia, Execucao, Receita & Caixa, Pessoas, Cultura & Governanca, Intelligence
- 3 roles RBAC: admin > lider > colaborador (+ super-admins por email em lib/permissions.ts)
- Dashboard dinamico por role (3 views distintas)
- Drag & Drop universal em todo modulo/secao/child com regras de secao automaticas
- Tabelas seguem modelo Notion (18 tipos de propriedade, filtros persistentes por view, D&D de colunas)
- Referencia completa: @docs/architecture.md

## Convencoes de Codigo
- TypeScript strict â€” NUNCA usar `any`, preferir `unknown` ou tipo especifico
- React Query para TODO data fetching â€” NUNCA useEffect + useState para fetch
- shadcn/ui para componentes â€” NUNCA HTML puro para o que shadcn resolve
- Zod para validacao de inputs
- Server Components por padrao, Client Components so quando necessario
- Error boundaries em toda rota

## Padroes Obrigatorios
- Persistencia 100% Supabase â€” NUNCA localStorage como fonte de verdade
- RBAC duplo: RBACGuard no frontend + RLS policy no Supabase (SEMPRE ambos)
- Drag & Drop: optimistic update + rollback + Ctrl+Z (undo) + regras de secao destino
- Audit trail: logar alteracoes criticas (quem, quando, o que, antes/depois)
- Loading: skeleton content-aware (reflete layout real, nao spinner generico)
- Empty states: inspiram acao (CTA claro, nao texto triste)
- Error states: mensagem util + proximo passo + botao retry

## Proibicoes
- NUNCA embed/iframe externo â€” tudo nativo
- NUNCA console.log em producao â€” usar logger
- NUNCA commit sem type-check passar
- NUNCA modificar migrations existentes â€” criar nova
- NUNCA confiar apenas no frontend para seguranca â€” RLS obrigatorio
- NUNCA criar componente com 300+ linhas â€” dividir

## Estrutura de Pastas
```
src/
  app/          # App Router pages
  components/   # Shared UI components
  features/     # Feature modules (por grupo modular)
  hooks/        # Custom hooks
  lib/          # Utilities, supabase client, types
  services/     # API/integration layers (OMIE, RD, Fireflies)
```

## Comandos
- `pnpm dev` â€” dev server
- `pnpm build` â€” production build
- `pnpm lint` â€” ESLint + type-check
- `pnpm test` â€” testes

## Agents QA Pipeline (15 Agentes)
Sistema de melhoria continua com 15 agentes em 4 camadas, foco em /projetos e /pessoas.
Skill: .claude/skills/tbo-os-orchestrator.md
Guides: docs/agents/*.md

### Camada 1 — Infraestrutura (core)
- #1 Orchestrator (orchestrator-guide.md) — coordenacao, health score, priorizacao
- #2 Auditor (auditor-guide.md) — 6 camadas de conformidade
- #3 Implementor (implementor-guide.md) — 11 templates de execucao
- #4 Validator (validator-guide.md) — 7 fases + loop

### Camada 2 — Projetos (270 arquivos, 40.9k linhas)
- #5 Projetos Structural (projetos-structural-agent.md) — splits, any, imports
- #6 Projetos UX Craft (projetos-ux-agent.md) — loading/empty/error, motion
- #7 Projetos Tasks (projetos-tasks-agent.md) — subsistema tarefas (114 arq)
- #8 Projetos Views (projetos-views-agent.md) — 10 views (board, gantt, etc.)
- #9 Projetos Integrations (projetos-integrations-agent.md) — GDrive, templates, 3D

### Camada 3 — Pessoas (87 arquivos, 15.4k linhas)
- #10 Pessoas Structural (pessoas-structural-agent.md) — 6 sub-modulos
- #11 Pessoas Performance (pessoas-performance-agent.md) — scoring, radar
- #12 Pessoas Growth (pessoas-growth-agent.md) — PDI + Career + 1on1
- #13 Pessoas Analytics (pessoas-analytics-agent.md) — KPIs, nudges, clima

### Camada 4 — Cross-Module
- #14 Data Contracts (data-contracts-agent.md) — types ↔ schema, null safety
- #15 Regression Guard (regression-guard-agent.md) — build health, smoke tests

### Pipeline: Orchestrator → [Camada 2+3+4 paralelo] → Auditor → Implementor → Validator → Regression Guard
### Triggers: “melhorar TBO OS”, “ciclo de melhoria”, “orquestrador”, “health check”,
  “auditoria ERP”, “proximo ciclo”, “pipeline QA”, “health score”, “debt”, “roadmap”
