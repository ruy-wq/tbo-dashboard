"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  IconBookmark,
  IconBookmarkFilled,
  IconChevronDown,
  IconPin,
  IconPinFilled,
  IconTrash,
  IconDeviceFloppy,
} from "@tabler/icons-react";
import { toast } from "sonner";
import {
  useSavedFilters,
  useCreateSavedFilter,
  useUpdateSavedFilter,
  useDeleteSavedFilter,
  type SavedFilter,
} from "@/features/comercial/hooks/use-saved-filters";

interface Props<T> {
  module: string;
  currentFilters: T;
  hasActiveFilters: boolean;
  onApply: (filters: T) => void;
  describeFilters: (filters: T) => string;
}

export function SavedFiltersDropdown<T>({
  module,
  currentFilters,
  hasActiveFilters,
  onApply,
  describeFilters,
}: Props<T>) {
  const { data: savedFilters = [] } = useSavedFilters<T>(module);
  const createMut = useCreateSavedFilter<T>();
  const updateMut = useUpdateSavedFilter<T>();
  const deleteMut = useDeleteSavedFilter();

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [name, setName] = useState("");

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Dê um nome ao filtro.");
      return;
    }
    try {
      await createMut.mutateAsync({ module, name: trimmed, filters: currentFilters });
      toast.success(`Filtro "${trimmed}" salvo`);
      setSaveDialogOpen(false);
      setName("");
    } catch {
      // erro tratado no hook
    }
  }

  async function handleDelete(f: SavedFilter<T>) {
    try {
      await deleteMut.mutateAsync(f.id);
      toast.success(`Filtro "${f.name}" removido`);
    } catch {}
  }

  async function handleTogglePin(f: SavedFilter<T>) {
    try {
      await updateMut.mutateAsync({
        id: f.id,
        updates: { is_pinned: !f.is_pinned },
      });
    } catch {}
  }

  const pinned = savedFilters.filter((f) => f.is_pinned);
  const others = savedFilters.filter((f) => !f.is_pinned);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-1.5">
            <IconBookmark className="h-3.5 w-3.5" /> Filtros salvos
            {savedFilters.length > 0 && (
              <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-[10px]">
                {savedFilters.length}
              </Badge>
            )}
            <IconChevronDown className="h-3 w-3 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-80">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Filtros salvos</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 gap-1 text-xs"
              disabled={!hasActiveFilters}
              onClick={(e) => {
                e.preventDefault();
                if (!hasActiveFilters) return;
                setSaveDialogOpen(true);
              }}
              title={hasActiveFilters ? "Salvar combinação atual" : "Defina filtros antes de salvar"}
            >
              <IconDeviceFloppy className="h-3.5 w-3.5" /> Salvar atual
            </Button>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {pinned.length > 0 && (
            <>
              <DropdownMenuLabel className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                Fixados
              </DropdownMenuLabel>
              {pinned.map((f) => (
                <SavedFilterItem
                  key={f.id}
                  filter={f}
                  describe={describeFilters}
                  onApply={() => onApply(f.filters)}
                  onTogglePin={() => handleTogglePin(f)}
                  onDelete={() => handleDelete(f)}
                />
              ))}
              <DropdownMenuSeparator />
            </>
          )}

          {others.length > 0 ? (
            others.map((f) => (
              <SavedFilterItem
                key={f.id}
                filter={f}
                describe={describeFilters}
                onApply={() => onApply(f.filters)}
                onTogglePin={() => handleTogglePin(f)}
                onDelete={() => handleDelete(f)}
              />
            ))
          ) : pinned.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              Nenhum filtro salvo ainda.
              <br />
              Defina filtros e clique em &quot;Salvar atual&quot;.
            </div>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Salvar combinação de filtros</DialogTitle>
            <DialogDescription>
              {describeFilters(currentFilters)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="filter-name">Nome do filtro</Label>
            <Input
              id="filter-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Hot leads PR Litoral, Render qualificados, etc."
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={createMut.isPending || !name.trim()}>
              {createMut.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SavedFilterItem<T>({
  filter,
  describe,
  onApply,
  onTogglePin,
  onDelete,
}: {
  filter: SavedFilter<T>;
  describe: (filters: T) => string;
  onApply: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenuItem
      className="flex items-center gap-2 py-2"
      onSelect={onApply}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="font-medium">{filter.name}</span>
          {filter.is_pinned && <IconPinFilled className="h-3 w-3 text-amber-500" />}
        </div>
        <div className="truncate text-[11px] text-muted-foreground">
          {describe(filter.filters) || "Sem filtros"}
        </div>
      </div>
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin();
          }}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          title={filter.is_pinned ? "Desfixar" : "Fixar"}
        >
          {filter.is_pinned ? <IconPinFilled className="h-3.5 w-3.5" /> : <IconPin className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          title="Remover"
        >
          <IconTrash className="h-3.5 w-3.5" />
        </button>
      </div>
    </DropdownMenuItem>
  );
}
