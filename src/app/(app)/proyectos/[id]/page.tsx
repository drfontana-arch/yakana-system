import Link from "next/link";
import { Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { addProjectYarn, removeProjectYarn } from "@/lib/actions/project-yarns";
import { CONSTRUCTION_DIRECTIONS, type Project, type ProjectYarn } from "@/lib/types/project";
import type { Yarn } from "@/lib/types/yarn";

export default async function ProjectResumenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: project }, { data: projectYarns }, { data: allYarns }] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).single<Project>(),
    supabase
      .from("project_yarns")
      .select("*, yarns(*)")
      .eq("project_id", id)
      .returns<ProjectYarn[]>(),
    supabase.from("yarns").select("*").order("name").returns<Yarn[]>(),
  ]);

  if (!project) return null;

  const directionLabel = CONSTRUCTION_DIRECTIONS.find(
    (d) => d.value === project.construction_direction,
  )?.label;

  const linkedYarnIds = new Set((projectYarns ?? []).map((py) => py.yarn_id));
  const availableYarns = (allYarns ?? []).filter((y) => !linkedYarnIds.has(y.id));
  const addProjectYarnWithId = addProjectYarn.bind(null, id);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link
          href={`/proyectos/${id}/editar`}
          className="flex items-center gap-2 rounded-yakana border border-linen bg-offwhite px-4 py-2 text-sm font-medium text-navy hover:bg-linen"
        >
          <Pencil size={16} />
          Editar datos
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryStat
          label="Muestra"
          value={
            project.gauge_stitches_per_10cm && project.gauge_rows_per_10cm
              ? `${project.gauge_stitches_per_10cm} p × ${project.gauge_rows_per_10cm} v`
              : "—"
          }
        />
        <SummaryStat
          label="Aguja"
          value={project.needle_size_mm ? `${project.needle_size_mm} mm` : "—"}
        />
        <SummaryStat label="Construcción" value={directionLabel ?? "—"} />
        <SummaryStat
          label="Tarifa horaria"
          value={project.hourly_rate ? `$${project.hourly_rate}/h` : "—"}
        />
      </div>

      {project.notes ? (
        <div className="rounded-yakana border border-linen bg-offwhite p-4">
          <p className="mb-1 text-sm font-medium text-navy">Notas generales</p>
          <p className="whitespace-pre-wrap text-sm text-charcoal/80">{project.notes}</p>
        </div>
      ) : null}

      <div>
        <h2 className="mb-3 font-heading text-xl italic text-navy">Lanas usadas</h2>

        {projectYarns && projectYarns.length > 0 ? (
          <div className="space-y-2">
            {projectYarns.map((py) => (
              <div
                key={py.id}
                className="flex items-center gap-3 rounded-yakana border border-linen bg-offwhite p-3"
              >
                <div
                  className="h-10 w-10 shrink-0 rounded-yakana border border-linen"
                  style={{ backgroundColor: py.yarns?.color_hex ?? "#e8e0d0" }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-navy">
                    {py.yarns?.name ?? "Lana eliminada"}
                    {py.color_role ? (
                      <span className="ml-2 text-xs text-charcoal/60">({py.color_role})</span>
                    ) : null}
                  </p>
                  <p className="text-xs text-charcoal/60">
                    {py.estimated_meters != null ? `Est: ${py.estimated_meters} m` : ""}
                    {py.actual_meters_used != null ? ` · Usado: ${py.actual_meters_used} m` : ""}
                  </p>
                </div>
                <form action={removeProjectYarn}>
                  <input type="hidden" name="project_id" value={id} />
                  <input type="hidden" name="id" value={py.id} />
                  <button
                    type="submit"
                    className="text-xs font-medium text-terracotta hover:underline"
                  >
                    Quitar
                  </button>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-charcoal/60">Todavía no vinculaste ninguna lana.</p>
        )}

        {availableYarns.length > 0 ? (
          <form
            action={addProjectYarnWithId}
            className="mt-4 flex flex-wrap items-end gap-3 rounded-yakana border border-dashed border-linen bg-offwhite p-4"
          >
            <div>
              <label className="mb-1 block text-xs font-medium text-navy" htmlFor="yarn_id">
                Lana
              </label>
              <select
                id="yarn_id"
                name="yarn_id"
                required
                className="rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
              >
                {availableYarns.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-navy" htmlFor="color_role">
                Rol
              </label>
              <input
                id="color_role"
                name="color_role"
                placeholder="principal, contraste 1..."
                className="rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
              />
            </div>
            <div>
              <label
                className="mb-1 block text-xs font-medium text-navy"
                htmlFor="estimated_meters"
              >
                Metros estimados
              </label>
              <input
                id="estimated_meters"
                name="estimated_meters"
                type="number"
                step="0.01"
                className="w-32 rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
              />
            </div>
            <button
              type="submit"
              className="rounded-yakana bg-terracotta px-4 py-2 text-sm font-medium text-offwhite hover:bg-terracotta-dark"
            >
              Vincular
            </button>
          </form>
        ) : allYarns && allYarns.length === 0 ? (
          <p className="mt-3 text-sm text-charcoal/60">
            Todavía no tenés lanas cargadas en{" "}
            <Link href="/inventario" className="font-medium text-terracotta">
              Inventario
            </Link>
            .
          </p>
        ) : null}
      </div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-yakana border border-linen bg-offwhite p-4">
      <p className="text-xs uppercase tracking-wide text-charcoal/60">{label}</p>
      <p className="mt-1 font-heading text-xl text-navy">{value}</p>
    </div>
  );
}
