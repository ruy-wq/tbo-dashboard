"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  IconBriefcase,
  IconListCheck,
  IconUser,
  IconCurrencyDollar,
  IconArrowRight,
  IconLayoutDashboard,
  IconTarget,
  IconMessage,
  IconCalendar,
  IconSettings,
  IconFileText,
  IconTruck,
  IconBuilding,
  IconHeartHandshake,
  IconSpeakerphone,
  IconChartBar,
  IconBookmark,
  IconWorld,
  IconUsers,
  IconShield,
  IconHistory,
  IconBook2,
  IconWriting,
} from "@tabler/icons-react";
import { useAuthStore } from "@/stores/auth-store";
import { PINNED_NAV_ITEMS, SIDEBAR_NAV_GROUPS } from "@/lib/navigation";
import {
  PROJETOS_NAV_ITEMS,
  TAREFAS_NAV_ITEMS,
  COMERCIAL_NAV_ITEMS,
  CONTRATOS_NAV_ITEMS,
  FINANCEIRO_NAV_ITEMS,
  PESSOAS_NAV_ITEMS,
  CULTURA_NAV_ITEMS,
  OKRS_NAV_ITEMS,
  MARKETING_NAV_ITEMS,
  SOPS_NAV_ITEMS,
  WEBSITE_ADMIN_NAV_ITEMS,
} from "@/lib/constants";
import { useGlobalSearch, type GlobalSearchResults } from "@/hooks/use-global-search";

/** Map parent hrefs to their sub-route arrays for command search indexing */
const SUB_ROUTES_MAP: Record<string, readonly { href: string; label: string; icon: string }[]> = {
  "/projetos": PROJETOS_NAV_ITEMS,
  "/tarefas": TAREFAS_NAV_ITEMS,
  "/comercial": COMERCIAL_NAV_ITEMS,
  "/contratos": CONTRATOS_NAV_ITEMS,
  "/financeiro": FINANCEIRO_NAV_ITEMS,
  "/pessoas": PESSOAS_NAV_ITEMS,
  "/cultura": CULTURA_NAV_ITEMS,
  "/cultura/okrs": OKRS_NAV_ITEMS,
  "/marketing": MARKETING_NAV_ITEMS,
  "/cultura/conhecimento": SOPS_NAV_ITEMS,
  "/website-admin": WEBSITE_ADMIN_NAV_ITEMS,
};

const ICON_MAP: Record<string, React.ElementType> = {
  "layout-dashboard": IconLayoutDashboard,
  briefcase: IconBriefcase,
  "list-checks": IconListCheck,
  "message-square": IconMessage,
  "dollar-sign": IconCurrencyDollar,
  "building-2": IconBuilding,
  "file-text": IconFileText,
  truck: IconTruck,
  users: IconUsers,
  "heart-handshake": IconHeartHandshake,
  target: IconTarget,
  speakerphone: IconSpeakerphone,
  "bar-chart-3": IconChartBar,
  "book-marked": IconBookmark,
  copy: IconFileText,
  map: IconFileText,
  world: IconWorld,
  "users-cog": IconUsers,
  settings: IconSettings,
  shield: IconShield,
  history: IconHistory,
  calendar: IconCalendar,
  "clipboard-check": IconFileText,
};

