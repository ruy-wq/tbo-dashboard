"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useUpdateLaunch } from "../hooks/use-launches";
import type { LaunchWithPhases } from "../services/launches";
import {
  IconTarget,
  IconUsers,
  IconBuildingSkyscraper,
  IconCurrencyDollar,
  IconFileText,
  IconBulb,
  IconEdit,
  IconCheck,
} from "@tabler/icons-react";

interface StrategicPanelProps {
  launch: LaunchWithPhases;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

interface FieldCardProps {
  icon: React.ElementType;
  label: string;
  value: string | null;
  field: string;
  launchId: string;
  type?: "text" | "textarea" | "currency";
}

function FieldCard({ icon: Icon, label, value, field, launchId, type = "textarea" }: FieldCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const updateLaunch = useUpdateLaunch();

  function handleSave() {
    const parsed = type === "currency" ? Number(draft.replace(/\D/g, "")) : draft;
    updateLaunch.mutate({
      id: launchId,
      updates: { [field]: parsed || null } as Record<string, unknown>,
    });
    setEditing(false);
  }

  return (
    <div className="rounded-lg border p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md flex items-center justify-center bg-primary/10">
            <Icon className="size-4 text-primary" />
          </div>
          <span className="text-sm font-semibold">{label}</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0"
          onClick={() => {
            if (editing) handleSave();
            else {
              setDraft(value ?? "");
              setEditing(true);
            }
          }}
        >
          {editing ? <IconCheck className="size-3.5" /> : <IconEdit className="size-3.5" />}
        </Button>
      </div>

      {editing ? (
        type === "textarea" ? (
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="text-sm min-h-[80px]"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Escape") setEditing(false);
            }}
          />
        ) : (
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") setEditing(false);
            }}
          />
        )
      ) : (
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {value || "Clique para definir..."}
        </p>
      )}
    </div>
  );
}

export function StrategicPanel({ launch }: StrategicPanelProps) {
  return (
    <div className="space-y-6">
      {/* KPIs Estratégicos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">VGV Alvo</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(launch.target_vgv)}</p>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Unidades</p>
          <p className="text-2xl font-bold mt-1">{launch.target_units}</p>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">VGV Realizado</p>
          <p className="text-2xl font-bold mt-1 text-green-600">{formatCurrency(launch.actual_vgv)}</p>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Vendidas</p>
          <p className="text-2xl font-bold mt-1 text-green-600">{launch.units_sold}</p>
        </div>
      </div>

      {/* Campos Estratégicos */}
      <div className="grid md:grid-cols-2 gap-4">
        <FieldCard
          icon={IconTarget}
          label="Diagnóstico de Mercado"
          value={launch.market_diagnosis}
          field="market_diagnosis"
          launchId={launch.id}
        />
        <FieldCard
          icon={IconUsers}
          label="Persona"
          value={launch.persona}
          field="persona"
          launchId={launch.id}
        />
        <FieldCard
          icon={IconBuildingSkyscraper}
          label="Posicionamento"
          value={launch.positioning}
          field="positioning"
          launchId={launch.id}
        />
        <FieldCard
          icon={IconBulb}
          label="Tese de Investimento"
          value={launch.investment_thesis}
          field="investment_thesis"
          launchId={launch.id}
        />
        <FieldCard
          icon={IconCurrencyDollar}
          label="Estratégia de Pricing"
          value={launch.pricing_strategy}
          field="pricing_strategy"
          launchId={launch.id}
        />
        <FieldCard
          icon={IconFileText}
          label="Política Comercial"
          value={launch.commercial_policy}
          field="commercial_policy"
          launchId={launch.id}
        />
      </div>
    </div>
  );
}
