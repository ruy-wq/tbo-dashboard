"use client";

// Feature #89 — Segment rule builder visual com filtro por etapa de funil

import { useCallback } from "react";
import {
  IconPlus,
  IconTrash,
  IconFilter,
  IconUsers,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DEAL_STAGES, DEAL_SOURCES } from "@/lib/constants";
import type {
  SegmentRule,
  SegmentRuleSet,
  SegmentRuleField,
  SegmentRuleOperator,
} from "../../types/marketing";

// ── Configuração dos campos disponíveis ───────────────────────────

const RULE_FIELDS: {
  value: SegmentRuleField;
  label: string;
  operators: { value: SegmentRuleOperator; label: string }[];
  inputType: "select" | "multi-select" | "number" | "date" | "boolean";
}[] = [
  {
    value: "funnel_stage",
    label: "Etapa do Funil",
    operators: [
      { value: "equals", label: "é igual a" },
      { value: "not_equals", label: "não é" },
      { value: "in", label: "está em" },
      { value: "not_in", label: "não está em" },
    ],
    inputType: "multi-select",
  },
  {
    value: "deal_source",
    label: "Origem do Lead",
    operators: [
      { value: "equals", label: "é igual a" },
      { value: "in", label: "está em" },
    ],
    inputType: "multi-select",
  },
  {
    value: "deal_value_min",
    label: "Valor Mínimo (R$)",
    operators: [{ value: "greater_than", label: "maior que" }],
    inputType: "number",
  },
  {
    value: "deal_value_max",
    label: "Valor Máximo (R$)",
    operators: [{ value: "less_than", label: "menor que" }],
    inputType: "number",
  },
  {
    value: "has_email",
    label: "Possui Email",
    operators: [{ value: "is_true", label: "sim" }],
    inputType: "boolean",
  },
  {
    value: "created_after",
    label: "Criado Depois de",
    operators: [{ value: "greater_than", label: "após" }],
    inputType: "date",
  },
  {
    value: "created_before",
    label: "Criado Antes de",
    operators: [{ value: "less_than", label: "antes de" }],
    inputType: "date",
  },
];

const STAGE_OPTIONS = Object.entries(DEAL_STAGES).map(([key, def]) => ({
  value: key,
  label: def.label,
  color: def.color,
  bg: def.bg,
}));

const SOURCE_OPTIONS = DEAL_SOURCES.map((s) => ({
  value: s,
  label: s.charAt(0).toUpperCase() + s.slice(1),
}));

// ── Componente de valor por tipo de campo ─────────────────────────

function RuleValueInput({
  rule,
  fieldConfig,
  onChange,
}: {
  rule: SegmentRule;
  fieldConfig: (typeof RULE_FIELDS)[number];
  onChange: (value: SegmentRule["value"]) => void;
}) {
  const currentValues = Array.isArray(rule.value) ? rule.value : [];

  if (fieldConfig.value === "funnel_stage") {
    if (rule.operator === "equals" || rule.operator === "not_equals") {
      return (
        <Select
          value={typeof rule.value === "string" ? rule.value : ""}
          onValueChange={onChange}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Selecionar..." />
          </SelectTrigger>
          <SelectContent>
            {STAGE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <div className="flex items-center gap-2">
                  <div
                    className="size-2 rounded-full"
                    style={{ backgroundColor: opt.color }}
                  />
                  {opt.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    // Multi-select para in/not_in
    return (
      <div className="flex flex-wrap gap-1.5">
        {STAGE_OPTIONS.map((opt) => {
          const selected = currentValues.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                const next = selected
                  ? currentValues.filter((v) => v !== opt.value)
                  : [...currentValues, opt.value];
                onChange(next);
              }}
              className="transition-all"
            >
              <Badge
                variant={selected ? "default" : "outline"}
                className="cursor-pointer gap-1.5 transition-colors"
                style={
                  selected
                    ? { backgroundColor: opt.color, color: "#fff", borderColor: opt.color }
                    : {}
                }
              >
                <div
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: selected ? "#fff" : opt.color }}
                />
                {opt.label}
              </Badge>
            </button>
          );
        })}
      </div>
    );
  }

  if (fieldConfig.value === "deal_source") {
    if (rule.operator === "equals") {
      return (
        <Select
          value={typeof rule.value === "string" ? rule.value : ""}
          onValueChange={onChange}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Selecionar..." />
          </SelectTrigger>
          <SelectContent>
            {SOURCE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    return (
      <div className="flex flex-wrap gap-1.5">
        {SOURCE_OPTIONS.map((opt) => {
          const selected = currentValues.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                const next = selected
                  ? currentValues.filter((v) => v !== opt.value)
                  : [...currentValues, opt.value];
                onChange(next);
              }}
            >
              <Badge
                variant={selected ? "default" : "outline"}
                className="cursor-pointer transition-colors"
              >
                {opt.label}
              </Badge>
            </button>
          );
        })}
      </div>
    );
  }

  if (fieldConfig.inputType === "number") {
    return (
      <Input
        type="number"
        value={typeof rule.value === "number" ? rule.value : ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : 0)}
        placeholder="0"
        className="w-32"
      />
    );
  }

  if (fieldConfig.inputType === "date") {
    return (
      <Input
        type="date"
        value={typeof rule.value === "string" ? rule.value : ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-40"
      />
    );
  }

  if (fieldConfig.inputType === "boolean") {
    return (
      <Badge variant="secondary" className="text-emerald-600">
        Sim
      </Badge>
    );
  }

  return null;
}

