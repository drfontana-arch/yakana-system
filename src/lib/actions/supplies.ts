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

function supplyPayload(formData: FormData) {
  return {
    category: formData.get("category") as string,
    name: formData.get("name") as string,
    brand: (formData.get("brand") as string) || null,
    size_mm: parseDecimal(formData.get("size_mm")),
    cable_length_cm: parseDecimal(formData.get("cable_length_cm")),
    material: (formData.get("material") as string) || null,
    quantity: parseDecimal(formData.get("quantity")),
    cost: parseDecimal(formData.get("cost")),
    color_hex: (formData.get("color_hex") as string) || null,
    photo_url: (formData.get("photo_url") as string) || null,
    location: (formData.get("location") as string) || null,
    notes: (formData.get("notes") as string) || null,
    tags: parseTags(formData.get("tags")),
  };
}

export async function createSupply(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("supplies")
    .insert({ ...supplyPayload(formData), user_id: user.id });

  if (error) {
    redirect(`/inventario/materiales/nuevo?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/inventario/materiales");
  redirect("/inventario/materiales");
}

export async function updateSupply(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("supplies")
    .update(supplyPayload(formData))
    .eq("id", id);

  if (error) {
    redirect(`/inventario/materiales/${id}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/inventario/materiales");
  redirect("/inventario/materiales");
}

export async function deleteSupply(formData: FormData) {
  const id = formData.get("id") as string;
  const supabase = await createClient();

  const { error } = await supabase.from("supplies").delete().eq("id", id);

  if (error) {
    redirect(`/inventario/materiales?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/inventario/materiales");
  redirect("/inventario/materiales");
}
