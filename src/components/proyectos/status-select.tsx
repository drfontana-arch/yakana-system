"use client";

import { useTransition } from "react";
import { updateProjectStatus } from "@/lib/actions/projects";
import { PROJECT_STATUSES } from "@/lib/types/project";

export function StatusSelect({ projectId, status }: { projectId: string; status: string }) {
  const [isPending, startTransition] = useTransition();
  const updateWithId = updateProjectStatus.bind(null, projectId);

  return (
    <form
      action={(formData) => startTransition(() => updateWithId(formData))}
      className="inline-block"
    >
      <select
        name="status"
        defaultValue={status}
        disabled={isPending}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-full border border-linen bg-white px-3 py-1 text-xs font-medium text-navy outline-none focus:border-terracotta disabled:opacity-60"
      >
        {PROJECT_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </form>
  );
}
