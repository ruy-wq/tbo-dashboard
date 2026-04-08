"use client";

import {
  IconFolder,
  IconChecklist,
  IconChartBar,
} from "@tabler/icons-react";

export type PortalTabId = "files" | "tasks" | "reports";

interface PortalMainTabsProps {
  activeTab: PortalTabId;
  onTabChange: (tab: PortalTabId) => void;
}

const TABS: { key: PortalTabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "tasks", label: "Tarefas", icon: IconChecklist },
  { key: "files", label: "Arquivos", icon: IconFolder },
  { key: "reports", label: "Relatorios", icon: IconChartBar },
];

export function PortalMainTabs({ activeTab, onTabChange }: PortalMainTabsProps) {
  return (
    <div
      className="flex"
      style={{
        borderBottom: "1px solid #d9d4cd",
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      }}
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className="flex items-center gap-2 px-5 py-3 text-xs font-medium uppercase tracking-wider transition-colors"
            style={{
              color: isActive ? "#1a1a1a" : "#8a8580",
              borderBottom: isActive ? "2px solid #c45a1a" : "2px solid transparent",
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.color = "#4a4540";
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.color = "#8a8580";
            }}
          >
            <Icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
