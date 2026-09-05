"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createContent(formData: FormData) {
  const projectId = formData.get("project_id") as string;
  const platform = formData.get("platform") as string;
  const format = formData.get("format") as string;
  const hookText = (formData.get("hook_text") as string) || null;
  const scheduledDate = (formData.get("scheduled_date") as string) || null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("social_content")
    .insert({
      project_id: projectId,
      platform,
      format,
      hook_text: hookText,
      scheduled_date: scheduledDate,
      status: scheduledDate ? "scheduled" : "draft",
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(`/contenido?error=${encodeURIComponent(error?.message ?? "Error")}`);
  }

  revalidatePath("/contenido");
  redirect(`/contenido/${data.id}`);
}

export async function deleteContent(formData: FormData) {
  const id = formData.get("id") as string;
  const supabase = await createClient();
  await supabase.from("social_content").delete().eq("id", id);
  revalidatePath("/contenido");
  redirect("/contenido");
}

export async function updateContentSchedule(formData: FormData) {
  const id = formData.get("id") as string;
  const status = formData.get("status") as string;
  const scheduledDate = (formData.get("scheduled_date") as string) || null;

  const supabase = await createClient();
  await supabase
    .from("social_content")
    .update({ status, scheduled_date: scheduledDate })
    .eq("id", id);

  revalidatePath("/contenido");
  revalidatePath(`/contenido/${id}`);
}

export async function updateContentText(
  id: string,
  fields: { caption_es?: string; caption_en?: string; hashtags?: string[]; hook_text?: string },
) {
  const supabase = await createClient();
  await supabase.from("social_content").update(fields).eq("id", id);
  revalidatePath(`/contenido/${id}`);
  revalidatePath("/contenido");
}

export async function addContentMedia(id: string, url: string) {
  const supabase = await createClient();
  const { data: current } = await supabase
    .from("social_content")
    .select("media_urls")
    .eq("id", id)
    .single<{ media_urls: string[] | null }>();

  const nextUrls = [...(current?.media_urls ?? []), url];
  await supabase.from("social_content").update({ media_urls: nextUrls }).eq("id", id);
  revalidatePath(`/contenido/${id}`);
  revalidatePath("/contenido");
}

export async function removeContentMedia(id: string, url: string) {
  const supabase = await createClient();
  const { data: current } = await supabase
    .from("social_content")
    .select("media_urls")
    .eq("id", id)
    .single<{ media_urls: string[] | null }>();

  const nextUrls = (current?.media_urls ?? []).filter((u) => u !== url);
  await supabase.from("social_content").update({ media_urls: nextUrls }).eq("id", id);
  revalidatePath(`/contenido/${id}`);
}
