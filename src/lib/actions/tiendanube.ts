"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { tiendanubeFetch } from "@/lib/tiendanube/client";
import { computeProjectCost } from "@/lib/project-cost";
import type { Project, ProjectYarn, WorkSession } from "@/lib/types/project";

export async function disconnectTiendaNube() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("user_profiles")
    .update({ tiendanube_store_id: null, tiendanube_access_token: null })
    .eq("id", user.id);

  revalidatePath("/tienda");
}

export async function publishProjectToStore(
  projectId: string,
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("tiendanube_store_id, tiendanube_access_token, markup_factor")
    .eq("id", user.id)
    .single<{
      tiendanube_store_id: string | null;
      tiendanube_access_token: string | null;
      markup_factor: number | null;
    }>();

  if (!profile?.tiendanube_store_id || !profile?.tiendanube_access_token) {
    return { error: "Todavía no conectaste tu tienda de TiendaNube." };
  }

  const [{ data: project }, { data: projectYarns }, { data: sessions }, { data: photos }] =
    await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).single<Project>(),
      supabase
        .from("project_yarns")
        .select("*, yarns(*)")
        .eq("project_id", projectId)
        .returns<ProjectYarn[]>(),
      supabase
        .from("work_sessions")
        .select("*")
        .eq("project_id", projectId)
        .returns<WorkSession[]>(),
      supabase
        .from("project_media")
        .select("file_url")
        .eq("project_id", projectId)
        .eq("type", "photo")
        .returns<{ file_url: string }[]>(),
    ]);

  if (!project) return { error: "No se encontró el proyecto." };

  const cost = computeProjectCost(
    projectYarns ?? [],
    sessions ?? [],
    project.hourly_rate ?? 0,
    profile.markup_factor ?? 3.0,
  );

  const payload = {
    name: { es: project.name },
    description: { es: project.notes || `${project.name}, tejido a mano por Yakana.` },
    images: (photos ?? []).map((p) => ({ src: p.file_url })),
    variants: [
      {
        price: cost.suggestedPrice.toFixed(2),
        stock_management: true,
        stock: 1,
      },
    ],
  };

  try {
    if (project.tiendanube_product_id) {
      await tiendanubeFetch(
        profile.tiendanube_store_id,
        profile.tiendanube_access_token,
        `/products/${project.tiendanube_product_id}`,
        { method: "PUT", body: JSON.stringify(payload) },
      );
    } else {
      const created = await tiendanubeFetch<{ id: number }>(
        profile.tiendanube_store_id,
        profile.tiendanube_access_token,
        "/products",
        { method: "POST", body: JSON.stringify(payload) },
      );
      await supabase
        .from("projects")
        .update({ tiendanube_product_id: String(created.id) })
        .eq("id", projectId);
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No se pudo publicar en la tienda." };
  }

  revalidatePath("/tienda");
  return { ok: true };
}
