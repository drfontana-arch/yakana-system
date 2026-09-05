import { PageHeader } from "@/components/ui/page-header";
import { createClient } from "@/lib/supabase/server";
import { PhotoExtractor } from "@/components/colores/photo-extractor";
import { ColorWheel } from "@/components/colores/color-wheel";
import { GlobalPaletteList } from "@/components/colores/global-palette-list";
import type { Palette } from "@/lib/types/pattern";

export default async function ColoresPage() {
  const supabase = await createClient();
  const { data: palettes } = await supabase
    .from("palettes")
    .select("*")
    .eq("is_global", true)
    .order("created_at", { ascending: false })
    .returns<Palette[]>();

  return (
    <div>
      <PageHeader
        title="Colores"
        description="Extraé paletas desde fotos de lana y explorá armonías de color."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <PhotoExtractor />
        <ColorWheel />
      </div>

      <div className="mt-8">
        <h2 className="mb-3 font-heading text-xl italic text-navy">
          Paletas globales ({palettes?.length ?? 0})
        </h2>
        <GlobalPaletteList palettes={palettes ?? []} />
      </div>
    </div>
  );
}
