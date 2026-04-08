"use client";

import { cn } from "@/lib/utils";

interface PortalLayoutProps {
  header: React.ReactNode;
  sidebar: React.ReactNode;
  main: React.ReactNode;
  rightPanel?: React.ReactNode;
  sidebarCollapsed?: boolean;
}

export function PortalLayout({
  header,
  sidebar,
  main,
  rightPanel,
  sidebarCollapsed = false,
}: PortalLayoutProps) {
  return (
    <div
      className="flex h-screen flex-col"
      style={{
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        backgroundColor: "#f0ede9",
      }}
    >
      {/* Header */}
      {header}

      {/* Body: sidebar + main + right panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="hidden lg:block">
          {sidebar}
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl px-6 py-8 lg:px-10">
            {main}
          </div>
        </main>

        {/* Right panel (optional) */}
        {rightPanel && (
          <div
            className="hidden w-80 flex-shrink-0 border-l xl:flex xl:flex-col"
            style={{ borderColor: "#d9d4cd", backgroundColor: "#f7f5f2" }}
          >
            {rightPanel}
          </div>
        )}
      </div>
    </div>
  );
}
