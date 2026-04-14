"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToggleChecklistItem, useAddChecklistItem, useApproveGate } from "../hooks/use-launches";
import { PHASE_STATUS_LABELS } from "../lib/constants";
import type { LaunchPhase, LaunchPhaseItem } from "../services/launches";
import {
  IconPlus,
  IconShieldCheck,
  IconLock,
} from "@tabler/icons-react";

interface PhaseChecklistProps {
  phase: LaunchPhase & { launch_phase_items: LaunchPhaseItem[] };
  launchId: string;
  canApproveGate: boolean;
}

export function PhaseChecklist({ phase, launchId, canApproveGate }: PhaseChecklistProps) {
  const [newItem, setNewItem] = useState("");
  const toggleItem = useToggleChecklistItem(launchId);
  const addItem = useAddChecklistItem(launchId);
  const approveGate = useApproveGate(launchId);

  const items = phase.launch_phase_items;
  const completed = items.filter((i) => i.is_completed).length;
  const total = items.length;
  const allRequiredDone = items.filter((i) => i.is_required).every((i) => i.is_completed);
  const allDone = total > 0 && completed === total;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  function handleAdd() {
    if (!newItem.trim()) return;
    addItem.mutate({ phaseId: phase.id, title: newItem.trim() });
    setNewItem("");
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {phase.phase_number}. {phase.name}
          </h3>
          <p className="text-sm text-muted-foreground">{phase.description}</p>
        </div>
        <Badge
          variant="outline"
          className="tabular-nums"
          style={{
            borderColor: allDone ? "#22c55e" : undefined,
            color: allDone ? "#22c55e" : undefined,
          }}
        >
          {completed}/{total} · {progress}%
        </Badge>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progress}%`,
            background: allDone
              ? "#22c55e"
              : progress > 50
                ? "#6366f1"
                : "#f59e0b",
          }}
        />
      </div>

      {/* Checklist items */}
      <div className="space-y-2">
        {items.map((item) => (
          <label
            key={item.id}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/40 transition-colors cursor-pointer group"
          >
            <Checkbox
              checked={item.is_completed}
              onCheckedChange={(checked) =>
                toggleItem.mutate({ itemId: item.id, completed: !!checked })
              }
              className="mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <span
                className={`text-sm ${
                  item.is_completed
                    ? "line-through text-muted-foreground"
                    : "text-foreground"
                }`}
              >
                {item.title}
              </span>
              {item.is_required && !item.is_completed && (
                <span className="ml-2 text-[10px] text-orange-500 font-medium">
                  obrigatório
                </span>
              )}
            </div>
          </label>
        ))}
      </div>

      {/* Add item */}
      <div className="flex gap-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Adicionar item..."
          className="text-sm"
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleAdd}
          disabled={!newItem.trim()}
        >
          <IconPlus className="size-4" />
        </Button>
      </div>

      {/* Gate approval */}
      {!phase.gate_approved && (
        <div
          className="flex items-center justify-between p-4 rounded-lg border"
          style={{
            borderColor: allRequiredDone
              ? "rgba(34,197,94,0.3)"
              : "rgba(148,163,184,0.2)",
            background: allRequiredDone
              ? "rgba(34,197,94,0.05)"
              : "rgba(148,163,184,0.03)",
          }}
        >
          <div className="flex items-center gap-2">
            {allRequiredDone ? (
              <IconShieldCheck className="size-5 text-green-500" />
            ) : (
              <IconLock className="size-5 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-medium">
                {allRequiredDone
                  ? "Gate pronto para aprovação"
                  : "Complete os itens obrigatórios"}
              </p>
              <p className="text-xs text-muted-foreground">
                {allRequiredDone
                  ? "Todos os itens obrigatórios foram concluídos"
                  : `${items.filter((i) => i.is_required && !i.is_completed).length} itens obrigatórios pendentes`}
              </p>
            </div>
          </div>
          {canApproveGate && allRequiredDone && (
            <Button
              size="sm"
              onClick={() => approveGate.mutate({ phaseId: phase.id })}
              disabled={approveGate.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Aprovar Gate
            </Button>
          )}
        </div>
      )}

      {phase.gate_approved && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <IconShieldCheck className="size-4 text-green-500" />
          <span className="text-sm text-green-600 font-medium">
            Gate aprovado
            {phase.gate_approved_at &&
              ` em ${new Date(phase.gate_approved_at).toLocaleDateString("pt-BR")}`}
          </span>
        </div>
      )}
    </div>
  );
}
