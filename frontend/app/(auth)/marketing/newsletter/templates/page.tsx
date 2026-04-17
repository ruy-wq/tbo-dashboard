"use client";

// Feature #16 — Ações (editar/duplicar/excluir) nos cards de template
// Feature #18 — Filtro por categoria com tabs dinâmicas

import { useState, useMemo } from "react";
import { sanitizeHtml } from "@/lib/sanitize";
import {
  IconPlus,
  IconSearch,
  IconTemplate,
  IconDots,
  IconEdit,
  IconCopy,
  IconTrash,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState, ErrorState } from "@/components/shared";
import { RequireRole } from "@/features/auth/components/require-role";
import {
  useEmailTemplates,
  useDeleteEmailTemplate,
  useDuplicateEmailTemplate,
} from "@/features/marketing/hooks/use-email-studio";
import { EmailTemplateFormModal } from "@/features/marketing/components/email-studio/email-template-form-modal";
import type { EmailTemplate } from "@/features/marketing/types/marketing";

function TemplatesContent() {
  const [search, setSearch] = useState("");
  const [categoryTab, setCategoryTab] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: templates, isLoading, error, refetch } = useEmailTemplates();
  const deleteMutation = useDeleteEmailTemplate();
  const duplicateMutation = useDuplicateEmailTemplate();

  // Derivar categorias únicas dos dados
  const categories = useMemo(() => {
    const cats = (templates ?? [])
      .map((t) => t.category)
      .filter((c): c is string => !!c);
    return Array.from(new Set(cats)).sort();
  }, [templates]);

  const filtered = useMemo(() => {
    return (templates ?? []).filter((t) => {
      if (categoryTab !== "all" && t.category !== categoryTab) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q)
      );
    });
  }, [templates, categoryTab, search]);

  function handleEdit(template: EmailTemplate) {
    setEditingTemplate(template);
    setModalOpen(true);
  }

  function handleModalClose() {
    setModalOpen(false);
    setEditingTemplate(null);
  }

  function handleDuplicate(template: EmailTemplate) {
    duplicateMutation.mutate({
      name: template.name,
      subject: template.subject,
      html_content: template.html_content,
      category: template.category,
      tags: template.tags,
    });
  }

  function confirmDelete() {
    if (!deletingId) return;
    deleteMutation.mutate(deletingId, {
      onSettled: () => setDeletingId(null),
    });
  }

  const deletingTemplate = templates?.find((t) => t.id === deletingId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Templates de Email</h1>
          <p className="text-sm text-muted-foreground">
            Biblioteca de templates reutilizáveis para campanhas de email.
          </p>
        </div>
        <Button onClick={() => { setEditingTemplate(null); setModalOpen(true); }}>
          <IconPlus className="mr-1 h-4 w-4" /> Novo Template
        </Button>
      </div>

      {/* Filtro por categoria + busca */}
      <div className="flex flex-wrap items-center gap-3">
        {categories.length > 0 && (
          <Tabs value={categoryTab} onValueChange={setCategoryTab}>
            <TabsList>
              <TabsTrigger value="all">
                Todos
                <Badge variant="secondary" className="ml-1.5 text-xs">
                  {(templates ?? []).length}
                </Badge>
              </TabsTrigger>
              {categories.map((cat) => {
                const count = (templates ?? []).filter((t) => t.category === cat).length;
                return (
                  <TabsTrigger key={cat} value={cat}>
                    {cat}
                    <Badge variant="secondary" className="ml-1.5 text-xs">{count}</Badge>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        )}
        <div className="relative flex-1 max-w-sm">
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {error ? (
        <ErrorState message="Erro ao carregar templates." onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={IconTemplate}
          title={search || categoryTab !== "all" ? "Nenhum template encontrado" : "Nenhum template ainda"}
          description={
            search || categoryTab !== "all"
              ? "Tente ajustar os filtros."
              : "Crie seu primeiro template de email para começar."
          }
          cta={
            !search && categoryTab === "all"
              ? { label: "Criar Template", onClick: () => setModalOpen(true) }
              : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((template) => (
            <Card
              key={template.id}
              className="group cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => handleEdit(template)}
            >
              <CardContent className="p-4 space-y-3">
                {/* Thumbnail / preview */}
                <div className="relative h-24 rounded-md bg-muted/40 flex items-center justify-center overflow-hidden">
                  {template.html_content ? (
                    <div className="absolute inset-0 pointer-events-none opacity-30 overflow-hidden">
                      <div
                        className="text-[6px] leading-tight p-1 text-foreground"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeHtml(template.html_content),
                        }}
                      />
                    </div>
                  ) : null}
                  <IconTemplate className="size-8 text-muted-foreground/40 z-10" />
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{template.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{template.subject}</p>
                  </div>

                  {/* Ações — Feature #16 */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <IconDots size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem onClick={() => handleEdit(template)}>
                        <IconEdit size={14} className="mr-2" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                        <IconCopy size={14} className="mr-2" /> Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeletingId(template.id)}
                      >
                        <IconTrash size={14} className="mr-2" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  {template.category && (
                    <Badge variant="secondary" className="text-xs">{template.category}</Badge>
                  )}
                  {template.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                  ))}
                  {template.tags.length > 2 && (
                    <span className="text-xs text-muted-foreground">+{template.tags.length - 2}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal criar/editar — Feature #17 */}
      <EmailTemplateFormModal
        open={modalOpen}
        onClose={handleModalClose}
        template={editingTemplate}
      />

      {/* AlertDialog excluir — Feature #16 */}
      <AlertDialog open={!!deletingId} onOpenChange={(v) => !v && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Template</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir{" "}
              <strong>{deletingTemplate?.name ?? "este template"}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function EmailStudioTemplatesPage() {
  return (
    <RequireRole module="marketing">
      <TemplatesContent />
    </RequireRole>
  );
}
