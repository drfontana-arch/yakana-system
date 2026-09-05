import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { createClient } from "@/lib/supabase/server";
import { PROJECT_STATUSES, PROJECT_TYPES, type Project } from "@/lib/types/project";

const STATUS_STYLES: Record<string, string> = {
  idea: "bg-linen text-charcoal",
  in_progress: "bg-gold/20 text-navy",
  paused: "bg-linen text-charcoal/70",
  completed: "bg-olive/20 text-olive",
  frogged: "bg-terracotta/15 text-terracotta",
};

export default async function ProyectosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string }>;
}) {
  const { status, type } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("projects").select("*");
  if (status) query = query.eq("status", status);
  if (type) query = query.eq("type", type);
  query = query.order("updated_at", { ascending: false });

  const { data: projects } = await query.returns<Project[]>();

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Proyectos"
          description="Cada prenda: muestra, lanas usadas, tiempo, notas, fotos y costos."
        />
        <Link
          href="/proyectos/nuevo"
          className="flex items-center gap-2 rounded-yakana bg-terracotta px-4 py-2.5 text-sm font-medium text-offwhite transition-colors hover:bg-terracotta-dark"
        >
          <Plus size={18} />
          Nuevo proyecto
        </Link>
      </div>

      <form className="mb-6 flex flex-wrap gap-3" method="get">
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
        >
          <option value="">Todos los estados</option>
          {PROJECT_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          name="type"
          defaultValue={type ?? ""}
          className="rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
        >
          <option value="">Todos los tipos</option>
          {PROJECT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-yakana border border-linen bg-offwhite px-4 py-2 text-sm font-medium text-navy hover:bg-linen"
        >
          Filtrar
        </button>
      </form>

      {!projects || projects.length === 0 ? (
        <div className="rounded-yakana border border-dashed border-linen bg-offwhite p-8 text-center text-sm text-charcoal/70">
          Todavía no cargaste ningún proyecto.{" "}
          <Link href="/proyectos/nuevo" className="font-medium text-terracotta">
            Creá el primero
          </Link>
          .
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const statusLabel = PROJECT_STATUSES.find((s) => s.value === project.status)?.label;
            const typeLabel = PROJECT_TYPES.find((t) => t.value === project.type)?.label;
            return (
              <Link
                key={project.id}
                href={`/proyectos/${project.id}`}
                className="rounded-yakana border border-linen bg-offwhite p-4 transition-colors hover:border-terracotta"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <p className="font-heading text-lg italic text-navy">{project.name}</p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[project.status] ?? "bg-linen text-charcoal"}`}
                  >
                    {statusLabel ?? project.status}
                  </span>
                </div>
                <p className="text-xs text-charcoal/60">
                  {[typeLabel, project.size_label, project.recipient].filter(Boolean).join(" · ") ||
                    "Sin detalles todavía"}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
