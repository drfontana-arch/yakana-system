"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addProjectMedia(
  projectId: string,
  fileUrl: string,
  type: string,
  caption: string | null,
) {
  const supabase = await createClient();
  await supabase.from("project_media").insert({
    project_id: projectId,
    type,
    file_url: fileUrl,
    caption,
  });

  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath(`/proyectos/${projectId}/fotos`);
}

export async function deleteProjectMedia(formData: FormData) {
  const projectId = formData.get("project_id") as string;
  const id = formData.get("id") as string;
  const supabase = await createClient();

  await supabase.from("project_media").delete().eq("id", id);

  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath(`/proyectos/${projectId}/fotos`);
}
