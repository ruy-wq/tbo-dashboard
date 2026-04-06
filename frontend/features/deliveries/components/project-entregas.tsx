"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  IconPackage,
  IconPlus,
  IconPencil,
  IconLink,
  IconCheck,
  IconEye,
  IconEyeOff,
  IconExternalLink,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjectDeliveries, useCreateDelivery, useUpdateDelivery, useDeleteDelivery } from "@/features/deliveries/hooks/use-deliveries";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { DeliveryFormDialog, type DeliveryFormData } from "./delivery-form-dialog";
import type { DeliveryRow } from "@/features/deliveries/services/deliveries";

// ─── Props ───────────────────────────────────────────────────────────────────

interface ProjectEntregasProps {
  projectId: string;
  projectName?: string;
}

// ─── Project info hook ───────────────────────────────────────────────────────

function useProjectInfo(projectId: string) {
  return useQuery({
    queryKey: ["project-info-delivery", projectId],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("projects")
        .select("name, client, client_company")
        .eq("id", projectId)
        .single();
      return data as { name: string; client: string | null; client_company: string | null } | null;
    },
    staleTime: 300_000,
    enabled: !!projectId,
  });
}

// ─── Delivery Card ───────────────────────────────────────────────────────────

function DeliveryCard({
  delivery,
  onEdit,
  onToggleActive,
}: {
  delivery: DeliveryRow;
  onEdit: () => void;
  onToggleActive: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = useCallback(() => {
    const url = `${window.location.origin}/entrega/${delivery.token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [delivery.token]);

  const deliveryDate = delivery.delivery_date
    ? new Date(delivery.delivery_date + "T12:00:00").toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border bg-card p-5 transition-colors ${!delivery.is_active ? "opacity-50" : ""}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold truncate">{delivery.title}</h3>
            {delivery.is_active ? (
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 shrink-0">
                Ativa
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-zinc-100 text-zinc-500 shrink-0">
                Inativa
              </Badge>
            )}
          </div>

          {delivery.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {delivery.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {deliveryDate && <span>{deliveryDate}</span>}
            <span>{delivery.deliverables.length} entregaveis</span>
            <span>{delivery.access_count} acesso{delivery.access_count !== 1 ? "s" : ""}</span>
            {delivery.access_password && (
              <span className="font-mono bg-muted px-1.5 py-0.5 rounded">
                {delivery.access_password}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" onClick={handleCopyLink} title="Copiar link">
            {copied ? <IconCheck size={16} className="text-emerald-600" /> : <IconLink size={16} />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.open(`/entrega/${delivery.token}`, "_blank")}
            title="Abrir pagina"
          >
            <IconExternalLink size={16} />
          </Button>
          <Button variant="ghost" size="icon" onClick={onEdit} title="Editar">
            <IconPencil size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleActive}
            title={delivery.is_active ? "Desativar" : "Reativar"}
          >
            {delivery.is_active ? <IconEyeOff size={16} /> : <IconEye size={16} />}
          </Button>
        </div>
      </div>

      {/* Token URL preview */}
      <div className="mt-3 pt-3 border-t">
        <p className="text-[11px] text-muted-foreground font-mono truncate">
          /entrega/{delivery.token}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function ProjectEntregas({ projectId, projectName }: ProjectEntregasProps) {
  const { data: deliveries, isLoading } = useProjectDeliveries(projectId);
  const { data: projectInfo } = useProjectInfo(projectId);
  const createMutation = useCreateDelivery();
  const updateMutation = useUpdateDelivery();
  const deleteMutation = useDeleteDelivery();

  const [formOpen, setFormOpen] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<DeliveryRow | null>(null);

  const name = projectName ?? projectInfo?.name ?? "";
  const client = projectInfo?.client ?? null;
  const company = projectInfo?.client_company ?? null;

  function handleCreate() {
    setEditingDelivery(null);
    setFormOpen(true);
  }

  function handleEdit(delivery: DeliveryRow) {
    setEditingDelivery(delivery);
    setFormOpen(true);
  }

  function handleToggleActive(delivery: DeliveryRow) {
    if (delivery.is_active) {
      deleteMutation.mutate({ id: delivery.id, projectId });
    } else {
      updateMutation.mutate({
        id: delivery.id,
        updates: { is_active: true } as never,
      });
    }
  }

  function handleSubmit(data: DeliveryFormData) {
    if (editingDelivery) {
      updateMutation.mutate(
        { id: editingDelivery.id, updates: data },
        { onSuccess: () => setFormOpen(false) },
      );
    } else {
      createMutation.mutate(
        { ...data, project_id: projectId },
        { onSuccess: () => setFormOpen(false) },
      );
    }
  }

  // ─── Loading ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const activeDeliveries = deliveries?.filter((d) => d.is_active) ?? [];
  const inactiveDeliveries = deliveries?.filter((d) => !d.is_active) ?? [];

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <IconPackage size={20} />
            Entregas
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie as entregas publicas do projeto.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <IconPlus size={16} className="mr-1.5" />
          Nova Entrega
        </Button>
      </div>

      {/* Active deliveries */}
      {activeDeliveries.length === 0 && inactiveDeliveries.length === 0 && (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <IconPackage size={40} className="mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-base font-semibold mb-1">Nenhuma entrega criada</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Crie a primeira entrega para disponibilizar os arquivos ao cliente.
          </p>
          <Button onClick={handleCreate}>
            <IconPlus size={16} className="mr-1.5" />
            Criar primeira entrega
          </Button>
        </div>
      )}

      {activeDeliveries.length > 0 && (
        <div className="space-y-3">
          {activeDeliveries.map((d) => (
            <DeliveryCard
              key={d.id}
              delivery={d}
              onEdit={() => handleEdit(d)}
              onToggleActive={() => handleToggleActive(d)}
            />
          ))}
        </div>
      )}

      {/* Inactive deliveries */}
      {inactiveDeliveries.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Inativas ({inactiveDeliveries.length})
          </p>
          {inactiveDeliveries.map((d) => (
            <DeliveryCard
              key={d.id}
              delivery={d}
              onEdit={() => handleEdit(d)}
              onToggleActive={() => handleToggleActive(d)}
            />
          ))}
        </div>
      )}

      {/* Form dialog */}
      <DeliveryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        delivery={editingDelivery}
        projectId={projectId}
        projectName={name}
        clientName={client}
        clientCompany={company}
        onSubmit={handleSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
