"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { IconCalendar, IconChevronRight } from "@tabler/icons-react";
import { useHrCalendarEvents } from "@/features/cultura/hooks/use-hr-calendar";
import type { HrCalendarItem } from "@/features/cultura/services/hr-calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionCard } from "./section-card";

/* ─── Helpers ──────────────────────────────────────────────────── */

const WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];
const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function toYmd(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Build a full month grid (6 weeks × 7 days = 42 cells) starting Monday. */
function buildCalendarGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells: { day: number; inMonth: boolean }[] = [];
  for (let i = startDow - 1; i >= 0; i--) {
    cells.push({ day: prevMonthDays - i, inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, inMonth: true });
  }
  let trailing = 1;
  while (cells.length < 42) {
    cells.push({ day: trailing++, inMonth: false });
  }

  const today = new Date();
  const todayDay =
    today.getFullYear() === year && today.getMonth() === month
      ? today.getDate()
      : -1;

  return { cells, todayDay };
}

function getMonthGridRange(year: number, month: number) {
  // Grid spans up to 6 prior days (previous month overflow) and up to 13 trailing.
  // Use month +/- 1 as safety margin so the RH query covers the visible grid.
  const s = new Date(year, month - 1, 1);
  const e = new Date(year, month + 2, 0);
  return { start: toYmd(s), end: toYmd(e) };
}

/* ─── Component ───────────────────────────────────────────────── */

export function CalendarWidget() {
  const now = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(() => new Date(now));
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const { cells, todayDay } = useMemo(
    () => buildCalendarGrid(year, month),
    [year, month],
  );

  const range = useMemo(() => getMonthGridRange(year, month), [year, month]);
  const { data: allEvents = [], isLoading } = useHrCalendarEvents(
    range.start,
    range.end,
  );

  const todayYmd = useMemo(() => toYmd(now), [now]);

  const eventsByDay = useMemo(() => {
    const map = new Map<number, HrCalendarItem[]>();
    for (const ev of allEvents) {
      const d = new Date(ev.startDate + "T12:00:00");
      if (d.getFullYear() !== year || d.getMonth() !== month) continue;
      const day = d.getDate();
      const list = map.get(day) ?? [];
      list.push(ev);
      map.set(day, list);
    }
    return map;
  }, [allEvents, year, month]);

  const todayEvents = useMemo(
    () => allEvents.filter((ev) => ev.startDate === todayYmd),
    [allEvents, todayYmd],
  );

  const visibleEvents = todayEvents.slice(0, 4);

  return (
    <SectionCard>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Calendario</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
            className="p-0.5 rounded hover:bg-black/5 transition-colors"
            aria-label="Mes anterior"
          >
            <IconChevronRight className="size-3.5 rotate-180 text-muted-foreground" />
          </button>
          <span className="text-xs font-medium min-w-[90px] text-center text-muted-foreground">
            {MONTH_NAMES[month]} {year}
          </span>
          <button
            onClick={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
            className="p-0.5 rounded hover:bg-black/5 transition-colors"
            aria-label="Proximo mes"
          >
            <IconChevronRight className="size-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-0 mb-1" role="row">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="text-center py-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {d}
            </span>
          </div>
        ))}
      </div>

      {/* Calendar grid — full month (6 weeks) */}
      {isLoading ? (
        <div className="grid grid-cols-7 gap-0 mb-3">
          {Array.from({ length: 42 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center py-1.5">
              <Skeleton className="size-7 rounded-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-0 mb-3" role="grid">
          {cells.map((cell, i) => {
            const isToday = cell.inMonth && cell.day === todayDay;
            const dayEvents = cell.inMonth ? eventsByDay.get(cell.day) ?? [] : [];
            const hasEvent = dayEvents.length > 0;
            const dotColor = dayEvents[0]?.color?.text;
            return (
              <div key={i} className="flex flex-col items-center py-1" role="gridcell">
                <span
                  className={`inline-flex items-center justify-center size-7 text-xs font-medium rounded-full transition-colors ${
                    isToday
                      ? "bg-hub-orange text-white shadow-[0_4px_12px_rgba(196,90,26,0.3)]"
                      : cell.inMonth
                        ? "text-foreground"
                        : "text-muted-foreground opacity-40"
                  }`}
                  aria-current={isToday ? "date" : undefined}
                >
                  {cell.day}
                </span>
                {hasEvent && !isToday && (
                  <span
                    className="size-1 rounded-full mt-0.5"
                    style={{ background: dotColor ?? "#c45a1a" }}
                  />
                )}
                {isToday && hasEvent && (
                  <span className="size-1 rounded-full mt-0.5 bg-white" />
                )}
                {!hasEvent && <span className="size-1 mt-0.5" />}
              </div>
            );
          })}
        </div>
      )}

      {/* Today events */}
      <div className="space-y-2 pt-2 border-t border-hub-border-solid">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-hub-orange-muted">
            Hoje
          </span>
          <span className="text-[10px] text-muted-foreground">
            {todayEvents.length} evento{todayEvents.length !== 1 ? "s" : ""}
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-4 w-10 rounded" />
                <Skeleton className="h-4 flex-1 rounded" />
              </div>
            ))}
          </div>
        ) : visibleEvents.length === 0 ? (
          <div className="text-center py-3">
            <IconCalendar className="size-5 mx-auto mb-1 text-muted-foreground opacity-40" />
            <p className="text-[11px] text-muted-foreground">Nenhum evento hoje</p>
            <Link
              href="/cultura"
              className="text-[11px] font-medium mt-1 inline-block text-hub-orange"
            >
              Ver calendário RH
            </Link>
          </div>
        ) : (
          visibleEvents.map((ev) => (
            <div
              key={ev.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
            >
              <span
                className="w-0.5 h-4 rounded-full shrink-0"
                style={{ background: ev.color.text }}
              />
              <span className="text-xs flex-1 truncate text-foreground">
                {ev.title}
              </span>
              <span
                className="text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider"
                style={{ background: ev.color.bg, color: ev.color.text }}
              >
                {ev.category.replace("_", " ")}
              </span>
            </div>
          ))
        )}

        {todayEvents.length > 4 && (
          <p className="text-[10px] text-center text-muted-foreground">
            +{todayEvents.length - 4} mais
          </p>
        )}
      </div>

      <Link
        href="/cultura"
        className="w-full mt-3 text-center text-[11px] font-medium py-2 rounded-lg block text-hub-orange bg-hub-orange-glow"
      >
        Ver calendário completo
      </Link>
    </SectionCard>
  );
}
