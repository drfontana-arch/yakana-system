"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PaletteColor } from "@/lib/types/pattern";

export async function createGlobalPalette(name: string, colors: PaletteColor[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("palettes").insert({
    user_id: user.id,
    name,
    colors,
    is_global: true,
  });

  revalidatePath("/colores");
}

export async function updateGlobalPalette(id: string, name: string, colors: PaletteColor[]) {
  const supabase = await createClient();

  await supabase.from("palettes").update({ name, colors }).eq("id", id);

  revalidatePath("/colores");
}

export async function deleteGlobalPalette(formData: FormData) {
  const id = formData.get("id") as string;
  const supabase = await createClient();

  await supabase.from("palettes").delete().eq("id", id);

  revalidatePath("/colores");
}
