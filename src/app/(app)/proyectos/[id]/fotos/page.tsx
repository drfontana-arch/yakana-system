import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { PhotoUploadWidget } from "@/components/proyectos/photo-upload-widget";
import { deleteProjectMedia } from "@/lib/actions/project-media";
import type { ProjectMedia } from "@/lib/types/project";

export default async function ProjectFotosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: media } = await supabase
    .from("project_media")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false })
    .returns<ProjectMedia[]>();

  return (
    <div className="space-y-6">
      <PhotoUploadWidget projectId={id} />

      <div className="rounded-yakana border border-dashed border-linen bg-offwhite p-4 text-sm text-charcoal/60">
        El boceto digital (dibujar directo en la pantalla) todavía no está disponible — lo
        sumamos más adelante junto con el Diagrama de patrones.
      </div>

      {!media || media.length === 0 ? (
        <p className="text-sm text-charcoal/60">Todavía no hay fotos en este proyecto.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {media.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-yakana border border-linen bg-offwhite"
            >
              <div className="relative aspect-square w-full bg-linen">
                <Image
                  src={item.file_url}
                  alt={item.caption ?? "Foto del proyecto"}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
              <div className="flex items-center justify-between p-2">
                <span className="text-xs text-charcoal/60">
                  {new Date(item.created_at).toLocaleDateString("es-AR")}
                </span>
                <form action={deleteProjectMedia}>
                  <input type="hidden" name="project_id" value={id} />
                  <input type="hidden" name="id" value={item.id} />
                  <button
                    type="submit"
                    className="text-xs font-medium text-terracotta hover:underline"
                  >
                    Borrar
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
