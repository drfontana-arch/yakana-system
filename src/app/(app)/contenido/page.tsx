import { PageHeader } from "@/components/ui/page-header";
import { ComingSoon } from "@/components/ui/coming-soon";

export default function ContenidoPage() {
  return (
    <div>
      <PageHeader
        title="Contenido"
        description="Estudio de contenido para redes sociales: Instagram, TikTok y Pinterest."
      />
      <ComingSoon
        items={[
          "Composición de imágenes por formato (1:1, 4:5, 9:16, 2:3) con marca de agua",
          "Generación de captions con IA (Claude) en tono educativo, inspiracional o comercial",
          "Calendario de contenido mensual",
        ]}
      />
    </div>
  );
}
