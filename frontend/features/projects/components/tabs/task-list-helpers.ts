import {
  IconAlignLeft,
  IconHash,
  IconSelect,
  IconList,
  IconLoader,
  IconCalendar,
  IconUsers,
  IconPaperclip,
  IconCheckbox,
  IconLink,
  IconAt,
  IconPhone,
  IconCornerDownRight,
  IconSearch,
  IconMathFunction,
  IconId,
  IconMapPin,
  IconClock,
  IconUserCircle,
} from "@tabler/icons-react";
import { TASK_STATUS, TASK_PRIORITY, type TaskStatusKey, type TaskPriorityKey } from "@/lib/constants";
import type { TaskSortField } from "./project-tasks-toolbar";
import type { Database } from "@/lib/supabase/types";

// ─── Shared types ───────────────────────────────────────────────────────────

export type TaskRow = Database["public"]["Tables"]["os_tasks"]["Row"];

export type SortDir = "asc" | "desc";

export interface ProjectTaskListProps {
  projectId: string;
  onSelectTask: (taskId: string) => void;
  onAddTask: () => void;
}

export interface ColumnConfig {
  id: TaskSortField | "check";
  label: string;
  defaultWidth: number;
  minWidth: number;
  sortable: boolean;
  hideOnMobile?: boolean;
  flex?: boolean;
  resizable?: boolean;
}

export interface ExtraColumn {
  id: string;
  label: string;
  field: string;
  type: "text" | "date" | "number" | "readonly";
  icon: React.ComponentType<{ className?: string }>;
  width: string;
}

export interface TaskGroup {
  label: string;
  color?: string;
  items: TaskRow[];
}

// ─── Sort helpers ───────────────────────────────────────────────────────────

export function sortTasks(tasks: TaskRow[], field: TaskSortField, dir: SortDir): TaskRow[] {
  return [...tasks].sort((a, b) => {
    let cmp = 0;
    switch (field) {
      case "order_index":
        cmp = (a.order_index ?? 0) - (b.order_index ?? 0);
        break;
      case "title":
        cmp = (a.title ?? "").localeCompare(b.title ?? "", "pt-BR");
        break;
      case "status": {
        const statusOrder = Object.keys(TASK_STATUS);
        const ai = statusOrder.indexOf(a.status ?? "");
        const bi = statusOrder.indexOf(b.status ?? "");
        cmp = ai - bi;
        break;
      }
      case "priority": {
        const pa = a.priority ? TASK_PRIORITY[a.priority as TaskPriorityKey]?.sort ?? 99 : 99;
        const pb = b.priority ? TASK_PRIORITY[b.priority as TaskPriorityKey]?.sort ?? 99 : 99;
        cmp = pa - pb;
        break;
      }
      case "assignee_name":
        cmp = (a.assignee_name ?? "").localeCompare(b.assignee_name ?? "", "pt-BR");
        break;
      case "due_date":
        cmp = (a.due_date ?? "").localeCompare(b.due_date ?? "");
        break;
      case "created_at":
        cmp = (a.created_at ?? "").localeCompare(b.created_at ?? "");
        break;
    }
    return dir === "desc" ? -cmp : cmp;
  });
}

// ─── Group helpers ──────────────────────────────────────────────────────────

export function groupTasks(
  tasks: TaskRow[],
  groupBy: string,
  sections?: { id: string; title: string; color: string | null }[],
): TaskGroup[] {
  if (groupBy === "none") return [{ label: "", items: tasks }];

  const groups = new Map<string, TaskRow[]>();
  const order: string[] = [];

  // When grouping by section, pre-seed groups in section order so empty sections appear
  // and the order respects order_index from the database
  if (groupBy === "section" && sections && sections.length > 0) {
    for (const sec of sections) {
      groups.set(sec.id, []);
      order.push(sec.id);
    }
  }

  for (const t of tasks) {
    let key: string;
    switch (groupBy) {
      case "status":
        key = t.status ?? "sem_status";
        break;
      case "priority":
        key = t.priority ?? "sem_prioridade";
        break;
      case "section":
        key = t.section_id ?? "sem_secao";
        break;
      case "assignee":
        key = t.assignee_name ?? "sem_responsavel";
        break;
      default:
        key = "all";
    }
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)!.push(t);
  }

  return order.map((key) => {
    let label = key;
    let color: string | undefined;
    if (groupBy === "status") {
      const status = TASK_STATUS[key as TaskStatusKey];
      if (status) {
        label = status.label;
        color = status.color;
      } else {
        label = "Sem status";
      }
    } else if (groupBy === "priority") {
      const prio = TASK_PRIORITY[key as TaskPriorityKey];
      if (prio) {
        label = prio.label;
        color = prio.color;
      } else {
        label = "Sem prioridade";
      }
    } else if (groupBy === "section") {
      const sec = sections?.find((s) => s.id === key);
      if (sec) {
        label = sec.title;
        color = sec.color ?? undefined;
      } else {
        label = "Sem seção";
      }
    } else if (groupBy === "assignee") {
      if (key === "sem_responsavel") {
        label = "Sem responsável";
      }
    }
    return { label, color, items: groups.get(key)! };
  });
}

