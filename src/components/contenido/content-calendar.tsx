"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { platformLabel } from "@/lib/types/content";

type CalendarItem = {
  id: string;
  scheduled_date: string | null;
  platform: string;
  status: string;
  projects?: { name: string } | null;
};

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const PLATFORM_DOT: Record<string, string> = {
  instagram: "bg-terracotta",
  tiktok: "bg-navy",
  pinterest: "bg-gold",
};

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function ContentCalendar({ items }: { items: CalendarItem[] }) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const byDate = new Map<string, CalendarItem[]>();
  for (const item of items) {
    if (!item.scheduled_date) continue;
    const key = item.scheduled_date;
    byDate.set(key, [...(byDate.get(key) ?? []), item]);
  }

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7; // Monday-first grid
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const today = toDateKey(new Date());

  return (
    <div className="rounded-yakana border border-linen bg-offwhite p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          className="rounded-yakana p-1.5 text-navy hover:bg-linen"
        >
          <ChevronLeft size={16} />
        </button>
        <h2 className="font-heading text-lg italic text-navy">
          {MONTH_NAMES[month]} {year}
        </h2>
        <button
          type="button"
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          className="rounded-yakana p-1.5 text-navy hover:bg-linen"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium uppercase tracking-wide text-charcoal/50">
        {WEEKDAYS.map((d) => (
          <div key={d} className="pb-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={i} className="min-h-[64px] rounded-yakana" />;
          const key = toDateKey(date);
          const dayItems = byDate.get(key) ?? [];
          const isToday = key === today;
          return (
            <div
              key={i}
              className={`min-h-[64px] rounded-yakana border p-1 text-left ${
                isToday ? "border-terracotta bg-terracotta/5" : "border-linen bg-white"
              }`}
            >
              <span className={`text-[11px] ${isToday ? "font-semibold text-terracotta" : "text-charcoal/50"}`}>
                {date.getDate()}
              </span>
              <div className="mt-0.5 space-y-0.5">
                {dayItems.map((item) => (
                  <Link
                    key={item.id}
                    href={`/contenido/${item.id}`}
                    className="flex items-center gap-1 truncate rounded bg-linen/60 px-1 py-0.5 text-[10px] text-navy hover:bg-linen"
                    title={`${platformLabel(item.platform)} · ${item.projects?.name ?? ""}`}
                  >
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${PLATFORM_DOT[item.platform] ?? "bg-charcoal"}`} />
                    <span className="truncate">{item.projects?.name ?? "Sin proyecto"}</span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
