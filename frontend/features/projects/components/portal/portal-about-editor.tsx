"use client";

import { useState, useEffect } from "react";
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
import { IconDeviceFloppy, IconPlus, IconTrash } from "@tabler/icons-react";
import type { ProjectPortalAbout } from "./portal-about-section";

// ─── Props ───────────────────────────────────────────────────────────────────

interface PortalAboutEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ProjectPortalAbout;
  onSave: (data: ProjectPortalAbout) => void;
  isPending?: boolean;
}

// ─── Array helper ────────────────────────────────────────────────────────────

function ArrayEditor({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label} ({items.length})</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange([...items, ""])}
        >
          <IconPlus size={14} className="mr-1" />
          Adicionar
        </Button>
      </div>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <Input
            value={item}
            onChange={(e) => onChange(items.map((v, j) => (j === i ? e.target.value : v)))}
            placeholder={placeholder}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
          >
            <IconTrash size={14} />
          </Button>
        </div>
      ))}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PortalAboutEditor({
  open,
  onOpenChange,
  data,
  onSave,
  isPending,
}: PortalAboutEditorProps) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [category, setCategory] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [walkScore, setWalkScore] = useState<number | "">("");
  const [walkScoreLabel, setWalkScoreLabel] = useState("");
  const [nearbyPlaces, setNearbyPlaces] = useState<string[]>([]);
  const [typologies, setTypologies] = useState<{ tipo: string; area: string }[]>([]);
  const [commonAreas, setCommonAreas] = useState<string[]>([]);
  const [differentials, setDifferentials] = useState<string[]>([]);
  const [devDescription, setDevDescription] = useState("");
  const [devStats, setDevStats] = useState<{ value: string; label: string }[]>([]);
  const [devWebsite, setDevWebsite] = useState("");
  const [devPhone, setDevPhone] = useState("");
  const [devEmail, setDevEmail] = useState("");
  const [devOtherProjects, setDevOtherProjects] = useState<string[]>([]);
  const [deliveryYear, setDeliveryYear] = useState("");
  const [deliveryDescription, setDeliveryDescription] = useState("");

  // ── Reset on open ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    setCategory(data.category ?? "");
    setTagline(data.tagline ?? "");
    setDescription(data.description ?? "");
    setAddress(data.address ?? "");
    setWalkScore(data.walk_score ?? "");
    setWalkScoreLabel(data.walk_score_label ?? "");
    setNearbyPlaces(data.nearby_places ?? []);
    setTypologies(data.typologies ?? []);
    setCommonAreas(data.common_areas ?? []);
    setDifferentials(data.differentials ?? []);
    setDevDescription(data.developer?.description ?? "");
    setDevStats(data.developer?.stats ?? []);
    setDevWebsite(data.developer?.website ?? "");
    setDevPhone(data.developer?.phone ?? "");
    setDevEmail(data.developer?.email ?? "");
    setDevOtherProjects(data.developer?.other_projects ?? []);
    setDeliveryYear(data.delivery_year ?? "");
    setDeliveryDescription(data.delivery_description ?? "");
  }, [open, data]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const result: ProjectPortalAbout = {};

    if (category) result.category = category;
    if (tagline) result.tagline = tagline;
    if (description) result.description = description;
    if (address) result.address = address;
    if (walkScore !== "") result.walk_score = Number(walkScore);
    if (walkScoreLabel) result.walk_score_label = walkScoreLabel;
    if (nearbyPlaces.length > 0) result.nearby_places = nearbyPlaces.filter(Boolean);
    if (typologies.length > 0) result.typologies = typologies.filter((t) => t.tipo || t.area);
    if (commonAreas.length > 0) result.common_areas = commonAreas.filter(Boolean);
    if (differentials.length > 0) result.differentials = differentials.filter(Boolean);
    if (deliveryYear) result.delivery_year = deliveryYear;
    if (deliveryDescription) result.delivery_description = deliveryDescription;

    const dev: ProjectPortalAbout["developer"] = {};
    if (devDescription) dev.description = devDescription;
    if (devStats.length > 0) dev.stats = devStats.filter((s) => s.value || s.label);
    if (devWebsite) dev.website = devWebsite;
    if (devPhone) dev.phone = devPhone;
    if (devEmail) dev.email = devEmail;
    if (devOtherProjects.length > 0) dev.other_projects = devOtherProjects.filter(Boolean);
    if (Object.keys(dev).length > 0) result.developer = dev;

    onSave(result);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Informacoes do Empreendimento</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* ── Projeto ── */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Projeto
            </h3>
            <div>
              <Label>Categoria</Label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Lancamento Imobiliario"
              />
            </div>
            <div>
              <Label>Tagline</Label>
              <Input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Frase de impacto do empreendimento"
              />
            </div>
            <div>
              <Label>Descricao</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Texto institucional sobre o empreendimento..."
                rows={4}
                className="resize-none"
              />
            </div>
          </section>

          <Separator />

          {/* ── Localizacao ── */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Localizacao
            </h3>
            <div>
              <Label>Endereco</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua X, 146 — Bairro, Cidade"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Walk Score</Label>
                <Input
                  type="number"
                  value={walkScore}
                  onChange={(e) => setWalkScore(e.target.value ? Number(e.target.value) : "")}
                  placeholder="92"
                />
              </div>
              <div>
                <Label>Label do Walk Score</Label>
                <Input
                  value={walkScoreLabel}
                  onChange={(e) => setWalkScoreLabel(e.target.value)}
                  placeholder="Paraiso para Caminhantes"
                />
              </div>
            </div>
            <ArrayEditor
              label="Pontos proximos"
              items={nearbyPlaces}
              onChange={setNearbyPlaces}
              placeholder="Restaurante X — 3 min"
            />
          </section>

          <Separator />

          {/* ── Tipologias ── */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Tipologias
            </h3>
            <div className="flex items-center justify-between">
              <Label>Unidades ({typologies.length})</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setTypologies([...typologies, { tipo: "", area: "" }])}
              >
                <IconPlus size={14} className="mr-1" />
                Adicionar
              </Button>
            </div>
            {typologies.map((t, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={t.tipo}
                  onChange={(e) =>
                    setTypologies(typologies.map((v, j) => (j === i ? { ...v, tipo: e.target.value } : v)))
                  }
                  placeholder="2 Quartos"
                  className="flex-1"
                />
                <Input
                  value={t.area}
                  onChange={(e) =>
                    setTypologies(typologies.map((v, j) => (j === i ? { ...v, area: e.target.value } : v)))
                  }
                  placeholder="73,79 m2"
                  className="w-32"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => setTypologies(typologies.filter((_, j) => j !== i))}
                >
                  <IconTrash size={14} />
                </Button>
              </div>
            ))}
          </section>

          <Separator />

          {/* ── Areas Comuns ── */}
          <section className="space-y-3">
            <ArrayEditor
              label="Areas Comuns"
              items={commonAreas}
              onChange={setCommonAreas}
              placeholder="Piscina Coberta"
            />
          </section>

          <Separator />

          {/* ── Diferenciais ── */}
          <section className="space-y-3">
            <ArrayEditor
              label="Diferenciais"
              items={differentials}
              onChange={setDifferentials}
              placeholder="Piso aquecido nos banheiros"
            />
          </section>

          <Separator />

          {/* ── Incorporadora ── */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Incorporadora
            </h3>
            <div>
              <Label>Descricao</Label>
              <Textarea
                value={devDescription}
                onChange={(e) => setDevDescription(e.target.value)}
                placeholder="Historia e posicionamento da incorporadora..."
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Website</Label>
                <Input
                  value={devWebsite}
                  onChange={(e) => setDevWebsite(e.target.value)}
                  placeholder="grupothal.com.br"
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  value={devPhone}
                  onChange={(e) => setDevPhone(e.target.value)}
                  placeholder="(41) 3345-1212"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  value={devEmail}
                  onChange={(e) => setDevEmail(e.target.value)}
                  placeholder="contato@empresa.com.br"
                />
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Numeros ({devStats.length})</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDevStats([...devStats, { value: "", label: "" }])}
                >
                  <IconPlus size={14} className="mr-1" />
                  Adicionar
                </Button>
              </div>
              {devStats.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={s.value}
                    onChange={(e) =>
                      setDevStats(devStats.map((v, j) => (j === i ? { ...v, value: e.target.value } : v)))
                    }
                    placeholder="550k+"
                    className="w-32"
                  />
                  <Input
                    value={s.label}
                    onChange={(e) =>
                      setDevStats(devStats.map((v, j) => (j === i ? { ...v, label: e.target.value } : v)))
                    }
                    placeholder="m2 entregues"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => setDevStats(devStats.filter((_, j) => j !== i))}
                  >
                    <IconTrash size={14} />
                  </Button>
                </div>
              ))}
            </div>

            <ArrayEditor
              label="Outros empreendimentos"
              items={devOtherProjects}
              onChange={setDevOtherProjects}
              placeholder="Legacy (Pinhais)"
            />
          </section>

          <Separator />

          {/* ── Entrega ── */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Previsao de Entrega
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Ano</Label>
                <Input
                  value={deliveryYear}
                  onChange={(e) => setDeliveryYear(e.target.value)}
                  placeholder="2027"
                />
              </div>
              <div>
                <Label>Descricao</Label>
                <Input
                  value={deliveryDescription}
                  onChange={(e) => setDeliveryDescription(e.target.value)}
                  placeholder="Previsao de entrega do empreendimento"
                />
              </div>
            </div>
          </section>

          <Separator />

          {/* ── Actions ── */}
          <div className="flex items-center justify-end gap-3 pb-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              <IconDeviceFloppy size={16} className="mr-1.5" />
              {isPending ? "Salvando..." : "Salvar informacoes"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
