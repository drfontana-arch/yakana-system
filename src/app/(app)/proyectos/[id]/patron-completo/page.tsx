import Link from "next/link";
import { notFound } from "next/navigation";
import { Palette } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { GarmentSketch } from "@/components/calculadora/garment-sketch";
import { PatternThumbnail } from "@/components/estudio/pattern-thumbnail";
import {
  GARMENT_ZONE_LABELS,
  type GarmentZone,
  type ZoneFill,
} from "@/components/calculadora/garment-sketch";
import { computeProjectCost } from "@/lib/project-cost";
import { money, formatMinutes } from "@/lib/format";
import {
  isChartableZone,
  computeZoneSync,
  syncGuidanceText,
  buildAnnotatedInstructions,
} from "@/lib/pattern-sync";
import { CONSTRUCTION_DIRECTIONS, PROJECT_TYPES } from "@/lib/types/project";
import { DEFAULT_PALETTE, type Pattern } from "@/lib/types/pattern";
import type { Project, ProjectYarn, WorkSession } from "@/lib/types/project";

type SavedCalc = {
  size_label: string | null;
  measurements: Record<string, number | string>;
  results: Record<string, number>;
  row_by_row_instructions: string[] | null;
};

export default async function PatronCompletoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: project },
    { data: projectYarns },
    { data: sessions },
    { data: calc },
    { data: patterns },
    { data: profile },
  ] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).single<Project>(),
    supabase.from("project_yarns").select("*, yarns(*)").eq("project_id", id).returns<ProjectYarn[]>(),
    supabase.from("work_sessions").select("*").eq("project_id", id).returns<WorkSession[]>(),
    supabase
      .from("raglan_calculations")
      .select("size_label, measurements, results, row_by_row_instructions")
      .eq("project_id", id)
      .eq("is_miniature", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<SavedCalc>(),
    supabase
      .from("patterns")
      .select("*, palettes(*)")
      .eq("project_id", id)
      .not("garment_zone", "is", null)
      .returns<Pattern[]>(),
    user
      ? supabase
          .from("user_profiles")
          .select("markup_factor")
          .eq("id", user.id)
          .single<{ markup_factor: number | null }>()
      : Promise.resolve({ data: null }),
  ]);

  if (!project) notFound();

  const cost = computeProjectCost(
    projectYarns ?? [],
    sessions ?? [],
    project.hourly_rate ?? 0,
    profile?.markup_factor ?? 3.0,
  );

  const typeLabel = PROJECT_TYPES.find((t) => t.value === project.type)?.label;
  const directionLabel = CONSTRUCTION_DIRECTIONS.find(
    (d) => d.value === project.construction_direction,
  )?.label;
  const m = calc?.measurements;

  // Work out, per zone, exactly which fila of each linked chart to start on
  // and how many times it repeats across that zone's actual row count.
  const syncByPatternId: Record<string, ReturnType<typeof computeZoneSync>> = {};
  const calloutsByZone: Record<string, string[]> = {};
  for (const pattern of patterns ?? []) {
    const zone = pattern.garment_zone;
    if (!zone || !calc?.results || !isChartableZone(zone)) continue;
    const sync = computeZoneSync(zone, calc.results, pattern.height_rows);
    if (!sync) continue;
    syncByPatternId[pattern.id] = sync;
    const text = `🎨 ${syncGuidanceText(sync, pattern.name)}`;
    calloutsByZone[zone] = [...(calloutsByZone[zone] ?? []), text];
  }

  const annotatedInstructions = calc?.row_by_row_instructions
    ? buildAnnotatedInstructions(calc.row_by_row_instructions, calloutsByZone)
    : [];

  // Feed each linked chart's real colors into the sketch, so the "Boceto de
  // la prenda" shows the actual colorwork tiled into its zone instead of a
  // flat highlight — the combined preview Enzo asked for.
  const zoneFills: Partial<Record<GarmentZone, ZoneFill>> = {};
  for (const pattern of patterns ?? []) {
    const zone = pattern.garment_zone as GarmentZone | null;
    if (!zone) continue;
    zoneFills[zone] = {
      gridData: pattern.grid_data,
      colors: pattern.palettes?.colors ?? DEFAULT_PALETTE,
      widthStitches: pattern.width_stitches,
      heightRows: pattern.height_rows,
    };
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href={`/proyectos/${id}/patron`}
          className="text-xs font-medium text-terracotta hover:underline"
        >
          ← Volver a Patrón
        </Link>
        <p className="text-xs text-charcoal/50">
          Podés imprimir esta página (Ctrl/Cmd + P) para tejer con papel.
        </p>
      </div>

      <div className="rounded-yakana border border-linen bg-offwhite p-8">
        <header className="mb-6 border-b border-linen pb-6 text-center">
          <p className="text-xs uppercase tracking-widest text-terracotta">Yakana — Tejido Artesanal</p>
          <h1 className="mt-1 font-heading text-3xl italic text-navy">{project.name}</h1>
          <p className="mt-1 text-sm text-charcoal/60">
            {[typeLabel, project.size_label ?? calc?.size_label, project.recipient]
              .filter(Boolean)
              .join(" · ") || "Sin detalles todavía"}
          </p>
        </header>

        <section className="mb-6">
          <h2 className="mb-2 font-heading text-lg italic text-navy">Ficha técnica</h2>
          <div className="grid grid-cols-2 gap-2 text-sm text-charcoal/80 sm:grid-cols-3">
            <p>
              <span className="text-charcoal/50">Muestra:</span>{" "}
              {project.gauge_stitches_per_10cm && project.gauge_rows_per_10cm
                ? `${project.gauge_stitches_per_10cm} p × ${project.gauge_rows_per_10cm} v`
                : "—"}
            </p>
            <p>
              <span className="text-charcoal/50">Aguja:</span>{" "}
              {project.needle_size_mm ? `${project.needle_size_mm} mm` : "—"}
            </p>
            <p>
              <span className="text-charcoal/50">Construcción:</span> {directionLabel ?? "—"}
            </p>
          </div>
        </section>

        {m ? (
          <section className="mb-6">
            <h2 className="mb-3 font-heading text-lg italic text-navy">Boceto de la prenda</h2>
            <div className="flex justify-center">
              <GarmentSketch
                chestCm={Number(m.chestCm)}
                bodyLengthCm={Number(m.bodyLengthCm)}
                yokeDepthCm={Number(m.yokeDepthCm)}
                neckCm={Number(m.neckCm)}
                sleeveLengthCm={Number(m.sleeveLengthCm)}
                sleeveCircumferenceCm={Number(m.sleeveCircumferenceCm)}
                cuffCircumferenceCm={Number(m.cuffCircumferenceCm)}
                neckStyle={m.neckStyle as string | undefined}
                bodyFit={m.bodyFit as string | undefined}
                closureType={m.closureType as string | undefined}
                zoneFills={zoneFills}
              />
            </div>
            {Object.keys(zoneFills).length > 0 ? (
              <p className="mt-2 text-center text-xs text-charcoal/50">
                Las zonas con gráfico vinculado muestran sus colores reales, repetidos a modo de
                vista previa aproximada — no está tejido a la escala exacta de tu muestra.
              </p>
            ) : null}
          </section>
        ) : (
          <p className="mb-6 rounded-yakana border border-dashed border-linen p-4 text-center text-sm text-charcoal/60">
            Todavía no guardaste un cálculo de este proyecto desde la{" "}
            <Link href="/calculadora" className="font-medium text-terracotta">
              Calculadora
            </Link>
            .
          </p>
        )}

        <section className="mb-6">
          <h2 className="mb-2 font-heading text-lg italic text-navy">Materiales</h2>
          {cost.materialLines.length === 0 ? (
            <p className="text-sm text-charcoal/60">Todavía no vinculaste ninguna lana.</p>
          ) : (
            <ul className="list-inside list-disc text-sm text-charcoal/80">
              {cost.materialLines.map((line, i) => (
                <li key={i}>
                  {line.name} — {line.quantity} madeja{line.quantity === 1 ? "" : "s"}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mb-6">
          <h2 className="mb-2 font-heading text-lg italic text-navy">
            Instrucciones vuelta por vuelta
          </h2>
          {annotatedInstructions.length > 0 ? (
            <ol className="list-inside list-decimal space-y-2 text-sm text-charcoal/80">
              {annotatedInstructions.map((item, i) => (
                <li key={i}>
                  {item.text}
                  {item.callouts.map((callout, j) => (
                    <div
                      key={j}
                      className="mt-1.5 ml-1 rounded-yakana border border-olive/30 bg-olive/10 px-3 py-2 text-xs text-olive"
                    >
                      {callout}
                    </div>
                  ))}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-charcoal/60">
              Todavía no guardaste un cálculo con instrucciones desde la Calculadora.
            </p>
          )}
        </section>

        {patterns && patterns.length > 0 ? (
          <section className="mb-6">
            <h2 className="mb-3 flex items-center gap-2 font-heading text-lg italic text-navy">
              <Palette size={18} />
              Gráficos de color
            </h2>
            <div className="space-y-4">
              {patterns.map((pattern) => {
                const colors = pattern.palettes?.colors ?? DEFAULT_PALETTE;
                const zone = pattern.garment_zone;
                const zoneLabel = zone ? GARMENT_ZONE_LABELS[zone as GarmentZone] : null;
                const sync = syncByPatternId[pattern.id];
                return (
                  <div key={pattern.id} className="flex items-start gap-4">
                    <PatternThumbnail
                      gridData={pattern.grid_data}
                      width={pattern.width_stitches}
                      height={pattern.height_rows}
                      backgroundHex={colors[0]?.hex ?? "#faf7f2"}
                      size={120}
                    />
                    <div>
                      <p className="text-sm font-medium text-navy">{pattern.name}</p>
                      <p className="text-xs text-charcoal/60">
                        Usar en: {zoneLabel ?? "sin zona definida"} · {pattern.width_stitches} ×{" "}
                        {pattern.height_rows} puntos
                      </p>
                      {sync ? (
                        <p className="mt-1 text-xs text-olive">{syncGuidanceText(sync, pattern.name)}</p>
                      ) : zone && !isChartableZone(zone) ? (
                        <p className="mt-1 text-xs text-charcoal/50">
                          Esta zona no tiene un tramo de vueltas propio para sincronizar
                          automáticamente.
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        <section>
          <h2 className="mb-2 font-heading text-lg italic text-navy">Costos</h2>
          <div className="text-sm text-charcoal/80">
            <div className="flex justify-between">
              <span>Materiales</span>
              <span>${money(cost.materialsTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Mano de obra ({formatMinutes(cost.totalMinutes)})</span>
              <span>${money(cost.laborTotal)}</span>
            </div>
            <div className="mt-1 flex justify-between border-t border-linen pt-1 font-medium text-navy">
              <span>Costo total</span>
              <span>${money(cost.totalCost)}</span>
            </div>
            <div className="flex justify-between font-medium text-navy">
              <span>Precio sugerido</span>
              <span>${money(cost.suggestedPrice)}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
