"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IconLink, IconLoader2 } from "@tabler/icons-react";
import { useCreateShowcase } from "@/features/portfolio/hooks/use-showcase";

interface CreateShowcaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  defaultTitle?: string;
}

export function CreateShowcaseDialog({
  open,
  onOpenChange,
  selectedIds,
  defaultTitle,
}: CreateShowcaseDialogProps) {
  const [title, setTitle] = useState(defaultTitle ?? "");
  const [description, setDescription] = useState("");
  const createMut = useCreateShowcase();

  function handleCreate() {
    if (!title.trim() || selectedIds.length === 0) return;
    createMut.mutate(
      { title: title.trim(), description: description.trim() || undefined, itemIds: selectedIds },
      {
        onSuccess: () => {
          setTitle("");
          setDescription("");
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Gerar Link de Apresentacao</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            {selectedIds.length} case{selectedIds.length !== 1 ? "s" : ""} selecionado
            {selectedIds.length !== 1 ? "s" : ""}. O link sera copiado automaticamente.
          </p>

          <div className="space-y-1.5">
            <Label>Titulo da apresentacao *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Cases Audiovisual - Plaenge"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label>Mensagem para o cliente (opcional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Selecionamos esses cases que demonstram nossa expertise em producao audiovisual..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!title.trim() || selectedIds.length === 0 || createMut.isPending}
          >
            {createMut.isPending ? (
              <IconLoader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <IconLink className="size-4 mr-2" />
            )}
            Gerar e copiar link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
