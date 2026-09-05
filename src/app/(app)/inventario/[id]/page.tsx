import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { YarnForm } from "@/components/inventario/yarn-form";
import { createClient } from "@/lib/supabase/server";
import { updateYarn, deleteYarn } from "@/lib/actions/yarns";
import type { Yarn } from "@/lib/types/yarn";

export default async function EditarLanaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: yarn } = await supabase
    .from("yarns")
    .select("*")
    .eq("id", id)
    .single<Yarn>();

  if (!yarn) notFound();

  const updateWithId = updateYarn.bind(null, id);

  return (
    <div>
      <PageHeader title={yarn.name} description="Editá los datos de esta lana." />
      <YarnForm yarn={yarn} action={updateWithId} errorMessage={error} />

      <form action={deleteYarn} className="mt-6">
        <input type="hidden" name="id" value={yarn.id} />
        <button
          type="submit"
          className="rounded-yakana border border-terracotta/40 px-4 py-2 text-sm font-medium text-terracotta transition-colors hover:bg-terracotta/10"
        >
          Eliminar lana
        </button>
      </form>
    </div>
  );
}
