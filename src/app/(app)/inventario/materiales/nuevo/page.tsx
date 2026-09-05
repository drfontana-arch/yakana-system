import { PageHeader } from "@/components/ui/page-header";
import { SupplyForm } from "@/components/inventario/supply-form";
import { createSupply } from "@/lib/actions/supplies";

export default async function NuevoMaterialPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div>
      <PageHeader
        title="Nuevo material"
        description="Agregá una aguja, ganchillo, marcador o accesorio."
      />
      <SupplyForm action={createSupply} errorMessage={params.error} />
    </div>
  );
}
