"use client";

import { useState, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { BU_LIST } from "@/lib/constants";
import {
  PORTFOLIO_CATEGORIES,
  type PortfolioItem,
  type PortfolioInsert,
} from "@/features/portfolio/types/portfolio";
import { PortfolioUpload } from "@/features/portfolio/components/portfolio-upload";

interface PortfolioFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: PortfolioItem | null;
  onSubmit: (data: Omit<PortfolioInsert, "tenant_id" | "created_by">) => void;
  isPending?: boolean;
}

export function PortfolioFormDialog({
  open,
  onOpenChange,
  item,
  onSubmit,
  isPending,
}: PortfolioFormDialogProps) {
  const isEdit = !!item;

  const [bu, setBu] = useState(item?.bu ?? "");
  const [category, setCategory] = useState(item?.category ?? "");
  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [clientCompany, setClientCompany] = useState(item?.client_company ?? "");
  const [projectName, setProjectName] = useState(item?.project_name ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(item?.thumbnail_url ?? "");
  const [externalUrl, setExternalUrl] = useState(item?.external_url ?? "");
  const [year, setYear] = useState(item?.year?.toString() ?? new Date().getFullYear().toString());
  const [tags, setTags] = useState(item?.tags?.join(", ") ?? "");

  const categories = useMemo(() => {
    return bu ? PORTFOLIO_CATEGORIES[bu] ?? [] : [];
  }, [bu]);

  function handleBuChange(value: string) {
    setBu(value);
    setCategory("");
  }

  function handleSubmit() {
    if (!bu || !category || !title) return;

    onSubmit({
      bu,
      category,
      title,
      description: description || null,
      client_company: clientCompany || null,
      project_name: projectName || null,
      thumbnail_url: thumbnailUrl || null,
      external_url: externalUrl || null,
      year: year ? parseInt(year, 10) : null,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      media_urls: [],
    });

    if (!isEdit) {
      setBu("");
      setCategory("");
      setTitle("");
      setDescription("");
      setClientCompany("");
      setProjectName("");
      setThumbnailUrl("");
      setExternalUrl("");
      setYear(new Date().getFullYear().toString());
      setTags("");
    }
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[440px] overflow-y-auto sm:max-w-[440px]">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Editar Case" : "Novo Case"}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* BU */}
          <div className="space-y-1.5">
            <Label>Business Unit *</Label>
            <Select value={bu} onValueChange={handleBuChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar BU" />
              </SelectTrigger>
              <SelectContent>
                {BU_LIST.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label>Categoria *</Label>
            <Select value={category} onValueChange={setCategory} disabled={!bu}>
              <SelectTrigger>
                <SelectValue placeholder={bu ? "Selecionar categoria" : "Selecione BU primeiro"} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label>Titulo *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Amaran - Video Institucional"
            />
          </div>

          {/* Client */}
          <div className="space-y-1.5">
            <Label>Cliente / Construtora</Label>
            <Input
              value={clientCompany}
              onChange={(e) => setClientCompany(e.target.value)}
              placeholder="Ex: Plaenge"
            />
          </div>

          {/* Project Name */}
          <div className="space-y-1.5">
            <Label>Empreendimento</Label>
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Ex: Porto Batel"
            />
          </div>

          {/* Year */}
          <div className="space-y-1.5">
            <Label>Ano</Label>
            <Input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              min={2015}
              max={2030}
            />
          </div>

          {/* Thumbnail */}
          <PortfolioUpload
            label="Thumbnail (capa)"
            accept="image"
            value={thumbnailUrl}
            onChange={setThumbnailUrl}
            hint="Imagem de capa do case. Upload ou cole URL."
          />

          {/* Video / Link externo */}
          <PortfolioUpload
            label="Video / Link"
            accept="video"
            value={externalUrl}
            onChange={setExternalUrl}
            hint="Upload de video ou link do Vimeo, YouTube, Google Drive."
          />

          {/* Description */}
          <div className="space-y-1.5">
            <Label>Descricao</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descricao do case..."
              rows={3}
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label>Tags (separadas por virgula)</Label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="alto padrao, residencial, curitiba"
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={!bu || !category || !title || isPending}
            className="w-full mt-4"
          >
            <IconDeviceFloppy className="size-4 mr-2" />
            {isEdit ? "Salvar alteracoes" : "Adicionar ao portfolio"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
