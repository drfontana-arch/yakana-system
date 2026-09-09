"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { askClaudeWithImageUrl } from "@/lib/ai/client";
import { isPdfUrl } from "@/lib/types/library";

function parseTags(value: FormDataEntryValue | null): string[] | null {
  if (!value || typeof value !== "string" || value.trim() === "") return null;
  return value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export async function createLibraryEntry(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("pattern_library").insert({
    user_id: user.id,
    title: formData.get("title") as string,
    author: (formData.get("author") as string) || null,
    source_url: (formData.get("source_url") as string) || null,
    copyright_note: (formData.get("copyright_note") as string) || null,
    file_url: (formData.get("file_url") as string) || null,
    tags: parseTags(formData.get("tags")),
    notes: (formData.get("notes") as string) || null,
  });

  if (error) {
    redirect(`/biblioteca/nueva?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/biblioteca");
  redirect("/biblioteca");
}

export async function updateLibraryEntry(id: string, formData: FormData) {
  const supabase = await createClient();

  await supabase
    .from("pattern_library")
    .update({
      title: formData.get("title") as string,
      author: (formData.get("author") as string) || null,
      source_url: (formData.get("source_url") as string) || null,
      copyright_note: (formData.get("copyright_note") as string) || null,
      tags: parseTags(formData.get("tags")),
      notes: (formData.get("notes") as string) || null,
    })
    .eq("id", id);

  revalidatePath("/biblioteca");
}

export async function deleteLibraryEntry(formData: FormData) {
  const id = formData.get("id") as string;
  const supabase = await createClient();

  await supabase.from("pattern_library").delete().eq("id", id);

  revalidatePath("/biblioteca");
}

export async function publishPatternToLibrary(
  patternId: string,
  title: string,
  tags: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("pattern_library").insert({
    user_id: user.id,
    title,
    pattern_id: patternId,
    tags: parseTags(tags),
  });

  revalidatePath("/biblioteca");
}

export async function analyzeLibraryPatternImage(
  entryId: string,
): Promise<{ notes: string } | { error: string }> {
  const supabase = await createClient();

  const { data: entry } = await supabase
    .from("pattern_library")
    .select("file_url, notes")
    .eq("id", entryId)
    .single<{ file_url: string | null; notes: string | null }>();

  if (!entry?.file_url) return { error: "Este patrón no tiene un archivo cargado." };
  if (isPdfUrl(entry.file_url)) {
    return {
      error:
        "Por ahora la IA solo puede mirar fotos, no PDFs — si es un PDF, describí el patrón vos mismo en las notas.",
    };
  }

  const { data: signed, error: signError } = await supabase.storage
    .from("pattern-library")
    .createSignedUrl(entry.file_url, 300);
  if (signError || !signed) return { error: "No se pudo abrir el archivo para analizarlo." };

  const prompt = `Mirá esta foto de un patrón de tejido a mano (dos agujas o crochet) y describilo en español rioplatense, en un párrafo corto (4 a 6 líneas), para que quede como nota de referencia útil más adelante. Mencioná: qué tipo de prenda o motivo es, qué puntos o técnicas se ven (trenzas, calados, colorwork, textura), los colores que aparecen, y cualquier dato de talla, muestra o medidas que esté escrito en la imagen. Si no se llega a leer algo con claridad, no lo inventes — decí que no se distingue. Respondé solo con la descripción, sin introducción.`;

  try {
    const description = await askClaudeWithImageUrl(prompt, signed.signedUrl, 400);
    const notes = entry.notes ? `${entry.notes}\n\n📷 ${description}` : `📷 ${description}`;
    return { notes };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No se pudo analizar la imagen." };
  }
}
