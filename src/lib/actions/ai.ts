"use server";

import { createClient } from "@/lib/supabase/server";
import { askClaude } from "@/lib/ai/client";
import type { RaglanInputs, RaglanResults } from "@/lib/calculators/raglan";
import type { PaletteColor } from "@/lib/types/pattern";

type ActionResult<T> = T | { error: string };

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "No se pudo consultar la inteligencia artificial.";
}

export async function suggestPatternIdea(
  patternId: string,
): Promise<ActionResult<{ ideas: string[] }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { data: pattern } = await supabase
    .from("patterns")
    .select("name, width_stitches, height_rows, palettes(colors)")
    .eq("id", patternId)
    .single<{
      name: string;
      width_stitches: number;
      height_rows: number;
      palettes: { colors: PaletteColor[] } | null;
    }>();

  if (!pattern) return { error: "No se encontró el patrón." };

  const { data: libraryEntries } = await supabase
    .from("pattern_library")
    .select("title, tags, notes")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(8)
    .returns<{ title: string; tags: string[] | null; notes: string | null }[]>();

  const colorList =
    pattern.palettes?.colors.map((c) => `${c.name || "color"} (${c.hex})`).join(", ") ||
    "sin paleta definida";

  const libraryContext =
    libraryEntries && libraryEntries.length > 0
      ? libraryEntries
          .map(
            (e) =>
              `- "${e.title}"${e.tags?.length ? ` [${e.tags.join(", ")}]` : ""}${
                e.notes ? `: ${e.notes}` : ""
              }`,
          )
          .join("\n")
      : "(todavía no hay patrones guardados en la Biblioteca)";

  const prompt = `Sos un asistente de diseño para una tejedora artesanal que usa dos agujas/crochet. Estoy trabajando en un motivo de tejido llamado "${pattern.name}", una grilla de ${pattern.width_stitches} puntos de ancho por ${pattern.height_rows} vueltas de alto, con esta paleta de colores: ${colorList}.

Como referencia de su estilo, estos son algunos patrones que tiene guardados en su biblioteca:
${libraryContext}

Dame exactamente 3 ideas breves y concretas (una oración cada una, en español rioplatense, sin tecnicismos innecesarios) para variar este motivo o su combinación de colores. Pueden ser sobre simetría, proporciones, o qué colores probar. No describas una grilla punto por punto, son ideas para que ella misma dibuje. Respondé solo con las 3 ideas, una por línea, sin numerarlas ni agregar introducción ni cierre.`;

  try {
    const text = await askClaude(prompt, 400);
    const ideas = text
      .split("\n")
      .map((line) => line.replace(/^[-*\d.)\s]+/, "").trim())
      .filter(Boolean);
    return { ideas: ideas.slice(0, 3) };
  } catch (err) {
    return { error: errorMessage(err) };
  }
}

export async function reviewRaglanCalculation(
  inputs: RaglanInputs,
  results: RaglanResults,
): Promise<ActionResult<{ review: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { data: libraryEntries } = await supabase
    .from("pattern_library")
    .select("title, tags, notes")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(8)
    .returns<{ title: string; tags: string[] | null; notes: string | null }[]>();

  const libraryContext =
    libraryEntries && libraryEntries.length > 0
      ? libraryEntries
          .map(
            (e) =>
              `- "${e.title}"${e.tags?.length ? ` [${e.tags.join(", ")}]` : ""}${
                e.notes ? `: ${e.notes}` : ""
              }`,
          )
          .join("\n")
      : "(todavía no hay patrones guardados en la biblioteca — usá tu conocimiento general de tejido)";

  const prompt = `Sos un asistente técnico que revisa cálculos de tejido a dos agujas antes de que la persona empiece a tejer. Estos son los datos de un cálculo de canesú raglán:

Muestra: ${inputs.stitchesPer10cm} puntos y ${inputs.rowsPer10cm} vueltas cada 10cm.
Medidas objetivo: pecho ${inputs.chestCm}cm, cuello ${inputs.neckCm}cm, profundidad de canesú ${inputs.yokeDepthCm}cm, largo de cuerpo ${inputs.bodyLengthCm}cm, largo de manga ${inputs.sleeveLengthCm}cm, contorno de manga ${inputs.sleeveCircumferenceCm}cm, contorno de puño ${inputs.cuffCircumferenceCm}cm, holgura en axila ${inputs.underarmEaseCm}cm.
Resultado calculado: montado de cuello ${results.neckCastOn} p., puntos en la axila ${results.underarmStitches} p., ${results.increaseRounds} aumentos cada ${results.increaseEveryNRows} vueltas, ${results.yokeRows} vueltas de canesú, ${results.bodyRows} vueltas de cuerpo, manga de ${results.sleeveInitialStitches} a ${results.cuffStitches} p. en ${results.sleeveRows} vueltas.

Como referencia adicional, estos son patrones reales que la persona tiene guardados en su biblioteca (pueden tener notas útiles sobre holguras o ajustes que le funcionaron antes):
${libraryContext}

Revisá si algo en estos números se ve fuera de lo común para una prenda tejida a mano (por ejemplo: holgura demasiado ajustada o excesiva, una desproporción entre el cuello y el pecho, muy pocos o demasiados aumentos, etc). Respondé en español rioplatense, en 2 a 4 líneas cortas como máximo. Si no encontrás nada raro, decilo en una sola línea breve y no inventes problemas. No repitas los números que ya te di, andá directo a la observación.`;

  try {
    const review = await askClaude(prompt, 400);
    return { review };
  } catch (err) {
    return { error: errorMessage(err) };
  }
}
