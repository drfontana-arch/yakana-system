"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function parseDecimal(value: FormDataEntryValue | null): number | null {
  if (!value || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseTags(value: FormDataEntryValue | null): string[] | null {
  if (!value || typeof value !== "string" || value.trim() === "") return null;
  return value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function yarnPayload(formData: FormData) {
  return {
    name: formData.get("name") as string,
    brand: (formData.get("brand") as string) || null,
    colorway_name: (formData.get("colorway_name") as string) || null,
    dye_lot_code: (formData.get("dye_lot_code") as string) || null,
    color_code: (formData.get("color_code") as string) || null,
    fiber_content: (formData.get("fiber_content") as string) || null,
    weight_category: (formData.get("weight_category") as string) || null,
    skein_weight_grams: parseDecimal(formData.get("skein_weight_grams")),
    skein_yardage_meters: parseDecimal(formData.get("skein_yardage_meters")),
    recommended_needle_mm: parseDecimal(formData.get("recommended_needle_mm")),
    quantity_skeins: parseDecimal(formData.get("quantity_skeins")),
    quantity_grams: parseDecimal(formData.get("quantity_grams")),
    cost_per_skein: parseDecimal(formData.get("cost_per_skein")),
    color_hex: (formData.get("color_hex") as string) || null,
    photo_url: (formData.get("photo_url") as string) || null,
    location: (formData.get("location") as string) || null,
    notes: (formData.get("notes") as string) || null,
    tags: parseTags(formData.get("tags")),
  };
}

export async function createYarn(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("yarns")
    .insert({ ...yarnPayload(formData), user_id: user.id });

  if (error) {
    redirect(`/inventario/nueva?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/inventario");
  redirect("/inventario");
}

export async function updateYarn(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("yarns")
    .update(yarnPayload(formData))
    .eq("id", id);

  if (error) {
    redirect(`/inventario/${id}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/inventario");
  redirect("/inventario");
}

export async function deleteYarn(formData: FormData) {
  const id = formData.get("id") as string;
  const supabase = await createClient();

  const { error } = await supabase.from("yarns").delete().eq("id", id);

  if (error) {
    redirect(`/inventario?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/inventario");
  redirect("/inventario");
}
