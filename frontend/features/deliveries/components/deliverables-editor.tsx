"use client";

import {
  IconPlus,
  IconTrash,
  IconFolder,
  IconFileTypePdf,
  IconRuler,
  IconPhoto,
  IconVideo,
  IconExternalLink,
  IconFileZip,
  IconGripVertical,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DeliverableItem } from "@/features/deliveries/services/deliveries";

// ─── Constants ───────────────────────────────────────────────────────────────

const TYPE_OPTIONS: { value: DeliverableItem["type"]; label: string; icon: typeof IconFolder }[] = [
  { value: "folder", label: "Pasta", icon: IconFolder },
  { value: "link", label: "Link", icon: IconExternalLink },
  { value: "pdf", label: "PDF", icon: IconFileTypePdf },
  { value: "video", label: "Video", icon: IconVideo },
  { value: "image", label: "Imagem", icon: IconPhoto },
  { value: "zip", label: "ZIP", icon: IconFileZip },
  { value: "dwg", label: "DWG", icon: IconRuler },
];

const EMPTY_ITEM: DeliverableItem = {
  title: "",
  description: "",
  type: "folder",
  url: "",
};

// ─── Props ───────────────────────────────────────────────────────────────────

interface DeliverablesEditorProps {
  items: DeliverableItem[];
  onChange: (items: DeliverableItem[]) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DeliverablesEditor({ items, onChange }: DeliverablesEditorProps) {
  function addItem() {
    onChange([...items, { ...EMPTY_ITEM }]);
  }

  function updateItem(index: number, patch: Partial<DeliverableItem>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">
          Entregaveis ({items.length})
        </p>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <IconPlus size={14} className="mr-1" />
          Adicionar
        </Button>
      </div>

      {items.length === 0 && (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum entregavel adicionado ainda.
          </p>
          <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={addItem}>
            <IconPlus size={14} className="mr-1" />
            Adicionar primeiro
          </Button>
        </div>
      )}

      {items.map((item, index) => (
        <div
          key={index}
          className="rounded-lg border bg-card p-4 space-y-3"
        >
          <div className="flex items-start gap-2">
            <IconGripVertical size={16} className="mt-2.5 text-muted-foreground/40 shrink-0" />

            <div className="flex-1 space-y-3">
              {/* Row 1: Type + Title */}
              <div className="flex gap-2">
                <Select
                  value={item.type}
                  onValueChange={(v) => updateItem(index, { type: v as DeliverableItem["type"] })}
                >
                  <SelectTrigger className="w-[120px] shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <opt.icon size={14} />
                          <span>{opt.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Titulo do entregavel"
                  value={item.title}
                  onChange={(e) => updateItem(index, { title: e.target.value })}
                  className="flex-1"
                />
              </div>

              {/* Row 2: URL */}
              <Input
                placeholder="URL (Google Drive, link externo, etc.)"
                value={item.url}
                onChange={(e) => updateItem(index, { url: e.target.value })}
              />

              {/* Row 3: Description */}
              <Textarea
                placeholder="Descricao breve (opcional)"
                value={item.description}
                onChange={(e) => updateItem(index, { description: e.target.value })}
                rows={2}
                className="resize-none"
              />
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => removeItem(index)}
            >
              <IconTrash size={16} />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
