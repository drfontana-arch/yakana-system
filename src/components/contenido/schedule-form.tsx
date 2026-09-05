"use client";

import { useTransition } from "react";
import { updateContentSchedule } from "@/lib/actions/content";
import { CONTENT_STATUSES } from "@/lib/types/content";

export function ScheduleForm({
  contentId,
  status,
  scheduledDate,
}: {
  contentId: string;
  status: string;
  scheduledDate: string | null;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => startTransition(() => updateContentSchedule(formData))}
      className="flex flex-wrap items-center gap-2"
    >
      <input type="hidden" name="id" value={contentId} />
      <select
        name="status"
        defaultValue={status}
        disabled={isPending}
        className="rounded-yakana border border-linen bg-white px-2 py-1.5 text-xs outline-none focus:border-terracotta disabled:opacity-60"
      >
        {CONTENT_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <input
        type="date"
        name="scheduled_date"
        defaultValue={scheduledDate ?? ""}
        disabled={isPending}
        className="rounded-yakana border border-linen bg-white px-2 py-1.5 text-xs outline-none focus:border-terracotta disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-yakana border border-linen bg-white px-3 py-1.5 text-xs font-medium text-navy hover:bg-linen disabled:opacity-60"
      >
        {isPending ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
