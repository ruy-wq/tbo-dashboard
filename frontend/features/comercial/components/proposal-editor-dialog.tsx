"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { IconCheck, IconLoader2 } from "@tabler/icons-react";
import { toast } from "sonner";

import {
  useCreateProposal,
  useUpdateProposal,
  useUpsertProposalItems,
} from "@/features/comercial/hooks/use-proposals";
import { usePricingPremises } from "@/features/comercial/hooks/use-pricing";
import { useServices } from "@/features/comercial/hooks/use-services";
import { ProposalItemsEditor, type ProposalItemDraft } from "./proposal-items-editor";
import { ProposalSummaryCard } from "./proposal-summary-card";
import type { ProposalWithItems } from "@/features/comercial/services/proposals";

const PROJECT_TYPES = [
  "Residencial Alto Padrão",
  "Residencial Médio Padrão",
  "Residencial Econômico",
  "Comercial",
  "Misto",
  "Loteamento",
  "Hotel / Resort",
  "Outro",
];

interface HeaderValues {
  name: string;
  company: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  project_type: string;
  project_location: string;
  valid_days: string;
  notes: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposal?: ProposalWithItems | null;
}

export function ProposalEditorDialog({ open, onOpenChange, proposal }: Props) {
  const isEditing = !!proposal;

  const createMutation = useCreateProposal();
  const updateMutation = useUpdateProposal();
  const upsertItems = useUpsertProposalItems();
  const { data: premises } = usePricingPremises();
  const { data: services = [] } = useServices({ status: "active" });

  const [proposalId, setProposalId] = useState<string | null>(null);
  const [headerSaved, setHeaderSaved] = useState(false);
  const [items, setItems] = useState<ProposalItemDraft[]>([]);
  const [urgencyFlag, setUrgencyFlag] = useState(false);
  const [packageDiscountPct, setPackageDiscountPct] = useState(0);
  const [cashDiscountPct, setCashDiscountPct] = useState(5);

  const urgencyMultiplier = premises?.urgency_multiplier ?? 1.4;

  const { register, handleSubmit, reset, setValue, watch } = useForm<HeaderValues>({
    defaultValues: {
      name: "", company: "", contact_name: "", contact_email: "",
      contact_phone: "", project_type: "", project_location: "",
      valid_days: "30", notes: "",
    },
  });
  const projectType = watch("project_type");

  useEffect(() => {
    if (proposal) {
      reset({
        name: proposal.name,
        company: proposal.company ?? "",
        contact_name: proposal.contact_name ?? "",
        contact_email: proposal.contact_email ?? "",
        contact_phone: proposal.contact_phone ?? "",
        project_type: proposal.project_type ?? "",
        project_location: proposal.project_location ?? "",
        valid_days: String(proposal.valid_days ?? 30),
        notes: proposal.notes ?? "",
      });
      setProposalId(proposal.id);
      setHeaderSaved(true);
      setUrgencyFlag(proposal.urgency_flag);
      setPackageDiscountPct(proposal.package_discount_pct ?? (proposal.package_discount_flag ? 8 : 0));
      setCashDiscountPct(proposal.cash_discount_pct ?? 5);
      setItems(
        (proposal.items ?? []).map((item) => ({
          id: item.id,
          service_id: item.service_id,
          title: item.title,
          description: item.description ?? "",
          bu: item.bu ?? "",
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_pct: item.discount_pct,
          observations: item.observations ?? "",
        })),
      );
    } else {
      reset({
        name: "", company: "", contact_name: "", contact_email: "",
        contact_phone: "", project_type: "", project_location: "",
        valid_days: "30", notes: "",
      });
      setProposalId(null);
      setHeaderSaved(false);
      setItems([]);
      setUrgencyFlag(false);
      setPackageDiscountPct(0);
      setCashDiscountPct(5);
    }
  }, [proposal, reset]);

  const subtotal = items.reduce(
    (s, i) => s + i.quantity * i.unit_price * (1 - i.discount_pct / 100),
    0,
  );
  const packageDiscount = packageDiscountPct > 0 ? subtotal * (packageDiscountPct / 100) : 0;
  const afterDiscount = subtotal - packageDiscount;
  const totalValue = urgencyFlag ? afterDiscount * urgencyMultiplier : afterDiscount;

  async function onSaveHeader(values: HeaderValues) {
    const payload = {
      name: values.name,
      company: values.company || null,
      contact_name: values.contact_name || null,
      contact_email: values.contact_email || null,
      contact_phone: values.contact_phone || null,
      project_type: values.project_type || null,
      project_location: values.project_location || null,
      valid_days: parseInt(values.valid_days) || 30,
      notes: values.notes || null,
    };

    if (proposalId) {
      await updateMutation.mutateAsync({ id: proposalId, updates: payload });
    } else {
      const created = await createMutation.mutateAsync(payload);
      setProposalId(created.id);
    }
    setHeaderSaved(true);
  }

  async function handleSaveAll() {
    if (!proposalId) {
      toast.error("Salve os dados do empreendimento primeiro.");
      return;
    }
    await upsertItems.mutateAsync({
      proposalId,
      items: items.map((item, i) => ({
        service_id: item.service_id,
        title: item.title,
        description: item.description || null,
        bu: item.bu || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_pct: item.discount_pct,
        observations: item.observations || null,
        sort_order: i,
      })),
    });
    await updateMutation.mutateAsync({
      id: proposalId,
      updates: {
        urgency_flag: urgencyFlag,
        package_discount_flag: packageDiscountPct > 0,
        package_discount_pct: packageDiscountPct,
        cash_discount_pct: cashDiscountPct,
        subtotal,
        discount_amount: packageDiscount,
        value: totalValue,
      },
    });
    toast.success("Proposta salva");
    onOpenChange(false);
  }

  const isPendingHeader = createMutation.isPending || updateMutation.isPending;
  const isPendingItems = upsertItems.isPending;
  const isSaving = isPendingHeader || isPendingItems;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? "Editar Proposta" : "Nova Proposta"}
            {proposal?.ref_code && (
              <Badge variant="outline" className="font-mono text-xs">
                {proposal.ref_code}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* ── Section 1: Header ────────────────────────────────────────── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Empreendimento
              </p>
              {headerSaved && (
                <span className="flex items-center gap-1 text-xs text-emerald-600">
                  <IconCheck className="h-3.5 w-3.5" /> Salvo
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs">Nome do empreendimento *</Label>
                <Input placeholder="Ex: Edifício Solaris" {...register("name", { required: true })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Tipologia</Label>
                  <Select value={projectType} onValueChange={(v) => setValue("project_type", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {PROJECT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Localização</Label>
                  <Input placeholder="Ex: Ecoville — Curitiba, PR" {...register("project_location")} />
                </div>
              </div>
            </div>

            <Separator />

            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Cliente
            </p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Empresa</Label>
                  <Input placeholder="Ex: Construtora Horizonte" {...register("company")} />
                </div>
                <div>
                  <Label className="text-xs">Contato</Label>
                  <Input placeholder="Nome do contato" {...register("contact_name")} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">E-mail</Label>
                  <Input type="email" placeholder="contato@empresa.com" {...register("contact_email")} />
                </div>
                <div>
                  <Label className="text-xs">Telefone</Label>
                  <Input placeholder="(41) 9 9999-9999" {...register("contact_phone")} />
                </div>
              </div>
            </div>

            <Separator />

            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Condições
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Validade (dias)</Label>
                <Input type="number" min={1} max={365} {...register("valid_days")} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Observações / Condições comerciais</Label>
              <Textarea
                rows={2}
                placeholder="Forma de pagamento, prazos, condições especiais..."
                {...register("notes")}
              />
            </div>

            <Button
              type="button"
              size="sm"
              disabled={isPendingHeader}
              onClick={handleSubmit(onSaveHeader)}
            >
              {isPendingHeader ? (
                <><IconLoader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Salvando...</>
              ) : headerSaved ? (
                <><IconCheck className="h-3.5 w-3.5 mr-1.5" /> Atualizar dados</>
              ) : (
                "Salvar e adicionar itens"
              )}
            </Button>
          </div>

          {/* ── Section 2: Items ──────────────────────────────────────────── */}
          {headerSaved && (
            <>
              <Separator />
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Itens da proposta
                </p>
                <ProposalItemsEditor
                  items={items}
                  services={services}
                  onChange={setItems}
                />
              </div>
            </>
          )}

          {/* ── Section 3: Summary ───────────────────────────────────────── */}
          {headerSaved && (
            <>
              <Separator />
              <ProposalSummaryCard
                items={items}
                urgencyFlag={urgencyFlag}
                packageDiscountPct={packageDiscountPct}
                cashDiscountPct={cashDiscountPct}
                urgencyMultiplier={urgencyMultiplier}
                onUrgencyChange={setUrgencyFlag}
                onPackageDiscountPctChange={setPackageDiscountPct}
              />
            </>
          )}

          {/* ── Actions ───────────────────────────────────────────────────── */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            {headerSaved && (
              <Button type="button" onClick={handleSaveAll} disabled={isSaving}>
                {isSaving ? (
                  <><IconLoader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Salvando...</>
                ) : (
                  "Salvar proposta"
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
