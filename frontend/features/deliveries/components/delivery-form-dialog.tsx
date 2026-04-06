"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { DeliverablesEditor } from "./deliverables-editor";
import type { DeliveryRow, DeliverableItem } from "@/features/deliveries/services/deliveries";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function generateToken(projectName: string, clientCompany: string): string {
  const proj = slugify(projectName || "projeto");
  const client = slugify(clientCompany || "cliente");
  return `${proj}-${client}-r01`;
}

function generatePassword(projectName: string): string {
  const slug = slugify(projectName || "projeto");
  const year = new Date().getFullYear();
  return `${slug}${year}`;
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface DeliveryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  delivery?: DeliveryRow | null;
  projectId: string;
  projectName: string;
  clientName?: string | null;
  clientCompany?: string | null;
  onSubmit: (data: DeliveryFormData) => void;
  isPending?: boolean;
}

export interface DeliveryFormData {
  token: string;
  title: string;
  description: string;
  client_name: string;
  client_company: string;
  project_name: string;
  delivered_by: string;
  delivery_date: string;
  hero_subtitle: string;
  accent_color: string;
  cover_image_url: string;
  personal_message: string;
  access_password: string;
  deliverables: DeliverableItem[];
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DeliveryFormDialog({
  open,
  onOpenChange,
  delivery,
  projectId,
  projectName,
  clientName,
  clientCompany,
  onSubmit,
  isPending,
}: DeliveryFormDialogProps) {
  void projectId;

  const isEdit = !!delivery;

  // ─── Form State ────────────────────────────────────────────────────────────
  const [token, setToken] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [formClientName, setFormClientName] = useState("");
  const [formClientCompany, setFormClientCompany] = useState("");
  const [formProjectName, setFormProjectName] = useState("");
  const [deliveredBy, setDeliveredBy] = useState("TBO | Lancamentos Imobiliarios");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [accentColor, setAccentColor] = useState("#ff6200");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const [accessPassword, setAccessPassword] = useState("");
  const [deliverables, setDeliverables] = useState<DeliverableItem[]>([]);

  // ─── Reset on open/delivery change ─────────────────────────────────────────
  useEffect(() => {
    if (!open) return;

    if (delivery) {
      setToken(delivery.token);
      setTitle(delivery.title);
      setDescription(delivery.description ?? "");
      setFormClientName(delivery.client_name ?? "");
      setFormClientCompany(delivery.client_company ?? "");
      setFormProjectName(delivery.project_name ?? "");
      setDeliveredBy(delivery.delivered_by ?? "TBO | Lancamentos Imobiliarios");
      setDeliveryDate(delivery.delivery_date ?? "");
      setHeroSubtitle(delivery.hero_subtitle ?? "");
      setAccentColor(delivery.accent_color ?? "#ff6200");
      setCoverImageUrl(delivery.cover_image_url ?? "");
      setPersonalMessage(delivery.personal_message ?? "");
      setAccessPassword(delivery.access_password ?? "");
      setDeliverables(delivery.deliverables ?? []);
    } else {
      // Defaults for new delivery
      const today = new Date().toISOString().slice(0, 10);
      setToken(generateToken(projectName, clientCompany ?? ""));
      setTitle(`${projectName} — Revisao 01`);
      setDescription("");
      setFormClientName(clientName ?? "");
      setFormClientCompany(clientCompany ?? "");
      setFormProjectName(projectName);
      setDeliveredBy("TBO | Lancamentos Imobiliarios");
      setDeliveryDate(today);
      setHeroSubtitle("");
      setAccentColor("#ff6200");
      setCoverImageUrl("");
      setPersonalMessage("");
      setAccessPassword(generatePassword(projectName));
      setDeliverables([]);
    }
  }, [open, delivery, projectName, clientName, clientCompany]);

  // ─── Validation ────────────────────────────────────────────────────────────
  const isValid = useMemo(
    () => token.trim() !== "" && title.trim() !== "" && deliverables.length > 0,
    [token, title, deliverables],
  );

  // ─── Submit ────────────────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    onSubmit({
      token: token.trim(),
      title: title.trim(),
      description: description.trim(),
      client_name: formClientName.trim(),
      client_company: formClientCompany.trim(),
      project_name: formProjectName.trim(),
      delivered_by: deliveredBy.trim(),
      delivery_date: deliveryDate,
      hero_subtitle: heroSubtitle.trim(),
      accent_color: accentColor,
      cover_image_url: coverImageUrl.trim(),
      personal_message: personalMessage.trim(),
      access_password: accessPassword.trim(),
      deliverables,
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Editar Entrega" : "Nova Entrega"}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* ── Identificacao ── */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Identificacao
            </h3>

            <div className="grid gap-3">
              <div>
                <Label htmlFor="token">Token (URL)</Label>
                <Input
                  id="token"
                  value={token}
                  onChange={(e) => setToken(slugify(e.target.value))}
                  placeholder="nome-projeto-cliente-r01"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  URL: /entrega/{token || "..."}
                </p>
              </div>

              <div>
                <Label htmlFor="title">Titulo</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Amaran — Revisao 01"
                />
              </div>

              <div>
                <Label htmlFor="description">Descricao</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Resumo do que esta sendo entregue..."
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          </section>

          <Separator />

          {/* ── Cliente ── */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Cliente
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nome do projeto</Label>
                <Input
                  value={formProjectName}
                  onChange={(e) => setFormProjectName(e.target.value)}
                />
              </div>
              <div>
                <Label>Empresa</Label>
                <Input
                  value={formClientCompany}
                  onChange={(e) => setFormClientCompany(e.target.value)}
                />
              </div>
              <div>
                <Label>Cliente</Label>
                <Input
                  value={formClientName}
                  onChange={(e) => setFormClientName(e.target.value)}
                />
              </div>
              <div>
                <Label>Entregue por</Label>
                <Input
                  value={deliveredBy}
                  onChange={(e) => setDeliveredBy(e.target.value)}
                />
              </div>
            </div>
          </section>

          <Separator />

          {/* ── Visual ── */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Visual
            </h3>

            <div className="grid gap-3">
              <div>
                <Label>Subtitulo do hero</Label>
                <Input
                  value={heroSubtitle}
                  onChange={(e) => setHeroSubtitle(e.target.value)}
                  placeholder="Branding · Digital 3D · Audiovisual · R01"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Cor accent</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-10 h-10 rounded-lg border cursor-pointer"
                    />
                    <Input
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label>Data da entrega</Label>
                  <Input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>URL da imagem de capa</Label>
                <Input
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="https://... (Supabase Storage ou URL externa)"
                />
              </div>
            </div>
          </section>

          <Separator />

          {/* ── Acesso ── */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Acesso
            </h3>

            <div className="grid gap-3">
              <div>
                <Label>Senha de acesso</Label>
                <Input
                  value={accessPassword}
                  onChange={(e) => setAccessPassword(e.target.value)}
                  placeholder="amaran2026"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Padrao: nome do empreendimento + ano. Deixe vazio para acesso sem senha.
                </p>
              </div>

              <div>
                <Label>Mensagem pessoal (opcional)</Label>
                <Textarea
                  value={personalMessage}
                  onChange={(e) => setPersonalMessage(e.target.value)}
                  placeholder="Mensagem que aparece na pagina de entrega..."
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>
          </section>

          <Separator />

          {/* ── Entregaveis ── */}
          <section className="space-y-4">
            <DeliverablesEditor items={deliverables} onChange={setDeliverables} />
          </section>

          <Separator />

          {/* ── Actions ── */}
          <div className="flex items-center justify-end gap-3 pb-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!isValid || isPending}>
              <IconDeviceFloppy size={16} className="mr-1.5" />
              {isPending ? "Salvando..." : isEdit ? "Salvar alteracoes" : "Criar entrega"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
