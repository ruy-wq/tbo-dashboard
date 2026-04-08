import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { ReportView } from "./report-view";

interface Props {
  params: Promise<{ token: string }>;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface SocialReport {
  id: string;
  token: string;
  client_name: string;
  handle: string | null;
  platform: string | null;
  report_data: Record<string, unknown>;
  period_label: string | null;
  period_start: string | null;
  period_end: string | null;
  access_password: string | null;
  access_count: number;
  first_accessed_at: string | null;
  last_accessed_at: string | null;
  is_active: boolean;
}

export default async function PublicSocialReportPage({ params }: Props) {
  const { token } = await params;
  const supabase = createServiceClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: report } = await (supabase as any)
    .from("client_social_reports")
    .select("*")
    .eq("token", token)
    .eq("is_active", true)
    .single() as { data: SocialReport | null };

  if (!report) notFound();

  // Fire-and-forget access tracking
  const now = new Date().toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (supabase as any)
    .from("client_social_reports")
    .update({
      access_count: (report.access_count ?? 0) + 1,
      last_accessed_at: now,
      ...(report.first_accessed_at ? {} : { first_accessed_at: now }),
    })
    .eq("id", report.id)
    .then(() => {});

  return (
    <ReportView
      clientName={report.client_name}
      handle={report.handle ?? ""}
      platform={report.platform ?? "instagram"}
      periodLabel={report.period_label ?? ""}
      periodStart={report.period_start ?? ""}
      periodEnd={report.period_end ?? ""}
      reportData={report.report_data}
      accessPassword={report.access_password}
    />
  );
}
