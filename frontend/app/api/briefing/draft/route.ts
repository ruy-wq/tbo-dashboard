import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get("slug");
    if (!slug) {
      return NextResponse.json(null, { status: 400 });
    }

    const projectSlug = request.nextUrl.searchParams.get("project_slug");
    const supabase = createServiceClient();

    // Build query — return any active briefing (draft or submitted)
    let query = supabase
      .from("creative_briefings" as never)
      .select("id, form_data, status" as never)
      .eq("slug" as never, slug as never)
      .eq("is_active" as never, true as never);

    if (projectSlug) {
      query = query.eq("project_slug" as never, projectSlug as never);
    }

    // Order by status priority: rascunho first (so drafts take precedence), then most recent
    const { data } = await (query
      .order("created_at" as never, { ascending: false } as never) as unknown as Promise<{
      data: { id: string; form_data: unknown; status: string }[] | null;
    }>);

    if (!data || data.length === 0) {
      return NextResponse.json(null, { status: 404 });
    }

    // Prefer drafts over submitted briefings (so user can continue editing)
    const draft = data.find((d) => d.status === "rascunho");
    const result = draft ?? data[0];

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(null, { status: 500 });
  }
}
