"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_PALETTE, type GridData, type PaletteColor, type Pattern } from "@/lib/types/pattern";
import { tileGrid, type RepeatRegion } from "@/lib/estudio/repeat-tile";

export async function createPattern(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = formData.get("name") as string;
  const width = Number(formData.get("width_stitches"));
  const height = Number(formData.get("height_rows"));
  const projectId = (formData.get("project_id") as string) || null;

  const { data: palette, error: paletteError } = await supabase
    .from("palettes")
    .insert({
      user_id: user.id,
      name: `${name} — paleta`,
      colors: DEFAULT_PALETTE,
      is_global: false,
    })
    .select("id")
    .single();

  if (paletteError || !palette) {
    redirect(`/estudio?error=${encodeURIComponent(paletteError?.message ?? "Error")}`);
  }

  const { data: pattern, error } = await supabase
    .from("patterns")
    .insert({
      user_id: user.id,
      project_id: projectId,
      name,
      width_stitches: width,
      height_rows: height,
      display_mode: "color",
      grid_data: {},
      palette_id: palette.id,
      source_type: "original",
    })
    .select("id")
    .single();

  if (error || !pattern) {
    redirect(`/estudio?error=${encodeURIComponent(error?.message ?? "Error")}`);
  }

  revalidatePath("/estudio");
  redirect(`/estudio/${pattern.id}`);
}

// Every page that can show a pattern's grid_data (thumbnails, the project's
// garment sketch, the combined document) reads it via a server-rendered
// fetch, so anything that mutates grid_data must revalidate all of them —
// otherwise those pages keep showing what the pattern looked like before
// the edit.
async function revalidatePatternViews(patternId: string, projectId: string | null) {
  revalidatePath("/estudio");
  revalidatePath(`/estudio/${patternId}`);
  if (projectId) {
    revalidatePath(`/proyectos/${projectId}/patron`);
    revalidatePath(`/proyectos/${projectId}/patron-completo`);
  }
}

export async function saveGridData(
  patternId: string,
  paletteId: string | null,
  gridData: GridData,
  colors: PaletteColor[],
) {
  const supabase = await createClient();

  const { data: pattern } = await supabase
    .from("patterns")
    .update({ grid_data: gridData, updated_at: new Date().toISOString() })
    .eq("id", patternId)
    .select("project_id")
    .single();

  if (paletteId) {
    await supabase.from("palettes").update({ colors }).eq("id", paletteId);
  }

  await revalidatePatternViews(patternId, pattern?.project_id ?? null);
}

