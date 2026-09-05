"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveRaglanCalculation(
  projectId: string,
  sizeLabel: string,
  measurements: Record<string, number | string>,
  results: Record<string, number>,
  instructions: string[],
  gauge: { stitchesPer10cm: number; rowsPer10cm: number; needleMm: number | null },
  isMiniature = false,
) {
  const supabase = await createClient();

  await supabase.from("raglan_calculations").insert({
    project_id: projectId,
    size_label: sizeLabel,
    measurements,
    results,
    row_by_row_instructions: instructions,
    is_miniature: isMiniature,
  });

  await supabase
    .from("projects")
    .update({
      gauge_stitches_per_10cm: gauge.stitchesPer10cm,
      gauge_rows_per_10cm: gauge.rowsPer10cm,
      needle_size_mm: gauge.needleMm,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/calculadora");
}
