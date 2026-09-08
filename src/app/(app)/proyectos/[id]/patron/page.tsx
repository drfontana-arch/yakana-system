import Link from "next/link";
import { Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PatternThumbnail } from "@/components/estudio/pattern-thumbnail";
import {
  GarmentSketch,
  type GarmentZone,
  type ZoneFill,
} from "@/components/calculadora/garment-sketch";
import { ZoneSelect } from "@/components/proyectos/zone-select";
import {
  linkPatternToProject,
  unlinkPatternFromProject,
  restorePatternVersion,
} from "@/lib/actions/patterns";
import { DEFAULT_PALETTE, type Pattern, type PatternVersion } from "@/lib/types/pattern";

type SavedMeasurements = {
  chestCm: number;
  bodyLengthCm: number;
  yokeDepthCm: number;
  neckCm: number;
  sleeveLengthCm: number;
  sleeveCircumferenceCm: number;
  cuffCircumferenceCm: number;
  neckStyle?: string;
  bodyFit?: string;
  closureType?: string;
};

export default async function ProjectPatronPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: linkedPatterns }, { data: unlinkedPatterns }, { data: raglanCalc }] =
    await Promise.all([
      supabase
        .from("patterns")
        .select("*, palettes(*)")
        .eq("project_id", id)
        .order("updated_at", { ascending: false })
        .returns<Pattern[]>(),
      supabase
        .from("patterns")
        .select("id, name")
        .is("project_id", null)
        .returns<Pick<Pattern, "id" | "name">[]>(),
      supabase
        .from("raglan_calculations")
        .select("measurements")
        .eq("project_id", id)
        .eq("is_miniature", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<{ measurements: SavedMeasurements }>(),
    ]);

  const linkPatternWithId = linkPatternToProject.bind(null, id);
  const measurements = raglanCalc?.measurements ?? null;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link
          href={`/proyectos/${id}/patron-completo`}
          className="rounded-yakana bg-navy px-4 py-2 text-sm font-medium text-offwhite hover:opacity-90"
        >
          Ver patrón completo
        </Link>
      </div>

      {!measurements ? (
        <div className="rounded-yakana border border-dashed border-linen bg-offwhite p-4 text-sm text-charcoal/60">
          Todavía no guardaste un cálculo de este proyecto desde la{" "}
          <Link href="/calculadora" className="font-medium text-terracotta">
            Calculadora
          </Link>{" "}
          — cuando lo hagas, vas a ver acá el boceto de la prenda a proporción real.
        </div>
      ) : null}

      {!linkedPatterns || linkedPatterns.length === 0 ? (
        <p className="text-sm text-charcoal/60">
          Todavía no hay ningún patrón vinculado a este proyecto.
        </p>
      ) : (
        <div className="space-y-4">
          {linkedPatterns.map((pattern) => (
            <PatternCard
              key={pattern.id}
              pattern={pattern}
              projectId={id}
              measurements={measurements}
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 rounded-yakana border border-dashed border-linen bg-offwhite p-4">
        <Link
          href={`/estudio/nuevo?project_id=${id}`}
          className="rounded-yakana bg-terracotta px-4 py-2 text-sm font-medium text-offwhite hover:bg-terracotta-dark"
        >
          Crear patrón nuevo para este proyecto
        </Link>

        {unlinkedPatterns && unlinkedPatterns.length > 0 ? (
          <form action={linkPatternWithId} className="flex items-center gap-2">
            <select
              name="pattern_id"
              required
              defaultValue=""
              className="rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
            >
              <option value="" disabled>
                Elegí un patrón existente
              </option>
              {unlinkedPatterns.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-yakana border border-linen bg-white px-4 py-2 text-sm font-medium text-navy hover:bg-linen"
            >
              Vincular
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}

async function PatternCard({
  pattern,
  projectId,
  measurements,
}: {
  pattern: Pattern;
  projectId: string;
  measurements: SavedMeasurements | null;
}) {
  const supabase = await createClient();
  const { data: versions } = await supabase
    .from("pattern_versions")
    .select("*")
    .eq("pattern_id", pattern.id)
    .order("created_at", { ascending: false })
    .returns<PatternVersion[]>();

  const colors = pattern.palettes?.colors ?? DEFAULT_PALETTE;

  return (
    <div className="rounded-yakana border border-linen bg-offwhite p-4">
      <div className="flex flex-wrap items-start gap-4">
        <PatternThumbnail
          gridData={pattern.grid_data}
          width={pattern.width_stitches}
          height={pattern.height_rows}
          backgroundHex={colors[0]?.hex ?? "#faf7f2"}
          mode={pattern.display_mode}
        />
        <div className="min-w-0 flex-1">
          <p className="font-heading text-lg italic text-navy">{pattern.name}</p>
          <p className="text-xs text-charcoal/60">
            {pattern.width_stitches} × {pattern.height_rows} puntos
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Link
              href={`/estudio/${pattern.id}`}
              className="flex items-center gap-1 text-xs font-medium text-terracotta hover:underline"
            >
              <Pencil size={12} />
              Abrir en el editor
            </Link>
            <form action={unlinkPatternFromProject}>
              <input type="hidden" name="project_id" value={projectId} />
              <input type="hidden" name="pattern_id" value={pattern.id} />
              <button type="submit" className="text-xs text-charcoal/50 hover:underline">
                Desvincular
              </button>
            </form>
          </div>

          <div className="mt-3">
            <ZoneSelect
              key={pattern.garment_zone}
              projectId={projectId}
              patternId={pattern.id}
              zone={pattern.garment_zone}
            />
          </div>
        </div>

        {measurements && pattern.garment_zone ? (
          <div className="w-full shrink-0 sm:w-56">
            <GarmentSketch
              {...measurements}
              highlightZone={pattern.garment_zone as GarmentZone}
              zoneFills={
                pattern.display_mode === "stitch"
                  ? undefined
                  : {
                      [pattern.garment_zone as GarmentZone]: {
                        gridData: pattern.grid_data,
                        colors: pattern.palettes?.colors ?? DEFAULT_PALETTE,
                        widthStitches: pattern.width_stitches,
                        heightRows: pattern.height_rows,
                      } as ZoneFill,
                    }
              }
            />
          </div>
        ) : null}
      </div>

      {versions && versions.length > 0 ? (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-medium text-navy">
            Historial de versiones ({versions.length})
          </summary>
          <div className="mt-2 space-y-1.5">
            {versions.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between gap-2 rounded-yakana bg-white px-3 py-1.5 text-xs"
              >
                <span className="text-charcoal/70">
                  {v.version_label || "Sin nombre"} —{" "}
                  {new Date(v.created_at).toLocaleString("es-AR")}
                </span>
                <form action={restorePatternVersion}>
                  <input type="hidden" name="project_id" value={projectId} />
                  <input type="hidden" name="pattern_id" value={pattern.id} />
                  <input type="hidden" name="version_id" value={v.id} />
                  <button
                    type="submit"
                    className="font-medium text-terracotta hover:underline"
                  >
                    Restaurar
                  </button>
                </form>
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}
