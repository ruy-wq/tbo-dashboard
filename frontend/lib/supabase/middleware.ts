import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest, options?: { defaultRedirect?: string }) {
  // Skip middleware entirely for public routes that don't need auth
  const isPublicSkip =
    request.nextUrl.pathname.startsWith("/briefing") ||
    request.nextUrl.pathname.startsWith("/api/briefing") ||
    request.nextUrl.pathname.startsWith("/intake") ||
    request.nextUrl.pathname.startsWith("/entrega") ||
    request.nextUrl.pathname.startsWith("/proposta") ||
    request.nextUrl.pathname.startsWith("/api/comercial/proposal-pdf");

  if (isPublicSkip) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — important for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users to login
  const isAuthRoute = request.nextUrl.pathname.startsWith("/login");
  const isPublicRoute =
    request.nextUrl.pathname.startsWith("/auth/callback") ||
    request.nextUrl.pathname.startsWith("/portal") ||
    request.nextUrl.pathname.startsWith("/metodo") ||
    request.nextUrl.pathname.startsWith("/api/metodo-upload") ||
    request.nextUrl.pathname.startsWith("/pesquisa-clima") ||
    request.nextUrl.pathname.startsWith("/api/pesquisa-clima") ||
    request.nextUrl.pathname.startsWith("/diagnostico") ||
    request.nextUrl.pathname.startsWith("/api/webhooks/stripe");

  if (!user && !isAuthRoute && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from login
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = options?.defaultRedirect ?? "/servicos";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
