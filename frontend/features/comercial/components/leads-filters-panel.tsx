"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { IconFilter, IconX, IconChevronDown } from "@tabler/icons-react";

export interface LeadFiltersState {
  ufs: string[];
  portes: string[];
  bus: string[];
}

export const EMPTY_FILTERS: LeadFiltersState = {
  ufs: [],
  portes: [],
  bus: [],
};

interface MultiSelectProps {
  label: string;
  options: { value: string; count: number }[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

function MultiSelect({ label, options, selected, onChange }: MultiSelectProps) {
  function toggle(v: string) {
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  }
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-1.5">
          {label}
          {selected.length > 0 && (
            <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-[10px]">
              {selected.length}
            </Badge>
          )}
          <IconChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="max-h-[280px] overflow-y-auto p-2">
          {options.length === 0 ? (
            <p className="px-2 py-4 text-center text-xs text-muted-foreground">Sem opções</p>
          ) : (
            options.map((opt) => (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
              >
                <Checkbox
                  checked={selected.includes(opt.value)}
                  onCheckedChange={() => toggle(opt.value)}
                />
                <span className="flex-1 truncate">{opt.value}</span>
                <span className="text-xs text-muted-foreground">{opt.count}</span>
              </label>
            ))
          )}
        </div>
        {selected.length > 0 && (
          <div className="border-t px-2 py-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-full text-xs"
              onClick={() => onChange([])}
            >
              Limpar {label.toLowerCase()}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

interface LeadsFiltersPanelProps {
  filters: LeadFiltersState;
  onChange: (filters: LeadFiltersState) => void;
  options: {
    ufs: { value: string; count: number }[];
    portes: { value: string; count: number }[];
    bus: { value: string; count: number }[];
  };
  totalActive: number;
}

export function LeadsFiltersPanel({ filters, onChange, options, totalActive }: LeadsFiltersPanelProps) {
  const hasActive = totalActive > 0;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <IconFilter className="h-3.5 w-3.5" /> Filtros
      </span>
      <MultiSelect
        label="UF"
        options={options.ufs}
        selected={filters.ufs}
        onChange={(ufs) => onChange({ ...filters, ufs })}
      />
      <MultiSelect
        label="Porte"
        options={options.portes}
        selected={filters.portes}
        onChange={(portes) => onChange({ ...filters, portes })}
      />
      <MultiSelect
        label="BU"
        options={options.bus}
        selected={filters.bus}
        onChange={(bus) => onChange({ ...filters, bus })}
      />
      {hasActive && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-1 text-xs text-muted-foreground"
          onClick={() => onChange(EMPTY_FILTERS)}
        >
          <IconX className="h-3.5 w-3.5" />
          Limpar ({totalActive})
        </Button>
      )}
    </div>
  );
}
