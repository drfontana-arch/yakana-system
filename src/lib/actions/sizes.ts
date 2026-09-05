"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_SIZES } from "@/lib/types/size";

export async function ensureStandardSizes(userId: string) {
  const supabase = await createClient();

  // Upsert on the (user, category, size) unique key instead of a
  // check-then-insert: safe even if two requests race to seed at once.
  await supabase
    .from("standard_sizes")
    .upsert(
      DEFAULT_SIZES.map((s) => ({ ...s, user_id: userId })),
      { onConflict: "user_id,category,size_label", ignoreDuplicates: true },
    );
}

export async function updateStandardSize(id: string, formData: FormData) {
  const supabase = await createClient();

  function num(name: string) {
    const v = formData.get(name);
    return v && v !== "" ? Number(v) : null;
  }

  await supabase
    .from("standard_sizes")
    .update({
      chest_cm: num("chest_cm"),
      body_length_cm: num("body_length_cm"),
      yoke_depth_cm: num("yoke_depth_cm"),
      neck_cm: num("neck_cm"),
      shoulder_width_cm: num("shoulder_width_cm"),
      sleeve_length_cm: num("sleeve_length_cm"),
      sleeve_circumference_cm: num("sleeve_circumference_cm"),
      cuff_circumference_cm: num("cuff_circumference_cm"),
    })
    .eq("id", id);

  revalidatePath("/calculadora");
}
