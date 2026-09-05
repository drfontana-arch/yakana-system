"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function parseDecimal(value: FormDataEntryValue | null): number | null {
  if (!value || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function addProjectYarn(projectId: string, formData: FormData) {
  const supabase = await createClient();

  await supabase.from("project_yarns").insert({
    project_id: projectId,
    yarn_id: formData.get("yarn_id") as string,
    color_role: (formData.get("color_role") as string) || null,
    estimated_meters: parseDecimal(formData.get("estimated_meters")),
    estimated_skeins: parseDecimal(formData.get("estimated_skeins")),
    actual_meters_used: parseDecimal(formData.get("actual_meters_used")),
    actual_skeins_used: parseDecimal(formData.get("actual_skeins_used")),
  });

  revalidatePath(`/proyectos/${projectId}`);
}

export async function updateProjectYarn(
  projectId: string,
  projectYarnId: string,
  formData: FormData,
) {
  const supabase = await createClient();

  await supabase
    .from("project_yarns")
    .update({
      color_role: (formData.get("color_role") as string) || null,
      estimated_meters: parseDecimal(formData.get("estimated_meters")),
      estimated_skeins: parseDecimal(formData.get("estimated_skeins")),
      actual_meters_used: parseDecimal(formData.get("actual_meters_used")),
      actual_skeins_used: parseDecimal(formData.get("actual_skeins_used")),
    })
    .eq("id", projectYarnId);

  revalidatePath(`/proyectos/${projectId}`);
}

export async function removeProjectYarn(formData: FormData) {
  const projectId = formData.get("project_id") as string;
  const projectYarnId = formData.get("id") as string;
  const supabase = await createClient();

  await supabase.from("project_yarns").delete().eq("id", projectYarnId);

  revalidatePath(`/proyectos/${projectId}`);
}
