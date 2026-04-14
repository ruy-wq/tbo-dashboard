"use client";

import { useState } from "react";
import { PhaseTimeline } from "./phase-timeline";
import { PhaseChecklist } from "./phase-checklist";
import type { LaunchWithPhases, LaunchPhase, LaunchPhaseItem } from "../services/launches";

interface OperationalPanelProps {
  launch: LaunchWithPhases;
  canApproveGate: boolean;
}

export function OperationalPanel({ launch, canApproveGate }: OperationalPanelProps) {
  const phases = launch.launch_phases;
  const [selectedPhase, setSelectedPhase] = useState<
    (LaunchPhase & { launch_phase_items: LaunchPhaseItem[] }) | null
  >(phases.find((p) => p.phase_number === launch.current_phase) ?? phases[0] ?? null);

  return (
    <div className="flex gap-6 min-h-[500px]">
      {/* Sidebar: Phase Timeline */}
      <div className="w-[280px] shrink-0">
        <PhaseTimeline
          phases={phases}
          currentPhase={launch.current_phase}
          onSelectPhase={setSelectedPhase}
          selectedPhaseNumber={selectedPhase?.phase_number}
        />
      </div>

      {/* Main: Phase Detail */}
      <div className="flex-1 min-w-0">
        {selectedPhase ? (
          <PhaseChecklist
            phase={selectedPhase}
            launchId={launch.id}
            canApproveGate={canApproveGate}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Selecione uma fase
          </div>
        )}
      </div>
    </div>
  );
}
