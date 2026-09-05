import { PageHeader } from "@/components/ui/page-header";
import { ComingSoon } from "@/components/ui/coming-soon";

export default function TiendaPage() {
  return (
    <div>
      <PageHeader
        title="Tienda"
        description="Sincronización con TiendaNube: publicar productos y ver pedidos."
      />
      <ComingSoon
        items={[
          "Conectar tu cuenta de TiendaNube (esto lo armamos al final del proyecto)",
          "Publicar un proyecto terminado como producto",
          "Panel de pedidos recientes",
        ]}
      />
    </div>
  );
}
