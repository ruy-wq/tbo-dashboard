"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Must match the key union in project-topbar.tsx */
export type ProjectTabKey =
  | "overview"
  | "list"
  | "board"
  | "gantt"
  | "calendar"
  | "files"
  | "updates"
  | "activity"
  | "dashboard"
  | "overdue"
  | "intake"
  | "settings"
  | "portal"
  | "entregas";

export const DEFAULT_TAB_ORDER: ProjectTabKey[] = [
  "overview",
  "list",
  "board",
  "gantt",
  "calendar",
  "files",
  "updates",
  "activity",
  "dashboard",
  "overdue",
  "intake",
  "settings",
  "portal",
  "entregas",
];

/** Tabs hidden by default to reduce cognitive overload (7 visible + overflow) */
export const DEFAULT_HIDDEN_TABS: ProjectTabKey[] = [
  "activity",
  "overdue",
  "intake",
  "dashboard",
  "settings",
  "portal",
  "entregas",
];

interface ProjectTabsState {
  tabOrder: ProjectTabKey[];
  hiddenTabs: ProjectTabKey[];
  reorder: (keys: ProjectTabKey[]) => void;
  hideTab: (key: ProjectTabKey) => void;
  showTab: (key: ProjectTabKey) => void;
  resetTabs: () => void;
}

export const useProjectTabsStore = create<ProjectTabsState>()(
  persist(
    (set) => ({
      tabOrder: DEFAULT_TAB_ORDER,
      hiddenTabs: DEFAULT_HIDDEN_TABS,

      reorder: (keys) => set({ tabOrder: keys }),

      hideTab: (key) =>
        set((s) => ({
          hiddenTabs: s.hiddenTabs.includes(key)
            ? s.hiddenTabs
            : [...s.hiddenTabs, key],
        })),

      showTab: (key) =>
        set((s) => ({
          hiddenTabs: s.hiddenTabs.filter((k) => k !== key),
        })),

      resetTabs: () =>
        set({ tabOrder: DEFAULT_TAB_ORDER, hiddenTabs: DEFAULT_HIDDEN_TABS }),
    }),
    { name: "project-tabs-layout" },
  ),
);
