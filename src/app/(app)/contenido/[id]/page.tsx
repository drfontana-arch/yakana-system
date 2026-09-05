import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteContent } from "@/lib/actions/content";
import { ScheduleForm } from "@/components/contenido/schedule-form";
import { CaptionGenerator } from "@/components/contenido/caption-generator";
import { ImageComposer } from "@/components/contenido/image-composer";
import { PLATFORMS, formatSpec, platformLabel } from "@/lib/types/content";
import type { SocialContent } from "@/lib/types/content";

export default async function ContentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: content } = await supabase
    .from("social_content")
    .select("*, projects(name)")
    .eq("id", id)
    .single<SocialContent>();

  if (!content) notFound();

  const [{ data: photos }, { data: profile }] = await Promise.all([
    supabase
      .from("project_media")
      .select("id, file_url")
      .eq("project_id", content.project_id)
      .eq("type", "photo")
      .order("created_at", { ascending: false })
      .returns<{ id: string; file_url: string }[]>(),
    user
      ? supabase
          .from("user_profiles")
          .select("watermark_position, watermark_opacity")
          .eq("id", user.id)
          .single<{ watermark_position: string | null; watermark_opacity: number | null }>()
      : Promise.resolve({ data: null }),
  ]);

  const spec = formatSpec(content.format);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/contenido" className="text-xs font-medium text-terracotta hover:underline">
          ← Volver a Contenido
        </Link>
        <form action={deleteContent}>
          <input type="hidden" name="id" value={content.id} />
          <button type="submit" className="text-xs text-charcoal/50 hover:underline">
            Eliminar publicación
          </button>
        </form>
      </div>

      <header>
        <p className="text-xs uppercase tracking-widest text-terracotta">
          {platformLabel(content.platform)} · {spec.label}
        </p>
        <h1 className="mt-1 font-heading text-2xl italic text-navy">
          {content.projects?.name ?? "Sin proyecto"}
        </h1>
      </header>

      <section className="rounded-yakana border border-linen bg-offwhite p-4">
        <h2 className="mb-3 text-sm font-medium text-navy">Estado y fecha</h2>
        <ScheduleForm
          contentId={content.id}
          status={content.status}
          scheduledDate={content.scheduled_date}
        />
      </section>

      <section className="rounded-yakana border border-linen bg-offwhite p-4">
        <h2 className="mb-3 text-sm font-medium text-navy">Imagen para {platformLabel(content.platform)}</h2>
        <ImageComposer
          contentId={content.id}
          format={content.format}
          projectPhotos={photos ?? []}
          watermarkPosition={profile?.watermark_position ?? "bottom-right"}
          watermarkOpacity={profile?.watermark_opacity ?? 0.3}
          existingMedia={content.media_urls ?? []}
        />
      </section>

      <section className="rounded-yakana border border-linen bg-offwhite p-4">
        <h2 className="mb-3 text-sm font-medium text-navy">Texto de la publicación</h2>
        <CaptionGenerator
          contentId={content.id}
          initialCaption={content.caption_es}
          initialHashtags={content.hashtags}
        />
      </section>

      <p className="text-xs text-charcoal/40">
        Plataformas disponibles: {PLATFORMS.map((p) => p.label).join(", ")}.
      </p>
    </div>
  );
}
