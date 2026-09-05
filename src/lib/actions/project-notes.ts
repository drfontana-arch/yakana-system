"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addProjectNote(projectId: string, formData: FormData) {
  const type = formData.get("type") as string;
  const content = formData.get("content") as string;
  if (!content || !content.trim()) return;

  const supabase = await createClient();
  await supabase.from("project_notes").insert({
    project_id: projectId,
    type,
    content: content.trim(),
  });

  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath(`/proyectos/${projectId}/registro`);
}

export async function deleteProjectNote(formData: FormData) {
  const projectId = formData.get("project_id") as string;
  const id = formData.get("id") as string;
  const supabase = await createClient();

  await supabase.from("project_notes").delete().eq("id", id);

  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath(`/proyectos/${projectId}/registro`);
}
