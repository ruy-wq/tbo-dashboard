"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { IconCake, IconChevronRight } from "@tabler/icons-react";
import { useHubBirthdays, useUpcomingBirthdays } from "../hooks/use-hub-birthdays";
import type { BirthdayPerson } from "../services/hub-birthdays";

const T = {
  orange: "#c45a1a",
  orangeHover: "#aa4d17",
  r: "16px",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function BirthdayCard({ person }: { person: BirthdayPerson }) {
  return (
    <div
      className="relative overflow-hidden p-5 text-center"
      style={{
        background: `linear-gradient(135deg, ${T.orange} 0%, ${T.orangeHover} 100%)`,
        borderRadius: T.r,
        boxShadow: "0 8px 32px rgba(196,90,26,0.20)",
      }}
    >
      <div className="absolute inset-0 opacity-[0.06]">
        <div className="absolute -top-4 -right-4 size-20 border-[2px] border-white rounded-full" />
        <div className="absolute bottom-2 left-2 size-12 border-[2px] border-white rounded-full" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-center gap-1 mb-2">
          <IconCake className="size-4 text-white/80" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">
            Aniversario
          </span>
        </div>
        <Avatar className="size-14 mx-auto mb-2 ring-2 ring-white/30">
          {person.avatarUrl && <AvatarImage src={person.avatarUrl} />}
          <AvatarFallback
            className="text-base font-semibold"
            style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}
          >
            {initials(person.fullName)}
          </AvatarFallback>
        </Avatar>
        <h4 className="text-sm font-semibold text-white">{person.fullName}</h4>
        {person.role && (
          <p className="text-[11px] text-white/60 mt-0.5">{person.role}</p>
        )}
        <button className="mt-3 text-[10px] font-bold uppercase tracking-[0.15em] px-4 py-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors backdrop-blur-sm">
          <IconCake className="size-3 inline mr-1 -mt-px" />
          Enviar Parabens
        </button>
      </div>
    </div>
  );
}

function UpcomingList({ people }: { people: BirthdayPerson[] }) {
  if (people.length === 0) return null;
  return (
    <div
      className="p-4 rounded-xl"
      style={{
        background: "rgba(196,90,26,0.06)",
        border: "1px solid rgba(196,90,26,0.12)",
        borderRadius: T.r,
      }}
    >
      <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] mb-2" style={{ color: T.orange }}>
        Próximos aniversários
      </h4>
      <div className="space-y-2">
        {people.slice(0, 3).map((p) => (
          <div key={p.id} className="flex items-center gap-2">
            <Avatar className="size-6">
              {p.avatarUrl && <AvatarImage src={p.avatarUrl} />}
              <AvatarFallback className="text-[8px] font-semibold" style={{ background: "rgba(196,90,26,0.12)", color: T.orange }}>
                {initials(p.fullName)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs flex-1 truncate text-foreground">
              {p.fullName}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {p.birthDate.split("-").slice(1).reverse().join("/")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BirthdayWidget() {
  const { data: todayBirthdays, isLoading: loadingToday } = useHubBirthdays();
  const { data: upcoming = [], isLoading: loadingUpcoming } = useUpcomingBirthdays();

  if (loadingToday || loadingUpcoming) {
    return (
      <div className="p-5 rounded-2xl" style={{ background: "rgba(196,90,26,0.08)" }}>
        <Skeleton className="h-4 w-24 mx-auto mb-3" />
        <Skeleton className="size-14 rounded-full mx-auto mb-2" />
        <Skeleton className="h-4 w-32 mx-auto mb-1" />
        <Skeleton className="h-3 w-24 mx-auto" />
      </div>
    );
  }

  const hasTodayBirthday = todayBirthdays && todayBirthdays.length > 0;

  if (!hasTodayBirthday && upcoming.length === 0) {
    return (
      <div
        className="p-5 text-center rounded-2xl"
        style={{ background: "rgba(196,90,26,0.06)", borderRadius: T.r }}
      >
        <IconCake className="size-6 mx-auto mb-2" style={{ color: T.orange, opacity: 0.4 }} />
        <p className="text-xs text-muted-foreground">
          Nenhum aniversário próximo
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {hasTodayBirthday &&
        todayBirthdays.map((p) => <BirthdayCard key={p.id} person={p} />)}
      {upcoming.length > 0 && <UpcomingList people={upcoming} />}
    </div>
  );
}
