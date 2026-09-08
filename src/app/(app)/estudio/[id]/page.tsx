import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PatternEditor } from "@/components/estudio/pattern-editor";
import { StitchPatternEditor } from "@/components/estudio/stitch-pattern-editor";
import { deletePattern } from "@/lib/actions/patterns";
import { zoneStitchCount } from "@/lib/pattern-sync";
import { DEFAULT_PALETTE, type Pattern, type PaletteColor } from "@/lib/types/pattern";

export default async function PatternEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: pattern }, { data: globalPalettes }] = await Promise.all([
    supabase.from("patterns").select("*, palettes(*)").eq("id", id).single<Pattern>(),
    supabase
      .from("palettes")
      .select("id, name, colors")
      .eq("is_global", true)
      .order("name")
      .returns<{ id: string; name: string; colors: PaletteColor[] }[]>(),
  ]);

  if (!pattern) notFound();

  const initialColors = pattern.palettes?.colors ?? DEFAULT_PALETTE;

  let suggestedRepeatWidth: number | null = null;
  if (pattern.project_id && pattern.garment_zone) {
    const { data: calc } = await supabase
      .from("raglan_calculations")
      .select("results")
      .eq("project_id", pattern.project_id)
      .eq("is_miniature", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ results: Record<string, number> }>();
    if (calc?.results) {
      suggestedRepeatWidth = zoneStitchCount(pattern.garment_zone, calc.results);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl italic text-navy sm:text-3xl">
            {pattern.name}
          </h1>
          <p className="text-xs text-charcoal/60">
            {pattern.width_stitches} × {pattern.height_rows} puntos
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/estudio"
            className="rounded-yakana border border-linen bg-offwhite px-3 py-1.5 text-xs font-medium text-navy hover:bg-linen"
          >
            Volver
          </Link>
          <form action={deletePattern}>
            <input type="hidden" name="id" value={pattern.id} />
            <button
              type="submit"
              className="rounded-yakana border border-terracotta/40 px-3 py-1.5 text-xs font-medium text-terracotta hover:bg-terracotta/10"
            >
              Eliminar
            </button>
          </form>
        </div>
      </div>

      {pattern.display_mode === "stitch" ? (
        <StitchPatternEditor pattern={pattern} />
      ) : (
        <PatternEditor
          pattern={pattern}
          initialColors={initialColors}
          globalPalettes={globalPalettes ?? []}
          suggestedRepeatWidth={suggestedRepeatWidth}
        />
      )}
    </div>
  );
}
