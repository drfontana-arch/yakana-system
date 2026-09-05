"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function parseDecimal(value: FormDataEntryValue | null): number | null {
  if (!value || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function projectPayload(formData: FormData) {
  return {
    name: formData.get("name") as string,
    type: (formData.get("type") as string) || null,
    status: (formData.get("status") as string) || "idea",
    construction_direction: (formData.get("construction_direction") as string) || null,
    size_label: (formData.get("size_label") as string) || null,
    recipient: (formData.get("recipient") as string) || null,
    gauge_stitches_per_10cm: parseDecimal(formData.get("gauge_stitches_per_10cm")),
    gauge_rows_per_10cm: parseDecimal(formData.get("gauge_rows_per_10cm")),
    needle_size_mm: parseDecimal(formData.get("needle_size_mm")),
    hourly_rate: parseDecimal(formData.get("hourly_rate")),
    start_date: (formData.get("start_date") as string) || null,
    completion_date: (formData.get("completion_date") as string) || null,
    notes: (formData.get("notes") as string) || null,
  };
}

export async function createProject(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("projects")
    .insert({ ...projectPayload(formData), user_id: user.id })
    .select("id")
    .single();

  if (error || !data) {
    redirect(`/proyectos/nuevo?error=${encodeURIComponent(error?.message ?? "Error")}`);
  }

  revalidatePath("/proyectos");
  redirect(`/proyectos/${data.id}`);
}

export async function updateProject(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("projects")
    .update({ ...projectPayload(formData), updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    redirect(`/proyectos/${id}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/proyectos/${id}`);
  revalidatePath("/proyectos");
  redirect(`/proyectos/${id}`);
}

export async function updateProjectStatus(id: string, formData: FormData) {
  const supabase = await createClient();
  const status = formData.get("status") as string;

  await supabase
    .from("projects")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath(`/proyectos/${id}`);
  revalidatePath("/proyectos");
}

export async function deleteProject(formData: FormData) {
  const id = formData.get("id") as string;
  const supabase = await createClient();

  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) {
    redirect(`/proyectos/${id}/editar?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/proyectos");
  redirect("/proyectos");
}
