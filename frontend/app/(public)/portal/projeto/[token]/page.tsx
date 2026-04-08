import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { ProjectPortalView } from "./portal-view";

interface Props {
  params: Promise<{ token: string }>;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProjectPortalPage({ params }: Props) {
  const { token } = await params;
  const supabase = createServiceClient();

  // 1. Lookup project by portal_token
  const { data: rawProject } = await supabase
    .from("projects")
    .select(
      "id, name, status, client, client_company, due_date_start, due_date_end, tenant_id"
    )
    .eq("portal_token", token)
    .single();

  if (!rawProject) notFound();

  // Fetch portal_about separately (JSONB column not in generated types yet)
  const { data: aboutRow } = await supabase
    .from("projects" as never)
    .select("portal_about")
    .eq("id", rawProject.id)
    .single();

  const project = {
    ...rawProject,
    portal_about: (aboutRow as unknown as { portal_about: Record<string, unknown> | null })?.portal_about ?? null,
  };

  // 2. Fetch tasks (non-parent, visible statuses only)
  const { data: tasks } = await supabase
    .from("os_tasks" as any)
    .select(
      "id, title, status, is_completed, due_date, priority, section_id, completed_at, requires_client_approval, client_approval_status, client_approval_comment, client_approval_at"
    )
    .eq("project_id", project.id)
    .is("parent_id", null)
    .in("status", ["em_andamento", "revisao", "concluida", "a_fazer"])
    .order("order_index", { ascending: true });

  // 3. Fetch latest status update
  let latestUpdate: unknown = null;
  try {
    const { data } = await supabase
      .from("project_status_updates" as any)
      .select("id, status, summary, created_at, author_name")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    latestUpdate = data;
  } catch {
    // Table may not exist yet
  }

  // 4. Fetch project files (Google Drive synced)
  let projectFiles: unknown[] = [];
  try {
    const { data } = await supabase
      .from("project_files")
      .select(
        "id, name, mime_type, size_bytes, web_view_link, web_content_link, created_at, updated_at"
      )
      .eq("project_id", project.id)
      .order("updated_at", { ascending: false })
      .limit(50);
    projectFiles = data ?? [];
  } catch {
    // Table may not exist
  }

  // 5. Fetch chat messages
  let chatMessages: unknown[] = [];
  try {
    const { data } = await supabase
      .from("client_messages" as any)
      .select("id, sender_type, sender_name, content, created_at")
      .eq("tenant_id", project.tenant_id)
      .order("created_at", { ascending: true })
      .limit(100);
    chatMessages = data ?? [];
  } catch {
    // Table may not exist
  }

  // 6. Fetch project sections (for stepper phases)
  let sections: unknown[] = [];
  try {
    const { data } = await supabase
      .from("os_sections" as any)
      .select("id, title, color, order_index")
      .eq("project_id", project.id)
      .order("order_index", { ascending: true });
    sections = data ?? [];
  } catch {
    // Table may not exist
  }

  // 7. Fetch delivery token (unique link per project)
  let deliveryToken: string | null = null;
  try {
    const { data } = await supabase
      .from("project_deliveries" as any)
      .select("token")
      .eq("project_id", project.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    deliveryToken = (data as { token: string } | null)?.token ?? null;
  } catch {
    // Table may not exist
  }

  // 8. Type-cast tasks and compute metrics
  type PortalTask = {
    id: string;
    title: string;
    status: string;
    is_completed: boolean;
    due_date: string | null;
    priority: string | null;
    section_id: string | null;
    requires_client_approval: boolean | null;
    client_approval_status: string | null;
    client_approval_comment: string | null;
    client_approval_at: string | null;
    completed_at: string | null;
  };
  const allTasks = (tasks ?? []) as unknown as PortalTask[];

  const completedTasks = allTasks.filter((t) => t.is_completed);
  const inProgressTasks = allTasks.filter(
    (t) => !t.is_completed && t.status === "em_andamento"
  );
  const overdueTasks = allTasks.filter(
    (t) => !t.is_completed && t.due_date && new Date(t.due_date) < new Date()
  );
  const pendingApprovals = allTasks.filter(
    (t) =>
      t.requires_client_approval &&
      (t.client_approval_status === "pending" ||
        t.client_approval_status === "none")
  ).length;

  const progressPercent =
    allTasks.length > 0
      ? Math.round((completedTasks.length / allTasks.length) * 100)
      : 0;

  // 8. Count public comments
  let commentsCount = 0;
  try {
    const supa = supabase as unknown as {
      from: (name: string) => ReturnType<typeof supabase.from>;
    };
    const { count } = await supa
      .from("portal_comments")
      .select("id", { count: "exact", head: true })
      .eq("project_id", project.id)
      .eq("is_internal", false);
    commentsCount = count ?? 0;
  } catch {
    // Table may not exist
  }

  return (
    <ProjectPortalView
      project={project}
      tasks={allTasks}
      projectFiles={projectFiles as never[]}
      chatMessages={chatMessages as never[]}
      sections={sections as never[]}
      latestUpdate={latestUpdate as never}
      progressPercent={progressPercent}
      completedCount={completedTasks.length}
      inProgressCount={inProgressTasks.length}
      overdueCount={overdueTasks.length}
      totalCount={allTasks.length}
      token={token}
      deliveryToken={deliveryToken}
      pendingApprovals={pendingApprovals}
      commentsCount={commentsCount}
    />
  );
}
