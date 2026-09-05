import { PageHeader } from "@/components/ui/page-header";
import { Field } from "@/components/ui/field";
import { createClient } from "@/lib/supabase/server";
import { createPattern } from "@/lib/actions/patterns";
import type { Project } from "@/lib/types/project";

export default async function NuevoPatronPage({
  searchParams,
}: {
  searchParams: Promise<{ project_id?: string }>;
}) {
  const { project_id: preselectedProjectId } = await searchParams;
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .order("name")
    .returns<Project[]>();

  return (
    <div>
      <PageHeader
        title="Nuevo patrón"
        description="Elegí el tamaño de la grilla — lo vas a poder ajustar después."
      />
      <form action={createPattern} className="max-w-md space-y-4">
        <Field label="Nombre *" name="name" required placeholder="Mi patrón nuevo" />
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Ancho (puntos) *"
            name="width_stitches"
            type="number"
            defaultValue={30}
            required
          />
          <Field
            label="Alto (vueltas) *"
            name="height_rows"
            type="number"
            defaultValue={30}
            required
          />
        </div>

        {projects && projects.length > 0 ? (
          <div>
            <label className="mb-1 block text-sm font-medium text-navy" htmlFor="project_id">
              Vincular a un proyecto (opcional)
            </label>
            <select
              id="project_id"
              name="project_id"
              defaultValue={preselectedProjectId ?? ""}
              className="w-full rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
            >
              <option value="">Sin vincular</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <button
          type="submit"
          className="rounded-yakana bg-terracotta px-5 py-2.5 text-sm font-medium text-offwhite transition-colors hover:bg-terracotta-dark"
        >
          Crear e ir al editor
        </button>
      </form>
    </div>
  );
}
