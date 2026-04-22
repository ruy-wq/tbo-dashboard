"use client";

import { useCallback, useEffect, useState } from "react";

export type ColumnId =
  | "description"
  | "category"
  | "cost_center"
  | "counterpart"
  | "amount"
  | "date"
  | "due_date"
  | "status";

export interface ColumnLayout {
  id: ColumnId;
  width: number;
}

const DEFAULT_LAYOUT: ColumnLayout[] = [
  { id: "description", width: 280 },
  { id: "category", width: 220 },
  { id: "cost_center", width: 180 },
  { id: "counterpart", width: 220 },
  { id: "amount", width: 130 },
  { id: "date", width: 110 },
  { id: "due_date", width: 110 },
  { id: "status", width: 110 },
];

const MIN_WIDTH = 80;
const MAX_WIDTH = 640;
const STORAGE_KEY = "tbo:transacoes:columns-v1";

function readLayout(): ColumnLayout[] {
  if (typeof window === "undefined") return DEFAULT_LAYOUT;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LAYOUT;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return DEFAULT_LAYOUT;

    const validIds = new Set(DEFAULT_LAYOUT.map((c) => c.id));
    const seen = new Set<string>();
    const normalized: ColumnLayout[] = [];

    for (const raw of parsed as Array<Partial<ColumnLayout>>) {
      if (!raw?.id || !validIds.has(raw.id as ColumnId) || seen.has(raw.id)) continue;
      seen.add(raw.id);
      const width =
        typeof raw.width === "number"
          ? Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, raw.width))
          : DEFAULT_LAYOUT.find((c) => c.id === raw.id)!.width;
      normalized.push({ id: raw.id as ColumnId, width });
    }

    // Append any columns missing from stored state (new columns added later).
    for (const def of DEFAULT_LAYOUT) {
      if (!seen.has(def.id)) normalized.push(def);
    }
    return normalized;
  } catch {
    return DEFAULT_LAYOUT;
  }
}

function writeLayout(layout: ColumnLayout[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch {
    // Quota exceeded / private mode — preferência perdida, não é fatal.
  }
}

export function useTransactionsTableLayout() {
  // Arranca com o default para evitar hydration mismatch; lê localStorage em effect.
  const [layout, setLayout] = useState<ColumnLayout[]>(DEFAULT_LAYOUT);

  useEffect(() => {
    setLayout(readLayout());
  }, []);

  useEffect(() => {
    writeLayout(layout);
  }, [layout]);

  const reorderColumn = useCallback((activeId: ColumnId, overId: ColumnId) => {
    setLayout((prev) => {
      const from = prev.findIndex((c) => c.id === activeId);
      const to = prev.findIndex((c) => c.id === overId);
      if (from === -1 || to === -1 || from === to) return prev;
      const next = prev.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const resizeColumn = useCallback((id: ColumnId, width: number) => {
    const clamped = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(width)));
    setLayout((prev) =>
      prev.map((c) => (c.id === id ? { ...c, width: clamped } : c)),
    );
  }, []);

  const resetLayout = useCallback(() => setLayout(DEFAULT_LAYOUT), []);

  return { layout, reorderColumn, resizeColumn, resetLayout };
}
