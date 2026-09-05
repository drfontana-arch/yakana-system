import { PageHeader } from "@/components/ui/page-header";
import { YarnForm } from "@/components/inventario/yarn-form";
import { createYarn } from "@/lib/actions/yarns";

export default async function NuevaLanaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div>
      <PageHeader title="Nueva lana" description="Agregá una lana a tu stock." />
      <YarnForm action={createYarn} errorMessage={params.error} />
    </div>
  );
}
