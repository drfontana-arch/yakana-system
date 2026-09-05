import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { SupplyForm } from "@/components/inventario/supply-form";
import { createClient } from "@/lib/supabase/server";
import { updateSupply, deleteSupply } from "@/lib/actions/supplies";
import type { Supply } from "@/lib/types/supply";

export default async function EditarMaterialPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: supply } = await supabase
    .from("supplies")
    .select("*")
    .eq("id", id)
    .single<Supply>();

  if (!supply) notFound();

  const updateWithId = updateSupply.bind(null, id);

  return (
    <div>
      <PageHeader title={supply.name} description="Editá los datos de este material." />
      <SupplyForm supply={supply} action={updateWithId} errorMessage={error} />

      <form action={deleteSupply} className="mt-6">
        <input type="hidden" name="id" value={supply.id} />
        <button
          type="submit"
          className="rounded-yakana border border-terracotta/40 px-4 py-2 text-sm font-medium text-terracotta transition-colors hover:bg-terracotta/10"
        >
          Eliminar material
        </button>
      </form>
    </div>
  );
}
