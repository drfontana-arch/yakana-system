"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function stopTimerSession(projectId: string, formData: FormData) {
  const startedAt = formData.get("started_at") as string;
  const notes = (formData.get("notes") as string) || null;
  const supabase = await createClient();

  const endedAt = new Date();
  const durationMinutes = Math.max(
    1,
    Math.round((endedAt.getTime() - new Date(startedAt).getTime()) / 60000),
  );

  await supabase.from("work_sessions").insert({
    project_id: projectId,
    started_at: startedAt,
    ended_at: endedAt.toISOString(),
    duration_minutes: durationMinutes,
    notes,
  });

  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath(`/proyectos/${projectId}/tiempo`);
  revalidatePath(`/proyectos/${projectId}/costos`);
}

export async function addManualSession(projectId: string, formData: FormData) {
  const date = formData.get("date") as string;
  const hours = Number(formData.get("hours") || 0);
  const minutes = Number(formData.get("minutes") || 0);
  const notes = (formData.get("notes") as string) || null;
  const durationMinutes = hours * 60 + minutes;
  const supabase = await createClient();

  const startedAt = new Date(`${date}T12:00:00`);
  const endedAt = new Date(startedAt.getTime() + durationMinutes * 60000);

  await supabase.from("work_sessions").insert({
    project_id: projectId,
    started_at: startedAt.toISOString(),
    ended_at: endedAt.toISOString(),
    duration_minutes: durationMinutes,
    notes,
  });

  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath(`/proyectos/${projectId}/tiempo`);
  revalidatePath(`/proyectos/${projectId}/costos`);
}

export async function deleteWorkSession(formData: FormData) {
  const projectId = formData.get("project_id") as string;
  const id = formData.get("id") as string;
  const supabase = await createClient();

  await supabase.from("work_sessions").delete().eq("id", id);

  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath(`/proyectos/${projectId}/tiempo`);
  revalidatePath(`/proyectos/${projectId}/costos`);
}
