"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
