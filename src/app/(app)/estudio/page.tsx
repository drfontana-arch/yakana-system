import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { PatternThumbnail } from "@/components/estudio/pattern-thumbnail";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_PALETTE, type Pattern } from "@/lib/types/pattern";

export default async function EstudioPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: patterns } = await supabase
    .from("patterns")
    .select("*, palettes(*)")
    .order("updated_at", { ascending: false })
    .returns<Pattern[]>();

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Diagrama"
          description="Diagramas de colores y de puntos para tus patrones."
        />
        <Link
          href="/estudio/nuevo"
          className="flex items-center gap-2 rounded-yakana bg-terracotta px-4 py-2.5 text-sm font-medium text-offwhite transition-colors hover:bg-terracotta-dark"
        >
          <Plus size={18} />
          Nuevo patrón
        </Link>
      </div>

      {error ? (
        <p className="mb-4 rounded-yakana border border-terracotta/30 bg-terracotta/10 px-3 py-2 text-sm text-terracotta">
          {error}
        </p>
      ) : null}

      {!patterns || patterns.length === 0 ? (
        <div className="rounded-yakana border border-dashed border-linen bg-offwhite p-8 text-center text-sm text-charcoal/70">
          Todavía no creaste ningún patrón.{" "}
          <Link href="/estudio/nuevo" className="font-medium text-terracotta">
            Creá el primero
          </Link>
          .
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {patterns.map((pattern) => {
            const colors = pattern.palettes?.colors ?? DEFAULT_PALETTE;
            return (
              <Link
                key={pattern.id}
                href={`/estudio/${pattern.id}`}
                className="flex items-center gap-3 rounded-yakana border border-linen bg-offwhite p-4 transition-colors hover:border-terracotta"
              >
                <PatternThumbnail
                  gridData={pattern.grid_data}
                  width={pattern.width_stitches}
                  height={pattern.height_rows}
                  backgroundHex={colors[0]?.hex ?? "#faf7f2"}
                  size={64}
                  mode={pattern.display_mode}
                />
                <div className="min-w-0">
                  <p className="truncate font-heading text-lg italic text-navy">
                    {pattern.name}
                  </p>
                  <p className="mt-1 text-xs text-charcoal/60">
                    {pattern.width_stitches} × {pattern.height_rows} puntos ·{" "}
                    {pattern.display_mode === "stitch" ? "Puntos" : "Colores"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
