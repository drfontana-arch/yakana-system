"use client";

import { Field } from "@/components/ui/field";
import {
  CONSTRUCTION_DIRECTIONS,
  PROJECT_STATUSES,
  PROJECT_TYPES,
  type Project,
} from "@/lib/types/project";

export function ProjectForm({
  project,
  action,
  errorMessage,
  defaultHourlyRate,
}: {
  project?: Project;
  action: (formData: FormData) => void;
  errorMessage?: string;
  defaultHourlyRate?: number | null;
}) {
  return (
    <form action={action} className="max-w-3xl space-y-6">
      {errorMessage ? (
        <p className="rounded-yakana border border-terracotta/30 bg-terracotta/10 px-3 py-2 text-sm text-terracotta">
          {errorMessage}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre *" name="name" defaultValue={project?.name} required />

        <div>
          <label className="mb-1 block text-sm font-medium text-navy" htmlFor="type">
            Tipo
          </label>
          <select
            id="type"
            name="type"
            defaultValue={project?.type ?? ""}
            className="w-full rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
          >
            <option value="">Sin especificar</option>
            {PROJECT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-navy" htmlFor="status">
            Estado
          </label>
          <select
            id="status"
            name="status"
            defaultValue={project?.status ?? "idea"}
            className="w-full rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
          >
            {PROJECT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            className="mb-1 block text-sm font-medium text-navy"
            htmlFor="construction_direction"
          >
            Dirección de construcción
          </label>
          <select
            id="construction_direction"
            name="construction_direction"
            defaultValue={project?.construction_direction ?? ""}
            className="w-full rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
          >
            <option value="">Sin especificar</option>
            {CONSTRUCTION_DIRECTIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <Field label="Talla" name="size_label" defaultValue={project?.size_label ?? ""} />
        <Field
          label="Destinatario/a"
          name="recipient"
          defaultValue={project?.recipient ?? ""}
        />

        <Field
          label="Puntos cada 10 cm"
          name="gauge_stitches_per_10cm"
          type="number"
          step="0.1"
          defaultValue={project?.gauge_stitches_per_10cm ?? ""}
        />
        <Field
          label="Vueltas cada 10 cm"
          name="gauge_rows_per_10cm"
          type="number"
          step="0.1"
          defaultValue={project?.gauge_rows_per_10cm ?? ""}
        />
        <Field
          label="Aguja (mm)"
          name="needle_size_mm"
          type="number"
          step="0.25"
          defaultValue={project?.needle_size_mm ?? ""}
        />
        <Field
          label="Tarifa horaria ($)"
          name="hourly_rate"
          type="number"
          step="0.01"
          defaultValue={project?.hourly_rate ?? defaultHourlyRate ?? ""}
        />
        <Field
          label="Fecha de inicio"
          name="start_date"
          type="date"
          defaultValue={project?.start_date ?? ""}
        />
        <Field
          label="Fecha de finalización"
          name="completion_date"
          type="date"
          defaultValue={project?.completion_date ?? ""}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-navy" htmlFor="notes">
          Notas generales
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={project?.notes ?? ""}
          className="w-full rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
        />
      </div>

      <button
        type="submit"
        className="rounded-yakana bg-terracotta px-5 py-2.5 text-sm font-medium text-offwhite transition-colors hover:bg-terracotta-dark"
      >
        {project ? "Guardar cambios" : "Crear proyecto"}
      </button>
    </form>
  );
}