// ─── Column config ──────────────────────────────────────────────────────────

export const COLUMNS: ColumnConfig[] = [
  { id: "check", label: "", defaultWidth: 40, minWidth: 40, sortable: false },
  { id: "title", label: "Nome", defaultWidth: 0, minWidth: 200, sortable: true, flex: true },
  { id: "status", label: "Status", defaultWidth: 130, minWidth: 80, sortable: true, resizable: true },
  { id: "priority", label: "Prioridade", defaultWidth: 120, minWidth: 80, sortable: true, hideOnMobile: true, resizable: true },
  { id: "assignee_name", label: "Responsável", defaultWidth: 140, minWidth: 80, sortable: true, hideOnMobile: true, resizable: true },
  { id: "due_date", label: "Prazo", defaultWidth: 160, minWidth: 80, sortable: true, hideOnMobile: true, resizable: true },
];

// ─── Suggested extra columns ────────────────────────────────────────────────

export const SUGGESTED_EXTRA_COLUMNS: { key: string; label: string; icon: typeof IconAlignLeft }[] = [
  { key: "start_date", label: "Data de Início", icon: IconCalendar },
  { key: "section", label: "Seção", icon: IconList },
  { key: "created_at", label: "Criado em", icon: IconClock },
];

// ─── Property types (for "+" menu) ──────────────────────────────────────────

export const PROPERTY_TYPES = [
  { icon: IconAlignLeft, label: "Texto", type: "text" },
  { icon: IconHash, label: "Número", type: "number" },
  { icon: IconSelect, label: "Selecionar", type: "select" },
  { icon: IconList, label: "Seleção múltipla", type: "multi_select" },
  { icon: IconLoader, label: "Status", type: "status" },
  { icon: IconCalendar, label: "Data", type: "date" },
  { icon: IconUsers, label: "Pessoa", type: "person" },
  { icon: IconPaperclip, label: "Arquivos e mídia", type: "files" },
  { icon: IconCheckbox, label: "Caixa de seleção", type: "checkbox" },
  { icon: IconLink, label: "URL", type: "url" },
  { icon: IconAt, label: "E-mail", type: "email" },
  { icon: IconPhone, label: "Telefone", type: "phone" },
  { icon: IconCornerDownRight, label: "Relação", type: "relation" },
  { icon: IconSearch, label: "Rollup", type: "rollup" },
  { icon: IconMathFunction, label: "Fórmula", type: "formula" },
  { icon: IconId, label: "ID", type: "id" },
  { icon: IconMapPin, label: "Local", type: "location" },
  { icon: IconClock, label: "Criado em", type: "created_at" },
  { icon: IconClock, label: "Última edição", type: "updated_at" },
  { icon: IconUserCircle, label: "Criado por", type: "created_by" },
  { icon: IconUserCircle, label: "Última edição por", type: "updated_by" },
];

// ─── Custom field icon map ──────────────────────────────────────────────────

export const CUSTOM_FIELD_ICON_MAP: Record<string, typeof IconAlignLeft> = {
  text: IconAlignLeft,
  number: IconHash,
  select: IconSelect,
  multi_select: IconList,
  date: IconCalendar,
  person: IconUsers,
  checkbox: IconCheckbox,
  url: IconLink,
  email: IconAt,
};
