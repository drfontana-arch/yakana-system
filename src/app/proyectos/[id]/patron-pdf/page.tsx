import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Palette } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DownloadPdfButton } from "@/components/proyectos/download-pdf-button";
import { GarmentSketch } from "@/components/calculadora/garment-sketch";
import { ColorChartDisplay } from "@/components/estudio/color-chart-display";
import { StitchChartDisplay, StitchChartLegend } from "@/components/estudio/stitch-chart-display";
import {
  GARMENT_ZONE_LABELS,
  type GarmentZone,
  type ZoneFill,
} from "@/components/calculadora/garment-sketch";
import {
  isChartableZone,
  computeZoneSync,
  syncGuidanceText,
  buildAnnotatedInstructions,
} from "@/lib/pattern-sync";
import { buildStitchRowInstructions } from "@/lib/stitch-chart";
import { CONSTRUCTION_DIRECTIONS, PROJECT_TYPES } from "@/lib/types/project";
import { DEFAULT_PALETTE, type Pattern } from "@/lib/types/pattern";
import type { Project, ProjectYarn } from "@/lib/types/project";

type SavedCalc = {
  size_label: string | null;
  measurements: Record<string, number | string>;
  results: Record<string, number>;
  row_by_row_instructions: string[] | null;
};

export default async function PatronPdfPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: project }, { data: projectYarns }, { data: calc }, { data: patterns }, { data: profile }] =
    await Promise.all([
      supabase.from("projects").select("*").eq("id", id).single<Project>(),
      supabase
        .from("project_yarns")
        .select("*, yarns(*)")
        .eq("project_id", id)
        .returns<ProjectYarn[]>(),
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
            .select("name, brand_name")
            .eq("id", user.id)
            .single<{ name: string | null; brand_name: string | null }>()
        : Promise.resolve({ data: null }),
    ]);

  if (!project) notFound();

  const brandName = profile?.brand_name || "Yakana";
  const typeLabel = PROJECT_TYPES.find((t) => t.value === project.type)?.label;
  const directionLabel = CONSTRUCTION_DIRECTIONS.find(
    (d) => d.value === project.construction_direction,
  )?.label;
  const m = calc?.measurements;

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

  const zoneFills: Partial<Record<GarmentZone, ZoneFill>> = {};
  for (const pattern of patterns ?? []) {
    const zone = pattern.garment_zone as GarmentZone | null;
    if (!zone || pattern.display_mode === "stitch") continue;
    zoneFills[zone] = {
      gridData: pattern.grid_data,
      colors: pattern.palettes?.colors ?? DEFAULT_PALETTE,
      widthStitches: pattern.width_stitches,
      heightRows: pattern.height_rows,
    };
  }

  const subtitle = [typeLabel, project.size_label ?? calc?.size_label, project.recipient]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mx-auto max-w-3xl bg-cream px-4 py-8 print:max-w-none print:bg-white print:p-0">
      <style>{`
        @page { size: A4; margin: 1.6cm; }
        @media print {
          html, body { background: white; }
        }
      `}</style>

      <div className="print:hidden mb-6 flex items-center justify-between">
        <Link
          href={`/proyectos/${id}/patron-completo`}
          className="text-xs font-medium text-terracotta hover:underline"
        >
          ← Volver a Patrón completo
        </Link>
        <DownloadPdfButton />
      </div>

      {/* Portada */}
      <section className="flex min-h-[24rem] flex-col items-center justify-center break-after-page rounded-yakana border border-linen bg-offwhite p-10 text-center print:min-h-[24cm] print:rounded-none print:border-none">
        <Image
          src="/brand/yakana-logo.png"
          alt={brandName}
          width={88}
          height={88}
          className="mb-4 rounded-full"
        />
        <p className="text-xs uppercase tracking-widest text-terracotta">
          {brandName} — Tejido Artesanal
        </p>
        <h1 className="mt-4 font-heading text-4xl italic text-navy">{project.name}</h1>
        {subtitle ? <p className="mt-2 text-sm text-charcoal/60">{subtitle}</p> : null}
        {profile?.name ? (
          <p className="mt-10 text-xs text-charcoal/50">Diseño de {profile.name}</p>
        ) : null}
      </section>

      <div className="mt-8 rounded-yakana border border-linen bg-offwhite p-8 print:mt-0 print:rounded-none print:border-none print:p-0">
        <section className="mb-6 break-inside-avoid">
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
          <section className="mb-6 break-inside-avoid">
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
          </section>
        ) : null}

        {projectYarns && projectYarns.length > 0 ? (
          <section className="mb-6 break-inside-avoid">
            <h2 className="mb-2 font-heading text-lg italic text-navy">Materiales</h2>
            <ul className="list-inside list-disc text-sm text-charcoal/80">
              {projectYarns.map((py) => {
                const quantity = py.actual_skeins_used ?? py.estimated_skeins ?? 0;
                return (
                  <li key={py.id}>
                    {py.yarns?.name ?? "Lana"} — {quantity} madeja{quantity === 1 ? "" : "s"}
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        <section className="mb-6 break-inside-avoid">
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
            <p className="text-sm text-charcoal/60">Este proyecto todavía no tiene instrucciones guardadas.</p>
          )}
        </section>

        {patterns && patterns.length > 0 ? (
          <section>
            <h2 className="mb-3 flex items-center gap-2 font-heading text-lg italic text-navy">
              <Palette size={18} />
              Diagramas
            </h2>
            <div className="space-y-6">
              {patterns.map((pattern) => {
                const colors = pattern.palettes?.colors ?? DEFAULT_PALETTE;
                const zone = pattern.garment_zone;
                const zoneLabel = zone ? GARMENT_ZONE_LABELS[zone as GarmentZone] : null;
                const sync = syncByPatternId[pattern.id];
                const isStitch = pattern.display_mode === "stitch";
                return (
                  <div
                    key={pattern.id}
                    className="break-inside-avoid rounded-yakana border border-linen bg-white p-3"
                  >
                    <p className="text-sm font-medium text-navy">{pattern.name}</p>
                    <p className="mb-2 text-xs text-charcoal/60">
                      Usar en: {zoneLabel ?? "sin zona definida"} · {pattern.width_stitches} ×{" "}
                      {pattern.height_rows} puntos ·{" "}
                      {isStitch ? "Diagrama de puntos" : "Diagrama de colores"}
                    </p>

                    <div className="overflow-x-auto">
                      {isStitch ? (
                        <StitchChartDisplay
                          gridData={pattern.grid_data}
                          width={pattern.width_stitches}
                          height={pattern.height_rows}
                        />
                      ) : (
                        <ColorChartDisplay
                          gridData={pattern.grid_data}
                          width={pattern.width_stitches}
                          height={pattern.height_rows}
                          backgroundHex={colors[0]?.hex ?? "#faf7f2"}
                        />
                      )}
                    </div>

                    {isStitch ? (
                      <div className="mt-3 space-y-2">
                        <StitchChartLegend gridData={pattern.grid_data} />
                        <ol className="mt-2 list-inside list-decimal space-y-1 text-xs text-charcoal/80">
                          {buildStitchRowInstructions(
                            pattern.grid_data,
                            pattern.width_stitches,
                            pattern.height_rows,
                          ).map((line, i) => (
                            <li key={i}>{line}</li>
                          ))}
                        </ol>
                      </div>
                    ) : sync ? (
                      <p className="mt-2 text-xs text-olive">{syncGuidanceText(sync, pattern.name)}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
