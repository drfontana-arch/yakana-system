"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { askClaude } from "@/lib/ai/client";
import type { RaglanInputs, RaglanResults } from "@/lib/calculators/raglan";
import type { PaletteColor } from "@/lib/types/pattern";
import { PROJECT_TYPES } from "@/lib/types/project";
import { neckStyleLabel, closureTypeLabel, BODY_FITS } from "@/lib/calculators/raglan-options";
import type { ProjectYarn } from "@/lib/types/project";
import type { Pattern } from "@/lib/types/pattern";
import { platformLabel, type ContentTone } from "@/lib/types/content";

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

const TONE_INSTRUCTIONS: Record<ContentTone, string> = {
  educational:
    "Educativo: enseñale algo puntual a quien lee (una técnica, un dato sobre la lana o el proceso), como si fuera un mini-tip útil.",
  inspirational:
    "Inspiracional: transmití la parte emotiva y artesanal del proceso — el tiempo, el cariño, la historia detrás de la prenda.",
  commercial:
    "Comercial: invitá a comprar o encargar una prenda similar, con una bajada de acción clara pero sin sonar agresivo.",
};

export async function generateCaption(
  contentId: string,
  tone: ContentTone,
): Promise<ActionResult<{ caption: string; hashtags: string[] }>> {
  const supabase = await createClient();

  const { data: content } = await supabase
    .from("social_content")
    .select("platform, hook_text, projects(name, type, recipient)")
    .eq("id", contentId)
    .single<{
      platform: string;
      hook_text: string | null;
      projects: { name: string; type: string | null; recipient: string | null } | null;
    }>();

  if (!content) return { error: "No se encontró la publicación." };

  const project = content.projects;
  const typeLabel = PROJECT_TYPES.find((t) => t.value === project?.type)?.label ?? "prenda";
  const platform = platformLabel(content.platform);

  const prompt = `Sos quien escribe las redes sociales de Yakana, un emprendimiento artesanal de tejido a mano (dos agujas y crochet). Necesito el texto (caption) para una publicación de ${platform} sobre "${project?.name ?? "un proyecto"}" (${typeLabel}${project?.recipient ? `, para ${project.recipient}` : ""}).
${content.hook_text ? `La idea/gancho que quiero transmitir es: "${content.hook_text}".` : ""}

Tono: ${TONE_INSTRUCTIONS[tone]}

Escribí en español rioplatense, cercano y cálido, sin sonar corporativo. Máximo 4 a 6 líneas cortas. Podés usar algún emoji con moderación, no abuses. Después sumá de 5 a 8 hashtags relevantes (mezclá algunos en español y otros en inglés, típicos del mundo tejido/handmade).

Respondé EXACTAMENTE en este formato, sin nada antes ni después:
CAPTION: <el texto acá>
HASHTAGS: #tag1 #tag2 #tag3`;

  try {
    const text = await askClaude(prompt, 500);
    const captionMatch = text.match(/CAPTION:\s*([\s\S]*?)\s*HASHTAGS:/i);
    const hashtagsMatch = text.match(/HASHTAGS:\s*([\s\S]*)/i);
    const caption = captionMatch ? captionMatch[1].trim() : text.trim();
    const hashtags = hashtagsMatch
      ? (hashtagsMatch[1].match(/#[\p{L}0-9_]+/gu) ?? [])
      : [];

    await supabase
      .from("social_content")
      .update({ caption_es: caption, hashtags })
      .eq("id", contentId);
    revalidatePath(`/contenido/${contentId}`);

    return { caption, hashtags };
  } catch (err) {
    return { error: errorMessage(err) };
  }
}

export async function generateGarmentImagePrompt(
  projectId: string,
): Promise<ActionResult<{ prompt: string }>> {
  const supabase = await createClient();

  const [{ data: project }, { data: calc }, { data: projectYarns }, { data: patterns }] =
    await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).single(),
      supabase
        .from("raglan_calculations")
        .select("measurements")
        .eq("project_id", projectId)
        .eq("is_miniature", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<{ measurements: Record<string, number | string> }>(),
      supabase
        .from("project_yarns")
        .select("*, yarns(*)")
        .eq("project_id", projectId)
        .returns<ProjectYarn[]>(),
      supabase
        .from("patterns")
        .select("*, palettes(*)")
        .eq("project_id", projectId)
        .not("garment_zone", "is", null)
        .returns<Pattern[]>(),
    ]);

  if (!project) return { error: "No se encontró el proyecto." };

  const typeLabel = PROJECT_TYPES.find((t) => t.value === project.type)?.label ?? "prenda tejida";
  const m = calc?.measurements;
  const neckDesc = m?.neckStyle ? neckStyleLabel(String(m.neckStyle)).toLowerCase() : null;
  const fitDesc = m?.bodyFit
    ? (BODY_FITS.find((f) => f.value === m.bodyFit)?.label ?? String(m.bodyFit)).toLowerCase()
    : null;
  const closureDesc = m?.closureType ? closureTypeLabel(String(m.closureType)).toLowerCase() : null;

  const yarnDescriptions = (projectYarns ?? [])
    .map((py) => {
      const yarn = py.yarns;
      if (!yarn) return null;
      const fiber = yarn.fiber_content ? ` de ${yarn.fiber_content}` : "";
      const colorway = yarn.colorway_name ? ` color "${yarn.colorway_name}"` : "";
      return `${yarn.name}${colorway}${fiber}${yarn.color_hex ? ` (tono aproximado ${yarn.color_hex})` : ""}`;
    })
    .filter(Boolean)
    .join(", ");

  const colorworkDescriptions = (patterns ?? [])
    .filter((p) => p.display_mode !== "stitch")
    .map((p) => {
      const colors = (p.palettes?.colors ?? []).map((c) => c.name || c.hex).join(", ");
      return `en la zona "${p.garment_zone}" un motivo de tejido a color llamado "${p.name}" con estos colores: ${colors}`;
    })
    .join("; ");

  const prompt = `Sos un asistente que arma prompts para generadores de imágenes (como Gemini). Necesito un prompt en español, detallado y evocador, para generar una foto de producto realista de una prenda tejida a mano que todavía no existe — se está por tejer, así que la imagen es una anticipación de cómo va a quedar.

Datos de la prenda:
- Tipo: ${typeLabel}${project.recipient ? `, para ${project.recipient}` : ""}${project.size_label ? `, talla ${project.size_label}` : ""}.
${neckDesc ? `- Cuello: ${neckDesc}.` : ""}
${fitDesc ? `- Entalle del cuerpo: ${fitDesc}.` : ""}
${closureDesc ? `- Cierre: ${closureDesc}.` : ""}
${yarnDescriptions ? `- Lanas: ${yarnDescriptions}.` : "- No hay lanas específicas cargadas todavía; usá colores neutros tierra a tu criterio."}
${colorworkDescriptions ? `- Detalles de color: ${colorworkDescriptions}.` : ""}

Escribí el prompt final (nada más, sin explicaciones antes ni después) en español, en un solo párrafo, describiendo: la prenda tejida a mano con esas características, la textura realista de punto de lana, los colores exactos mencionados, iluminación de estudio suave y natural, fotografía de producto tipo flat-lay sobre fondo neutro claro, alta resolución, sin persona ni maniquí. El prompt tiene que quedar listo para pegar directamente en un generador de imágenes.`;

  try {
    const text = await askClaude(prompt, 500);
    return { prompt: text.trim() };
  } catch (err) {
    return { error: errorMessage(err) };
  }
}
