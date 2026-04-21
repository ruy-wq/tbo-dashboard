import { test, expect } from '@playwright/test';

/**
 * Navigation tests: verify that all major routes exist and that
 * unauthenticated requests are properly redirected to /login
 * (which proves the route exists and middleware works).
 */

const protectedRoutes = [
  '/dashboard',
  '/projetos',
  '/tarefas',
  '/pessoas',
  '/agenda',
  '/entregas',
  '/reunioes',
  '/decisoes',
  '/financeiro',
  '/clientes',
  '/contratos',
  '/comercial',
  '/okrs',
  '/chat',
  '/cultura',
  '/templates',
  '/changelog',
  '/configuracoes',
  '/marketing',
  '/mercado',
  '/relatorios',
  '/alerts',
  '/portal-cliente',
  '/admin',
  '/permissoes',
  '/conteudo',
  '/revisoes',
  '/diretoria',
  '/system-health',
];

for (const route of protectedRoutes) {
  test(`${route} redirects unauthenticated user to /login`, async ({ page }) => {
    const response = await page.goto(route);

    // The route should not return a 404 or 500
    expect(response?.status()).not.toBe(404);
    expect(response?.status()).not.toBe(500);

    // Should redirect to /login since user is not authenticated
    await expect(page).toHaveURL(/\/login/);
  });
}
