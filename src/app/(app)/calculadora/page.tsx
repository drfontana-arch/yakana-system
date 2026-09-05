import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { createClient } from "@/lib/supabase/server";
import { ensureStandardSizes } from "@/lib/actions/sizes";
import { RaglanCalculator } from "@/components/calculadora/raglan-calculator";
import type { StandardSize } from "@/lib/types/size";
import type { Project } from "@/lib/types/project";

export default async function CalculadoraPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await ensureStandardSizes(user.id);

  const [{ data: sizes }, { data: profile }, { data: projects }] = await Promise.all([
    supabase
      .from("standard_sizes")
      .select("*")
      .order("category")
      .order("sort_order")
      .returns<StandardSize[]>(),
    supabase
      .from("user_profiles")
      .select("waste_allowance_pct")
      .eq("id", user.id)
      .single<{ waste_allowance_pct: number | null }>(),
    supabase.from("projects").select("*").order("name").returns<Project[]>(),
  ]);

  return (
    <div>
      <PageHeader
        title="Calculadora"
        description="Muestra, tallas estándar y cálculo de canesú raglán."
      />
      <RaglanCalculator
        sizes={sizes ?? []}
        defaultWastePct={profile?.waste_allowance_pct ?? 10}
        projects={projects ?? []}
      />
    </div>
  );
}
