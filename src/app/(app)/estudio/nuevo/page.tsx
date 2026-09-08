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

        <fieldset>
          <legend className="mb-1 block text-sm font-medium text-navy">Tipo de diagrama</legend>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex cursor-pointer items-start gap-2 rounded-yakana border border-linen bg-white p-3 text-sm has-[:checked]:border-terracotta has-[:checked]:bg-terracotta/5">
              <input type="radio" name="display_mode" value="color" defaultChecked className="mt-1" />
              <span>
                <span className="block font-medium text-navy">Diagrama de colores</span>
                <span className="block text-xs text-charcoal/60">
                  Pintás una grilla con colores — para jacquard, intarsia, guardas.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2 rounded-yakana border border-linen bg-white p-3 text-sm has-[:checked]:border-terracotta has-[:checked]:bg-terracotta/5">
              <input type="radio" name="display_mode" value="stitch" className="mt-1" />
              <span>
                <span className="block font-medium text-navy">Diagrama de puntos</span>
                <span className="block text-xs text-charcoal/60">
                  Marcás símbolos de tejido (derecho, revés, ojal, disminución) y se arma solo el
                  paso a paso escrito.
                </span>
              </span>
            </label>
          </div>
        </fieldset>

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
