import { type NextRequest, NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

const ACADEMY_HOST = "academy.wearetbo.com.br"

export async function proxy(request: NextRequest) {
  // Public routes that skip auth entirely (no Supabase client needed)
  const path = request.nextUrl.pathname
  if (
    path.startsWith("/briefing") ||
    path.startsWith("/api/briefing") ||
    path.startsWith("/intake") ||
    path.startsWith("/api/comercial/proposal-pdf") ||
    path.startsWith("/api/comercial/seed-prestes") ||
    path.startsWith("/relatorio-social")
  ) {
    return NextResponse.next()
  }

  const host = request.headers.get("host") ?? ""

  // Academy subdomain: redirect authenticated users to /dashboard, not /projetos
  if (host === ACADEMY_HOST || host.startsWith("academy.")) {
    return updateSession(request, { defaultRedirect: "/explorar" })
  }

  // Redirect legacy /academy/* URLs to the standalone academy subdomain
  if (request.nextUrl.pathname.startsWith("/academy")) {
    const academyDomain =
      process.env.NEXT_PUBLIC_ACADEMY_URL ?? "https://academy.wearetbo.com.br"
    const subPath = request.nextUrl.pathname.replace(/^\/academy/, "") || "/"
    return NextResponse.redirect(
      `${academyDomain}${subPath}${request.nextUrl.search}`,
      301,
    )
  }

  return updateSession(request)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
