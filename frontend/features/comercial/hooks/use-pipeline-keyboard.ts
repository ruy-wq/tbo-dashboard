import { useEffect } from "react";
import { useGlobalShortcuts } from "@/hooks/use-global-shortcuts";

/**
 * Sets up pipeline-specific keyboard shortcuts:
 * - Global shortcuts via useGlobalShortcuts
 * - "tbo:open-search" event listener (focuses search input)
 * - "n" key to create a new deal (when not in an input)
 */
export function usePipelineKeyboard(onNewDeal: () => void) {
  useGlobalShortcuts();

  useEffect(() => {
    function onOpenSearch() {
      const input = document.querySelector<HTMLInputElement>(
        'input[placeholder*="Buscar"]'
      );
      input?.focus();
    }
    window.addEventListener("tbo:open-search", onOpenSearch);
    return () => window.removeEventListener("tbo:open-search", onOpenSearch);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "n" || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey)
        return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.target as HTMLElement)?.isContentEditable) return;
      onNewDeal();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onNewDeal]);
}