export async function syncPatternState(
  patternId: string,
  paletteId: string | null,
  width: number,
  height: number,
  gridData: GridData,
  colors: PaletteColor[],
) {
  const supabase = await createClient();

  const { data: pattern } = await supabase
    .from("patterns")
    .update({
      width_stitches: width,
      height_rows: height,
      grid_data: gridData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", patternId)
    .select("project_id")
    .single();

  if (paletteId) {
    await supabase.from("palettes").update({ colors }).eq("id", paletteId);
  }

  await revalidatePatternViews(patternId, pattern?.project_id ?? null);
}

export async function resizePatternGrid(
  patternId: string,
  width: number,
  height: number,
  gridData: GridData,
) {
  const supabase = await createClient();

  const { data: pattern } = await supabase
    .from("patterns")
    .update({
      width_stitches: width,
      height_rows: height,
      grid_data: gridData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", patternId)
    .select("project_id")
    .single();

  await revalidatePatternViews(patternId, pattern?.project_id ?? null);
}

export async function savePatternVersion(
  patternId: string,
  label: string,
  gridData: GridData,
) {
  const supabase = await createClient();

  await supabase.from("pattern_versions").insert({
    pattern_id: patternId,
    version_label: label || null,
    grid_data: gridData,
  });

  revalidatePath(`/estudio/${patternId}`);
}

export async function deletePattern(formData: FormData) {
  const id = formData.get("id") as string;
  const supabase = await createClient();

  await supabase.from("patterns").delete().eq("id", id);

  revalidatePath("/estudio");
  redirect("/estudio");
}

export async function linkPatternToProject(projectId: string, formData: FormData) {
  const patternId = formData.get("pattern_id") as string;
  const supabase = await createClient();

  await supabase.from("patterns").update({ project_id: projectId }).eq("id", patternId);

  revalidatePath(`/proyectos/${projectId}/patron`);
}

export async function unlinkPatternFromProject(formData: FormData) {
  const projectId = formData.get("project_id") as string;
  const patternId = formData.get("pattern_id") as string;
  const supabase = await createClient();

  await supabase.from("patterns").update({ project_id: null }).eq("id", patternId);

  revalidatePath(`/proyectos/${projectId}/patron`);
}

export async function setPatternGarmentZone(projectId: string, formData: FormData) {
  const patternId = formData.get("pattern_id") as string;
  const garmentZone = (formData.get("garment_zone") as string) || null;
  const supabase = await createClient();

  await supabase.from("patterns").update({ garment_zone: garmentZone }).eq("id", patternId);

  revalidatePath(`/proyectos/${projectId}/patron`);
}

export async function restorePatternVersion(formData: FormData) {
  const patternId = formData.get("pattern_id") as string;
  const projectId = formData.get("project_id") as string;
  const versionId = formData.get("version_id") as string;
  const supabase = await createClient();

  const { data: version } = await supabase
    .from("pattern_versions")
    .select("grid_data")
    .eq("id", versionId)
    .single();

  if (version) {
    await supabase
      .from("patterns")
      .update({ grid_data: version.grid_data, updated_at: new Date().toISOString() })
      .eq("id", patternId);
  }

  revalidatePath(`/proyectos/${projectId}/patron`);
  revalidatePath(`/estudio/${patternId}`);
}

export async function setRepeatRegion(patternId: string, region: RepeatRegion | null) {
  const supabase = await createClient();
  await supabase.from("patterns").update({ repeat_region: region }).eq("id", patternId);
  revalidatePath(`/estudio/${patternId}`);
}

export async function generateTiledPattern(
  sourcePatternId: string,
  targetWidth: number,
  targetHeight: number,
  name: string,
  projectId: string | null,
  garmentZone: string | null,
): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { data: source, error: sourceError } = await supabase
    .from("patterns")
    .select("*, palettes(*)")
    .eq("id", sourcePatternId)
    .single<Pattern>();

  if (sourceError || !source || !source.repeat_region) {
    return { error: "Este patrón todavía no tiene una región de repetición marcada." };
  }

  const tiledGrid = tileGrid(source.grid_data, source.repeat_region, targetWidth, targetHeight);
  const sourceColors = source.palettes?.colors ?? DEFAULT_PALETTE;

  const { data: palette, error: paletteError } = await supabase
    .from("palettes")
    .insert({
      user_id: user.id,
      name: `${name} — paleta`,
      colors: sourceColors,
      is_global: false,
    })
    .select("id")
    .single();

  if (paletteError || !palette) {
    return { error: paletteError?.message ?? "No se pudo crear la paleta." };
  }

  const { data: pattern, error } = await supabase
    .from("patterns")
    .insert({
      user_id: user.id,
      project_id: projectId,
      garment_zone: garmentZone,
      name,
      width_stitches: targetWidth,
      height_rows: targetHeight,
      display_mode: "color",
      grid_data: tiledGrid,
      palette_id: palette.id,
      source_type: "repeated_from",
      source_reference: sourcePatternId,
    })
    .select("id")
    .single();

  if (error || !pattern) {
    return { error: error?.message ?? "No se pudo generar el patrón repetido." };
  }

  revalidatePath("/estudio");
  if (projectId) revalidatePath(`/proyectos/${projectId}/patron`);
  return { id: pattern.id };
}