// ── Componente principal ──────────────────────────────────────────

interface SegmentRuleBuilderProps {
  value: SegmentRuleSet;
  onChange: (rules: SegmentRuleSet) => void;
  estimatedCount?: number;
  isEstimating?: boolean;
}

export function SegmentRuleBuilder({
  value,
  onChange,
  estimatedCount,
  isEstimating,
}: SegmentRuleBuilderProps) {
  const addRule = useCallback(() => {
    const newRule: SegmentRule = {
      field: "funnel_stage",
      operator: "in",
      value: [],
    };
    onChange({ ...value, rules: [...value.rules, newRule] });
  }, [value, onChange]);

  const removeRule = useCallback(
    (index: number) => {
      onChange({ ...value, rules: value.rules.filter((_, i) => i !== index) });
    },
    [value, onChange],
  );

  const updateRule = useCallback(
    (index: number, updates: Partial<SegmentRule>) => {
      const newRules = value.rules.map((r, i) =>
        i === index ? { ...r, ...updates } : r,
      );
      onChange({ ...value, rules: newRules });
    },
    [value, onChange],
  );

  const updateField = useCallback(
    (index: number, field: SegmentRuleField) => {
      const fieldConfig = RULE_FIELDS.find((f) => f.value === field);
      const defaultOp = fieldConfig?.operators[0]?.value ?? "equals";
      const defaultValue =
        fieldConfig?.inputType === "boolean"
          ? true
          : fieldConfig?.inputType === "number"
            ? 0
            : fieldConfig?.inputType === "multi-select"
              ? []
              : "";
      updateRule(index, { field, operator: defaultOp, value: defaultValue });
    },
    [updateRule],
  );

  return (
    <div className="space-y-4">
      {/* Header com match mode */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <IconFilter size={16} className="text-muted-foreground" />
          <span className="text-muted-foreground">Contatos que correspondem a</span>
          <Select
            value={value.match}
            onValueChange={(v) => onChange({ ...value, match: v as "all" | "any" })}
          >
            <SelectTrigger className="h-7 w-28 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">todas as regras</SelectItem>
              <SelectItem value="any">qualquer regra</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Contagem estimada */}
        {(estimatedCount !== undefined || isEstimating) && (
          <div className="flex items-center gap-1.5 text-sm">
            <IconUsers size={14} className="text-muted-foreground" />
            {isEstimating ? (
              <span className="text-muted-foreground animate-pulse">Estimando...</span>
            ) : (
              <span className="font-medium">
                {estimatedCount?.toLocaleString("pt-BR")} contatos
              </span>
            )}
          </div>
        )}
      </div>

      {/* Rules */}
      {value.rules.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed p-6 text-center text-sm text-muted-foreground">
          <IconFilter size={24} className="mx-auto mb-2 opacity-40" />
          <p>Nenhuma regra definida.</p>
          <p className="text-xs">Adicione regras para segmentar seus contatos.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {value.rules.map((rule, index) => {
            const fieldConfig = RULE_FIELDS.find((f) => f.value === rule.field);
            return (
              <div
                key={index}
                className="flex flex-wrap items-start gap-2 rounded-lg border bg-muted/20 p-3"
              >
                {/* Connector */}
                {index > 0 && (
                  <Badge variant="outline" className="mr-1 text-xs font-normal">
                    {value.match === "all" ? "E" : "OU"}
                  </Badge>
                )}

                {/* Field selector */}
                <Select
                  value={rule.field}
                  onValueChange={(v) => updateField(index, v as SegmentRuleField)}
                >
                  <SelectTrigger className="h-8 w-44 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RULE_FIELDS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Operator selector */}
                {fieldConfig && fieldConfig.operators.length > 1 && (
                  <Select
                    value={rule.operator}
                    onValueChange={(v) =>
                      updateRule(index, { operator: v as SegmentRuleOperator })
                    }
                  >
                    <SelectTrigger className="h-8 w-32 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldConfig.operators.map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Value input */}
                {fieldConfig && (
                  <RuleValueInput
                    rule={rule}
                    fieldConfig={fieldConfig}
                    onChange={(v) => updateRule(index, { value: v })}
                  />
                )}

                {/* Remove */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="ml-auto h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => removeRule(index)}
                >
                  <IconTrash size={14} />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add rule */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addRule}
        className="gap-1.5"
      >
        <IconPlus size={14} />
        Adicionar Regra
      </Button>
    </div>
  );
}
