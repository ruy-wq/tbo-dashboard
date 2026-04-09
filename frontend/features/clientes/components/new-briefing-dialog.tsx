"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateCreativeBriefing } from "@/features/clientes/hooks/use-creative-briefings";
import { useClients } from "@/features/clientes/hooks/use-clients";
import { toast } from "sonner";
import { IconCopy } from "@tabler/icons-react";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const schema = z.object({
  client_name: z.string().min(2, "Nome do cliente obrigatorio"),
  project_name: z.string().optional(),
  nome_empreendimento: z.string().optional(),
  incorporadora: z.string().optional(),
  observacoes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewBriefingDialog({ open, onOpenChange }: Props) {
  const [showLink, setShowLink] = useState(false);
  const [createdSlug, setCreatedSlug] = useState("");
  const [createdParams, setCreatedParams] = useState("");

  const createMutation = useCreateCreativeBriefing();
  const { data: clients = [] } = useClients();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      client_name: "",
      project_name: "",
      nome_empreendimento: "",
      incorporadora: "",
      observacoes: "",
    },
  });

  function handleClose() {
    form.reset();
    setShowLink(false);
    setCreatedSlug("");
    setCreatedParams("");
    onOpenChange(false);
  }

  async function onSubmit(values: FormValues) {
    const slug = slugify(values.client_name);
    const projectSlug = values.project_name
      ? slugify(values.project_name)
      : undefined;

    const formData: Record<string, unknown> = {};
    if (values.nome_empreendimento)
      formData.nome_empreendimento = values.nome_empreendimento;
    if (values.incorporadora) formData.incorporadora = values.incorporadora;
    if (values.observacoes) formData.observacoes = values.observacoes;

    try {
      await createMutation.mutateAsync({
        client_name: values.client_name,
        project_name: values.project_name,
        slug,
        project_slug: projectSlug,
        form_data: Object.keys(formData).length > 0 ? formData : undefined,
      });

      // Montar link para o cliente preencher o restante
      const params = new URLSearchParams();
      params.set("nome", values.client_name);
      if (projectSlug) params.set("projeto", projectSlug);
      if (values.project_name)
        params.set("projeto_nome", values.project_name);

      setCreatedSlug(slug);
      setCreatedParams(params.toString());
      setShowLink(true);
      toast.success("Briefing criado com sucesso!");
    } catch (err) {
      toast.error(
        `Erro ao criar briefing: ${err instanceof Error ? err.message : "desconhecido"}`,
      );
    }
  }

  function handleCopyLink() {
    const base = window.location.origin;
    const url = `${base}/briefing/${createdSlug}?${createdParams}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Briefing Criativo</DialogTitle>
        </DialogHeader>

        {showLink ? (
          /* Tela de sucesso com link */
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Briefing criado. Compartilhe o link abaixo para o cliente
              completar o preenchimento:
            </p>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
              <code className="flex-1 truncate text-xs">
                {window.location.origin}/briefing/{createdSlug}
                {createdParams ? `?${createdParams}` : ""}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyLink}
              >
                <IconCopy className="mr-1.5 h-3.5 w-3.5" />
                Copiar
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>Fechar</Button>
            </DialogFooter>
          </div>
        ) : (
          /* Formulario */
          <Form
            form={form}
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="client_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente *</FormLabel>
                  {clients.length > 0 ? (
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        if (v === "__custom__") {
                          field.onChange("");
                        } else {
                          field.onChange(v);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar cliente..." />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.name}>
                            {c.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="__custom__">
                          + Digitar manualmente
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : null}
                  {(clients.length === 0 || field.value === "") && (
                    <Input
                      placeholder="Nome do cliente"
                      value={field.value === "__custom__" ? "" : field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="project_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Projeto / Empreendimento</FormLabel>
                  <Input
                    placeholder="Ex: Residencial Vila Nova"
                    {...field}
                  />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="incorporadora"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Incorporadora</FormLabel>
                  <Input
                    placeholder="Ex: Plaenge, MRV, Cyrela..."
                    {...field}
                  />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observacoes iniciais</FormLabel>
                  <Textarea
                    placeholder="Contexto adicional para o briefing..."
                    className="resize-none"
                    rows={3}
                    {...field}
                  />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={createMutation.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Criando..." : "Criar Briefing"}
              </Button>
            </DialogFooter>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