function DynamicResults({
  results,
  onSelect,
}: {
  results: GlobalSearchResults;
  onSelect: (href: string) => void;
}) {
  return (
    <>
      {results.projects.length > 0 && (
        <CommandGroup heading="Projetos">
          {results.projects.map((p) => (
            <CommandItem key={`project-${p.id}`} value={`projeto ${p.name}`} onSelect={() => onSelect(`/projetos/${p.id}`)}>
              <IconBriefcase className="size-4 text-muted-foreground" />
              <span className="flex-1 truncate">{p.name}</span>
              <CommandShortcut><IconArrowRight className="size-3" /></CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
      )}
      {results.tasks.length > 0 && (
        <CommandGroup heading="Tarefas">
          {results.tasks.map((t) => (
            <CommandItem key={`task-${t.id}`} value={`tarefa ${t.title}`} onSelect={() => onSelect(t.project_id ? `/projetos/${t.project_id}?task=${t.id}` : `/tarefas?task=${t.id}`)}>
              <IconListCheck className="size-4 text-muted-foreground" />
              <span className="flex-1 truncate">{t.title}</span>
              <CommandShortcut><IconArrowRight className="size-3" /></CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
      )}
      {results.people.length > 0 && (
        <CommandGroup heading="Pessoas">
          {results.people.map((p) => (
            <CommandItem key={`person-${p.id}`} value={`pessoa ${p.full_name}`} onSelect={() => onSelect(`/usuarios/${p.id}`)}>
              <IconUser className="size-4 text-muted-foreground" />
              <span className="flex-1 truncate">{p.full_name}</span>
              {p.role && <span className="text-xs text-muted-foreground">{p.role}</span>}
            </CommandItem>
          ))}
        </CommandGroup>
      )}
      {results.deals.length > 0 && (
        <CommandGroup heading="Deals">
          {results.deals.map((d) => (
            <CommandItem key={`deal-${d.id}`} value={`deal ${d.name}`} onSelect={() => onSelect(`/comercial?deal=${d.id}`)}>
              <IconCurrencyDollar className="size-4 text-muted-foreground" />
              <span className="flex-1 truncate">{d.name}</span>
              <CommandShortcut><IconArrowRight className="size-3" /></CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
      )}
      {results.contracts.length > 0 && (
        <CommandGroup heading="Contratos">
          {results.contracts.map((c) => (
            <CommandItem key={`contract-${c.id}`} value={`contrato ${c.title}`} onSelect={() => onSelect(`/contratos?contract=${c.id}`)}>
              <IconWriting className="size-4 text-muted-foreground" />
              <span className="flex-1 truncate">{c.title}</span>
              {c.person_name && <span className="text-xs text-muted-foreground truncate max-w-[120px]">{c.person_name}</span>}
            </CommandItem>
          ))}
        </CommandGroup>
      )}
      {results.sops.length > 0 && (
        <CommandGroup heading="Conhecimento">
          {results.sops.map((s) => (
            <CommandItem key={`sop-${s.id}`} value={`sop ${s.title}`} onSelect={() => onSelect(s.bu && s.slug ? `/cultura/conhecimento/sops/${s.bu}/${s.slug}` : "/cultura/conhecimento/sops")}>
              <IconBook2 className="size-4 text-muted-foreground" />
              <span className="flex-1 truncate">{s.title}</span>
              {s.bu && <span className="text-xs text-muted-foreground uppercase">{s.bu}</span>}
            </CommandItem>
          ))}
        </CommandGroup>
      )}
      {results.messages.length > 0 && (
        <CommandGroup heading="Mensagens">
          {results.messages.map((m) => (
            <CommandItem key={`message-${m.id}`} value={`mensagem ${m.content}`} onSelect={() => onSelect(m.channel_id ? `/chat?channel=${m.channel_id}&message=${m.id}` : "/chat")}>
              <IconMessage className="size-4 text-muted-foreground" />
              <span className="flex-1 truncate text-sm">{m.content.length > 80 ? `${m.content.slice(0, 80)}…` : m.content}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      )}
    </>
  );
}

export function CommandSearch() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const modules = useAuthStore((s) => s.modules);

  const canSee = useCallback(
    (module: string) => modules.includes("*") || modules.includes(module),
    [modules],
  );

  const { data: results } = useGlobalSearch(search);

  const allNavItems = useMemo(() => {
    const items = [...PINNED_NAV_ITEMS];
    for (const group of SIDEBAR_NAV_GROUPS) {
      for (const item of group.items) {
        items.push(item);
        const subs = SUB_ROUTES_MAP[item.href];
        if (subs) {
          for (const sub of subs) {
            items.push({ href: sub.href, label: sub.label, icon: sub.icon || item.icon, module: item.module });
          }
        }
      }
    }
    return items;
  }, []);

  const visibleNavItems = useMemo(
    () => allNavItems.filter((item) => canSee(item.module)),
    [allNavItems, canSee],
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function handleSelect(href: string) {
    setOpen(false);
    setSearch("");
    router.push(href);
  }

  const hasResults =
    results &&
    (results.projects.length > 0 ||
      results.tasks.length > 0 ||
      results.people.length > 0 ||
      results.deals.length > 0 ||
      results.contracts.length > 0 ||
      results.sops.length > 0 ||
      results.messages.length > 0);

  return (
    <CommandDialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setSearch("");
      }}
      title="Busca Global"
      description="Busque por projetos, tarefas, pessoas, contratos, conhecimento e mensagens"
    >
      <CommandInput
        placeholder="Buscar projetos, tarefas, pessoas, contratos..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        {results && <DynamicResults results={results} onSelect={handleSelect} />}
        {hasResults && <CommandSeparator />}
        <CommandGroup heading="Paginas">
          {visibleNavItems.map((item) => {
            const NavIcon = ICON_MAP[item.icon] ?? IconArrowRight;
            return (
              <CommandItem key={item.href} value={item.label} onSelect={() => handleSelect(item.href)}>
                <NavIcon className="size-4 text-muted-foreground" />
                <span>{item.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
