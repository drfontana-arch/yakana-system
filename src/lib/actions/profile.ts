"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  function num(name: string) {
    const v = formData.get(name);
    return v && v !== "" ? Number(v) : null;
  }

  await supabase
    .from("user_profiles")
    .update({
      name: (formData.get("name") as string) || null,
      brand_name: (formData.get("brand_name") as string) || "Yakana",
      default_hourly_rate: num("default_hourly_rate"),
      markup_factor: num("markup_factor") ?? 3.0,
      waste_allowance_pct: num("waste_allowance_pct") ?? 10.0,
      watermark_position: (formData.get("watermark_position") as string) || "bottom-right",
      watermark_opacity: num("watermark_opacity") ?? 0.3,
      preferred_language: (formData.get("preferred_language") as string) || "es",
    })
    .eq("id", user.id);

  revalidatePath("/configuracion");
  redirect("/configuracion?saved=1");
}
