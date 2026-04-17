import { NextResponse } from "next/server";
import { buildTboEmailHtml } from "@/lib/email-templates/tbo-outbound";

export const dynamic = "force-dynamic";

interface PreviewBody {
  subject?: string;
  preheader?: string | null;
  eyebrow?: string | null;
  body?: string;
}

export async function POST(req: Request) {
  let payload: PreviewBody;
  try {
    payload = (await req.json()) as PreviewBody;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const { subject, body, preheader, eyebrow } = payload;
  if (!subject || !body) {
    return NextResponse.json(
      { error: "subject and body required" },
      { status: 400 },
    );
  }
  const html = buildTboEmailHtml({
    subject,
    body,
    preheader: preheader ?? subject,
    eyebrow: eyebrow ?? undefined,
  });
  return new NextResponse(html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
