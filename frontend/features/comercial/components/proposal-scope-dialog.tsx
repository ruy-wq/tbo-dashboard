"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconLoader2,
  IconSparkles,
  IconPhoto,
  IconTrash,
  IconArrowRight,
  IconArrowLeft,
  IconCheck,
} from "@tabler/icons-react";

import { parseScope, type ParsedScopeItem } from "@/features/comercial/lib/scope-parser";
import { useServices } from "@/features/comercial/hooks/use-services";
import {
  useCreateProposal,
  useUpdateProposal,
  useUpsertProposalItems,
  useProposals,
} from "@/features/comercial/hooks/use-proposals";
import { generateRefCode, computeProposalTotals } from "@/features/comercial/services/proposals";
import { usePricingPremises } from "@/features/comercial/hooks/use-pricing";
import type { ServiceRow } from "@/features/comercial/services/services-catalog";

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

interface EditableItem extends ParsedScopeItem {
  unit_price: number;
  service_id: string | null;
  bu: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (proposalId: string) => void;
}

function formatBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * Tenta encontrar o serviço mais relevante para "Imagem 3D" no catálogo.
 */
function findImageService(services: ServiceRow[]): ServiceRow | undefined {
  const d3dServices = services.filter(
    (s) => s.bu === "Digital 3D" && s.status === "active",
  );

  // Prioridade: serviço com "imagem" e "estática" no nome
  const staticMatch = d3dServices.find(
    (s) =>
      s.name.toLowerCase().includes("imagem") &&
      s.name.toLowerCase().includes("estática"),
  );
  if (staticMatch) return staticMatch;

  // Fallback: serviço com "imagem" no nome
  const imageMatch = d3dServices.find((s) =>
    s.name.toLowerCase().includes("imagem"),
  );
  if (imageMatch) return imageMatch;

  // Fallback: serviço com "render" no nome
  const renderMatch = d3dServices.find((s) =>
    s.name.toLowerCase().includes("render"),
  );
  if (renderMatch) return renderMatch;

  // Fallback: primeiro serviço Digital 3D
  return d3dServices[0];
}

