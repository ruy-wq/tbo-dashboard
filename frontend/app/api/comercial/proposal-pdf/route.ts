import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import type { ReactElement } from "react";
import type { DocumentProps } from "@react-pdf/renderer";
import { createServiceClient } from "@/lib/supabase/service";
import { getProposalById } from "@/features/comercial/services/proposals";
import { getProposalByToken } from "@/features/comercial/services/proposal-client-link";
import { ProposalPDFTemplate } from "@/features/comercial/components/proposal-pdf-template";

export const dynamic = "force-dynamic";

function buildPDFElement(
  props: Parameters<typeof ProposalPDFTemplate>[0],
): ReactElement<DocumentProps> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createElement(ProposalPDFTemplate, props) as ReactElement<DocumentProps>;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const proposalId = searchParams.get("id");
  const token = searchParams.get("token");

  if (!proposalId && !token) {
    return NextResponse.json({ error: "Missing proposal id or token" }, { status: 400 });
  }

  try {
    const supabase = createServiceClient();
    const proposal = token
      ? await getProposalByToken(supabase, token)
      : await getProposalById(supabase, proposalId!);

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const element = buildPDFElement({ proposal });
    const buffer = await renderToBuffer(element);

    const filename = `proposta-${proposal.ref_code ?? proposalId}.pdf`;
    const uint8 = new Uint8Array(buffer);

    return new NextResponse(uint8, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": uint8.byteLength.toString(),
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (err) {
    console.error("[proposal-pdf] Error generating PDF:", err);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { proposalId: string };
    const { proposalId } = body;

    if (!proposalId) {
      return NextResponse.json({ error: "Missing proposalId" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const proposal = await getProposalById(supabase, proposalId);

    const element = buildPDFElement({ proposal });
    const buffer = await renderToBuffer(element);

    const filename = `proposta-${proposal.ref_code ?? proposalId}.pdf`;
    const uint8 = new Uint8Array(buffer);

    return new NextResponse(uint8, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Content-Length": uint8.byteLength.toString(),
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (err) {
    console.error("[proposal-pdf] Error generating PDF:", err);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 },
    );
  }
}
