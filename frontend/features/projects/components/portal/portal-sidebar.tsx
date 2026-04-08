"use client";

import { useState } from "react";
import {
  IconHome,
  IconListDetails,
  IconChartBar,
  IconFolder,
  IconInfoCircle,
  IconChevronLeft,
  IconChevronDown,
  IconChevronRight,
  IconFile,
  IconPresentation,
  IconFileText,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface SidebarItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface PortalSidebarProps {
  projectName: string;
  clientCompany: string | null;
  activeItem: string;
  onItemChange: (key: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  documents?: { id: string; name: string; type: string }[];
}

const MAIN_ITEMS: SidebarItem[] = [
  { key: "home", label: "Home", icon: IconHome },
  { key: "about", label: "Sobre", icon: IconInfoCircle },
  { key: "tasks", label: "Tarefas", icon: IconListDetails },
  { key: "analytics", label: "Metricas", icon: IconChartBar },
  { key: "documents", label: "Documentos", icon: IconFolder },
];

function getDocIcon(type: string) {
  if (type.includes("presentation") || type.includes("pptx")) return IconPresentation;
  if (type.includes("pdf") || type.includes("document")) return IconFileText;
  return IconFile;
}

export function PortalSidebar({
  projectName,
  clientCompany,
  activeItem,
  onItemChange,
  collapsed = false,
  onToggleCollapse,
  documents = [],
}: PortalSidebarProps) {
  const [expandedProject, setExpandedProject] = useState(true);

  return (
    <aside
      className={cn(
        "flex h-full flex-col transition-all duration-200",
        collapsed ? "w-16" : "w-60"
      )}
      style={{
        backgroundColor: "#f7f5f2",
        borderRight: "1px solid #d9d4cd",
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      }}
    >
      {/* Collapse toggle */}
      <div className="flex items-center justify-end p-3">
        <button
          onClick={onToggleCollapse}
          className="p-1.5 text-zinc-400 transition-colors hover:text-zinc-600"
        >
          {collapsed ? (
            <IconChevronRight className="h-4 w-4" />
          ) : (
            <IconChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 space-y-0.5 px-3">
        {MAIN_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onItemChange(item.key)}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-2.5 text-xs font-medium uppercase tracking-wider transition-colors",
                isActive
                  ? "text-[#1a1a1a]"
                  : "text-zinc-500 hover:text-zinc-700"
              )}
              style={
                isActive
                  ? { backgroundColor: "#ebe7e1", borderLeft: "2px solid #c45a1a" }
                  : { borderLeft: "2px solid transparent" }
              }
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}

        {/* Separator */}
        {!collapsed && (
          <div className="my-4" style={{ borderTop: "1px solid #d9d4cd" }} />
        )}

        {/* Project tree */}
        {!collapsed && (
          <div>
            <button
              onClick={() => setExpandedProject(!expandedProject)}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium uppercase tracking-wider text-zinc-500 hover:text-zinc-700"
            >
              <IconChevronDown
                className={cn(
                  "h-3 w-3 transition-transform",
                  !expandedProject && "-rotate-90"
                )}
              />
              <span className="truncate">{clientCompany ?? projectName}</span>
            </button>

            {expandedProject && documents.length > 0 && (
              <div className="ml-4 space-y-0.5 pl-3" style={{ borderLeft: "1px solid #d9d4cd" }}>
                {documents.map((doc) => {
                  const DocIcon = getDocIcon(doc.type);
                  return (
                    <button
                      key={doc.id}
                      onClick={() => onItemChange(`doc:${doc.id}`)}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-1.5 text-xs transition-colors",
                        activeItem === `doc:${doc.id}`
                          ? "text-[#1a1a1a]"
                          : "text-zinc-500 hover:text-zinc-700"
                      )}
                    >
                      <DocIcon className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{doc.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 py-4" style={{ borderTop: "1px solid #d9d4cd" }}>
          <span
            className="text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{ color: "#c45a1a" }}
          >
            TBO
          </span>
          <p className="mt-0.5 text-[10px] text-zinc-400">
            Visualizacao Arquitetonica
          </p>
        </div>
      )}
    </aside>
  );
}
