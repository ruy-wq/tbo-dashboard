"use client";

// Feature #89 — Modal para criar/editar segmentos de email com rule builder

import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { IconRefresh } from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  useCreateEmailSegment,
  useUpdateEmailSegment,
  useEstimateSegmentCount,
} from "../../hooks/use-email-segments";
import { SegmentRuleBuilder } from "./segment-rule-builder";
import type { EmailSegment, SegmentRuleSet } from "../../types/marketing";

const schema = z.object({
  name: z.string().min(2, "Nome obrigatório (mín. 2 caracteres)"),
  description: z.string().nullable(),
});

type FormValues = z.infer<typeof schema>;

const DEFAULT_RULES: SegmentRuleSet = { rules: [], match: "all" };

interface Props {
  open: boolean;
  onClose: () => void;
  segment?: EmailSegment | null;
}

export function SegmentFormModal({ open, onClose, segment }: Props) {
  const isEditing = !!segment;
  const createMutation = useCreateEmailSegment();
  const updateMutation = useUpdateEmailSegment();

  const [rules, setRules] = useState<SegmentRuleSet>(DEFAULT_RULES);

  // Debounce rules para estimativa (evitar queries a cada clique)
  const [debouncedRules, setDebouncedRules] = useState<SegmentRuleSet | null>(null);

  useEffect(() => {
    if (rules.rules.length === 0) {
      setDebouncedRules(null);
      return;
    }
    const timer = setTimeout(() => setDebouncedRules(rules), 600);
    return () => clearTimeout(timer);
  }, [rules]);

  const { data: estimatedCount, isFetching: isEstimating } =
    useEstimateSegmentCount(debouncedRules);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: null },
  });

  useEffect(() => {
    if (open) {
      if (segment) {
        form.reset({ name: segment.name, description: segment.description });
        setRules(segment.rules);
      } else {
        form.reset({ name: "", description: null });
        setRules(DEFAULT_RULES);
      }
    }
  }, [open, segment, form]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  function onSubmit(values: FormValues) {
    const payload = {
      name: values.name,
      description: values.description,
      rules,
      segment_type: "dynamic" as const,
      tags: [],
    };

    if (isEditing && segment) {
      updateMutation.mutate(
        { id: segment.id, data: payload },
        { onSuccess: onClose },
      );
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  }

  // Verificar se o segmento tem pelo menos uma regra com valor preenchido
  const hasValidRules = useMemo(() => {
    return rules.rules.some((r) => {
      if (Array.isArray(r.value)) return r.value.length > 0;
      if (typeof r.value === "boolean") return true;
      if (typeof r.value === "number") return true;
      return !!r.value;
    });
  }, [rules]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Segmento" : "Novo Segmento"}
          </DialogTitle>
        </DialogHeader>

        <Form form={form} onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Segmento</FormLabel>
                <Input
                  placeholder="Ex: Leads em Negociação com Valor > 50k"
                  {...field}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição (opcional)</FormLabel>
                <Textarea
                  placeholder="Descreva o objetivo deste segmento..."
                  rows={2}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value || null)}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Rule builder */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <FormLabel>Regras de Segmentação</FormLabel>
              {estimatedCount !== undefined && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 gap-1 text-xs text-muted-foreground"
                  onClick={() => setDebouncedRules({ ...rules })}
                >
                  <IconRefresh size={12} />
                  Atualizar contagem
                </Button>
              )}
            </div>
            <SegmentRuleBuilder
              value={rules}
              onChange={setRules}
              estimatedCount={estimatedCount}
              isEstimating={isEstimating}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || !hasValidRules}>
              {isPending
                ? "Salvando..."
                : isEditing
                  ? "Salvar Alterações"
                  : "Criar Segmento"}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
