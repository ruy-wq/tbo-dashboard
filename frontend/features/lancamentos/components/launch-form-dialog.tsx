"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/stores/auth-store";
import { useCreateLaunch } from "../hooks/use-launches";

interface LaunchFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LaunchFormDialog({ open, onOpenChange }: LaunchFormDialogProps) {
  const tenantId = useAuthStore((s) => s.tenantId);
  const userId = useAuthStore((s) => s.user?.id);
  const createLaunch = useCreateLaunch();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [targetVgv, setTargetVgv] = useState("");
  const [targetUnits, setTargetUnits] = useState("");
  const [startDate, setStartDate] = useState("");
  const [targetDate, setTargetDate] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !tenantId) return;

    createLaunch.mutate(
      {
        tenant_id: tenantId,
        name: name.trim(),
        description: description.trim() || undefined,
        target_vgv: targetVgv ? Number(targetVgv) : undefined,
        target_units: targetUnits ? Number(targetUnits) : undefined,
        location: location.trim() || undefined,
        start_date: startDate || undefined,
        target_date: targetDate || undefined,
        created_by: userId,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setName("");
          setDescription("");
          setLocation("");
          setTargetVgv("");
          setTargetUnits("");
          setStartDate("");
          setTargetDate("");
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Lançamento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nome do Empreendimento *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Residencial Aurora"
              className="mt-1"
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-medium">Descrição</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descrição do lançamento..."
              className="mt-1 min-h-[60px]"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Localização</label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Cidade, bairro..."
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">VGV Alvo (R$)</label>
              <Input
                value={targetVgv}
                onChange={(e) => setTargetVgv(e.target.value)}
                placeholder="50000000"
                type="number"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Unidades</label>
              <Input
                value={targetUnits}
                onChange={(e) => setTargetUnits(e.target.value)}
                placeholder="120"
                type="number"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Data Início</label>
              <Input
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                type="date"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Data Alvo</label>
              <Input
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                type="date"
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!name.trim() || createLaunch.isPending}>
              {createLaunch.isPending ? "Criando..." : "Criar Lançamento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
