import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { createClient } from "@/lib/supabase/server";
import { createContent } from "@/lib/actions/content";
import { ContentCalendar } from "@/components/contenido/content-calendar";
import { PLATFORMS, FORMATS, platformLabel, statusLabel } from "@/lib/types/content";
import type { SocialContent } from "@/lib/types/content";
import type { Project } from "@/lib/types/project";

export default async function ContenidoPage() {
  const supabase = await createClient();

  const [{ data: content }, { data: projects }] = await Promise.all([
    supabase
      .from("social_content")
      .select("*, projects(name)")
      .order("scheduled_date", { ascending: true, nullsFirst: false })
      .returns<SocialContent[]>(),
    supabase
      .from("projects")
      .select("id, name")
      .order("name")
      .returns<Pick<Project, "id" | "name">[]>(),
  ]);

  const drafts = (content ?? []).filter((c) => c.status === "draft");
  const scheduled = (content ?? []).filter((c) => c.status !== "draft");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contenido"
        description="Estudio de contenido para redes sociales: Instagram, TikTok y Pinterest."
      />

      {!projects || projects.length === 0 ? (
        <p className="rounded-yakana border border-dashed border-linen bg-offwhite p-4 text-sm text-charcoal/60">
          Creá primero un proyecto para poder armar contenido sobre él.
        </p>
      ) : (
        <>
          <ContentCalendar items={content ?? []} />

          <section className="rounded-yakana border border-dashed border-linen bg-offwhite p-4">
            <h2 className="mb-3 font-heading text-lg italic text-navy">Nueva publicación</h2>
            <form action={createContent} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <select
                name="project_id"
                required
                defaultValue=""
                className="rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
              >
                <option value="" disabled>
                  Proyecto
                </option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <select
                name="platform"
                defaultValue="instagram"
                className="rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
              >
                {PLATFORMS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              <select
                name="format"
                defaultValue="square"
                className="rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
              >
                {FORMATS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                name="hook_text"
                placeholder="Idea / gancho (opcional)"
                className="rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
              />
              <button
                type="submit"
                className="rounded-yakana bg-terracotta px-4 py-2 text-sm font-medium text-offwhite hover:bg-terracotta-dark"
              >
                Crear
              </button>
            </form>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-lg italic text-navy">Borradores</h2>
            {drafts.length === 0 ? (
              <p className="text-sm text-charcoal/60">No hay borradores sin programar.</p>
            ) : (
              <ContentList items={drafts} />
            )}
          </section>

          <section>
            <h2 className="mb-3 font-heading text-lg italic text-navy">Programadas y publicadas</h2>
            {scheduled.length === 0 ? (
              <p className="text-sm text-charcoal/60">Todavía no programaste ninguna publicación.</p>
            ) : (
              <ContentList items={scheduled} />
            )}
          </section>
        </>
      )}
    </div>
  );
}

function ContentList({ items }: { items: SocialContent[] }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/contenido/${item.id}`}
          className="flex flex-wrap items-center justify-between gap-2 rounded-yakana border border-linen bg-offwhite p-3 text-sm hover:border-terracotta"
        >
          <div>
            <p className="font-medium text-navy">{item.projects?.name ?? "Sin proyecto"}</p>
            <p className="text-xs text-charcoal/60">
              {platformLabel(item.platform)} · {statusLabel(item.status)}
              {item.scheduled_date ? ` · ${new Date(item.scheduled_date + "T00:00:00").toLocaleDateString("es-AR")}` : ""}
            </p>
          </div>
          <span className="text-xs text-charcoal/50">
            {item.caption_es ? "Con texto" : "Sin texto todavía"}
          </span>
        </Link>
      ))}
    </div>
  );
}