export function ProposalScopeDialog({ open, onOpenChange, onCreated }: Props) {
  // ─── State ───────────────────────────────────────────────────────
  const [step, setStep] = useState<"input" | "preview">("input");
  const [scopeText, setScopeText] = useState("");
  const [projectName, setProjectName] = useState("");
  const [company, setCompany] = useState("");
  const [projectType, setProjectType] = useState("");
  const [projectLocation, setProjectLocation] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [showD3D, setShowD3D] = useState(true);
  const [editableItems, setEditableItems] = useState<EditableItem[]>([]);

  // ─── Queries ─────────────────────────────────────────────────────
  const { data: services = [] } = useServices({ status: "active" });
  const { data: proposals = [] } = useProposals();
  const { data: premises } = usePricingPremises();
  const createMutation = useCreateProposal();
  const updateMutation = useUpdateProposal();
  const upsertItems = useUpsertProposalItems();

  const imageService = useMemo(() => findImageService(services), [services]);

  const defaultUnitPrice = imageService?.base_price ?? 0;

  // ─── Derived ─────────────────────────────────────────────────────
  const totals = useMemo(() => {
    const mapped = editableItems.map((i) => ({
      quantity: i.quantity,
      unit_price: i.unit_price,
      discount_pct: 0,
    }));
    return computeProposalTotals(mapped, false, false, 1, 0);
  }, [editableItems]);

  const totalImages = editableItems.reduce((s, i) => s + i.quantity, 0);

  // ─── Handlers ────────────────────────────────────────────────────
  function handleParse() {
    if (!scopeText.trim()) {
      toast.error("Cole o escopo no campo de texto.");
      return;
    }

    const parsed = parseScope(scopeText);

    if (parsed.items.length === 0) {
      toast.error("Nenhum item encontrado no escopo. Verifique o formato.");
      return;
    }

    const editable: EditableItem[] = parsed.items.map((item) => ({
      ...item,
      unit_price: defaultUnitPrice,
      service_id: imageService?.id ?? null,
      bu: "Digital 3D",
    }));

    setEditableItems(editable);
    setStep("preview");
  }

  function updateItem(index: number, patch: Partial<EditableItem>) {
    setEditableItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }

  function removeItem(index: number) {
    setEditableItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleCreate() {
    if (!projectName.trim()) {
      toast.error("Preencha o nome do empreendimento.");
      return;
    }

    if (editableItems.length === 0) {
      toast.error("Adicione pelo menos um item ao escopo.");
      return;
    }

    const refCode = generateRefCode(proposals.length);

    // 1. Create proposal
    const created = await createMutation.mutateAsync({
      name: projectName.trim(),
      company: company.trim() || null,
      contact_name: contactName.trim() || null,
      contact_email: contactEmail.trim() || null,
      project_type: projectType || null,
      project_location: projectLocation.trim() || null,
      ref_code: refCode,
      valid_days: 30,
      status: "draft",
      show_d3d_flow: showD3D,
      introduction: generateIntroduction(projectName, company, projectType),
      notes: generateNotes(),
      payment_conditions: generatePaymentConditions(totals.value),
    });

    // 2. Upsert items
    await upsertItems.mutateAsync({
      proposalId: created.id,
      items: editableItems.map((item, i) => ({
        service_id: item.service_id,
        title: item.title,
        description: item.description || null,
        bu: item.bu || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_pct: 0,
        sort_order: i,
      })),
    });

    // 3. Update totals
    await updateMutation.mutateAsync({
      id: created.id,
      updates: {
        subtotal: totals.subtotal,
        discount_amount: totals.discount_amount,
        value: totals.value,
      },
    });

    toast.success(`Proposta "${projectName}" criada com ${totalImages} imagens`);
    handleReset();
    onOpenChange(false);
    onCreated?.(created.id);
  }

  function handleReset() {
    setStep("input");
    setScopeText("");
    setProjectName("");
    setCompany("");
    setProjectType("");
    setProjectLocation("");
    setContactName("");
    setContactEmail("");
    setShowD3D(true);
    setEditableItems([]);
  }

  function handleClose(open: boolean) {
    if (!open) handleReset();
    onOpenChange(open);
  }

  const isSaving =
    createMutation.isPending ||
    updateMutation.isPending ||
    upsertItems.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconSparkles className="h-5 w-5 text-[#E85102]" />
            Gerar Proposta do Escopo
          </DialogTitle>
        </DialogHeader>

        {step === "input" ? (
            <div className="space-y-5">
              {/* Project info */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Empreendimento
                </p>
                <div>
                  <Label className="text-xs">Nome do empreendimento *</Label>
                  <Input
                    placeholder="Ex: Essenza Tambaú Apart Hotel"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Empresa / Incorporadora</Label>
                    <Input
                      placeholder="Ex: Eleven Incorporadora"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Tipologia</Label>
                    <Select value={projectType} onValueChange={setProjectType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {PROJECT_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Localização</Label>
                    <Input
                      placeholder="Ex: Tambaú — João Pessoa, PB"
                      value={projectLocation}
                      onChange={(e) => setProjectLocation(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Contato</Label>
                    <Input
                      placeholder="Nome do contato"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <Label className="text-xs">Incluir fluxo D3D</Label>
                    <p className="text-[10px] text-muted-foreground">
                      Processo, timeline e diferenciais TBO
                    </p>
                  </div>
                  <Switch checked={showD3D} onCheckedChange={setShowD3D} />
                </div>
              </div>

              <Separator />

              {/* Scope textarea */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Escopo
                  </p>
                  {imageService && (
                    <Badge variant="outline" className="text-[10px]">
                      Preço base: {formatBRL(imageService.base_price)} / imagem
                    </Badge>
                  )}
                </div>
                <Textarea
                  rows={12}
                  value={scopeText}
                  onChange={(e) => setScopeText(e.target.value)}
                  placeholder={`Cole o escopo aqui. Exemplo:\n\nfachada e implantação (2 imagens)\n\ncobertura:\nbar da cobertura\n(2 imagens)\n\n4 andar:\n- piscina\n- terraço com mesas\n- spa\n- restaurante\n(4 imagens)\n\n- recepção (1 imagem)`}
                  className="font-mono text-sm"
                />
                <p className="text-[10px] text-muted-foreground">
                  O parser identifica itens por bullet points (- item), seções (nome:),
                  e quantidades entre parênteses (N imagens).
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleClose(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleParse}
                  disabled={!scopeText.trim()}
                >
                  Analisar escopo
                  <IconArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Summary bar */}
              <div className="rounded-lg bg-zinc-50 border p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">
                    {projectName || "Sem nome"}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {company && `${company} · `}
                    {editableItems.length} itens · {totalImages} imagens
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-500">Valor total</p>
                  <p className="text-lg font-bold text-[#E85102]">
                    {formatBRL(totals.value)}
                  </p>
                </div>
              </div>

              {/* Items list */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Itens do escopo
                </p>

                <div className="space-y-1.5">
                  {editableItems.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-lg border bg-card p-3 group hover:border-zinc-300 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <IconPhoto className="h-4 w-4 text-zinc-400" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <Input
                            value={item.title}
                            onChange={(e) =>
                              updateItem(index, { title: e.target.value })
                            }
                            className="h-7 text-sm font-medium border-0 bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                          />
                          {item.description && (
                            <p className="text-[11px] text-zinc-400">
                              {item.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="space-y-0.5">
                            <Label className="text-[10px] text-muted-foreground">
                              Qtd
                            </Label>
                            <Input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(index, {
                                  quantity: parseInt(e.target.value) || 1,
                                })
                              }
                              className="h-7 w-14 text-xs text-center"
                            />
                          </div>
                          <div className="space-y-0.5">
                            <Label className="text-[10px] text-muted-foreground">
                              Preço unit.
                            </Label>
                            <Input
                              type="number"
                              min={0}
                              step={100}
                              value={item.unit_price}
                              onChange={(e) =>
                                updateItem(index, {
                                  unit_price: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="h-7 w-24 text-xs"
                            />
                          </div>
                          <div className="space-y-0.5">
                            <Label className="text-[10px] text-muted-foreground">
                              Subtotal
                            </Label>
                            <p className="text-xs font-semibold pt-1">
                              {formatBRL(item.quantity * item.unit_price)}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeItem(index)}
                          >
                            <IconTrash className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="rounded-lg bg-zinc-50 border p-4 flex items-center justify-between">
                <span className="font-semibold text-sm text-zinc-700">
                  Total ({totalImages} imagens)
                </span>
                <span className="font-bold text-lg text-[#E85102]">
                  {formatBRL(totals.value)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex justify-between pt-2 border-t">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep("input")}
                >
                  <IconArrowLeft className="h-4 w-4 mr-1" />
                  Voltar
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleClose(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCreate}
                    disabled={isSaving || editableItems.length === 0}
                  >
                    {isSaving ? (
                      <>
                        <IconLoader2 className="h-4 w-4 mr-1 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <IconCheck className="h-4 w-4 mr-1" />
                        Criar proposta
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Text Generators ──────────────────────────────────────────────────────────

function generateIntroduction(
  name: string,
  company: string,
  projectType: string,
): string {
  const companyText = company ? ` da ${company}` : "";
  const typeText = projectType ? ` (${projectType})` : "";
  return `Apresentamos a proposta de imagens 3D para o empreendimento ${name}${companyText}${typeText}.

O pacote de imagens foi planejado para cobrir todos os ambientes-chave do projeto, desde a fachada e implantação até os espaços internos e áreas comuns, gerando o material visual necessário para a comunicação comercial do lançamento.

As imagens serão produzidas com o padrão de qualidade TBO — fotorrealismo, iluminação cinematográfica e atenção aos detalhes de materialidade e paisagismo.`;
}

function generateNotes(): string {
  return `• Prazo estimado: 20-25 dias úteis após aprovação e recebimento do material técnico (plantas, memorial, referências)
• Revisões incluídas: 2 rodadas de ajustes por imagem
• Formato de entrega: JPEG alta resolução (300dpi) + versão web otimizada
• Material necessário para início: projeto arquitetônico (DWG/RVT), memorial descritivo, referências visuais
• Proposta válida por 30 dias a partir da data de emissão`;
}

function generatePaymentConditions(totalValue: number) {
  return [
    {
      label: "À vista",
      description: "Pagamento integral via PIX ou transferência",
      details: `${formatBRL(totalValue)} em parcela única com 5% de desconto: ${formatBRL(totalValue * 0.95)}`,
      highlight: false,
    },
    {
      label: "2x",
      description: "50% na aprovação + 50% na entrega",
      details: `2x de ${formatBRL(totalValue / 2)}`,
      highlight: true,
    },
    {
      label: "3x",
      description: "40% na aprovação + 30% no meio + 30% na entrega",
      details: `${formatBRL(totalValue * 0.4)} + ${formatBRL(totalValue * 0.3)} + ${formatBRL(totalValue * 0.3)}`,
      highlight: false,
    },
  ];
}
