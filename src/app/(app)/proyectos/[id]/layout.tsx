import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjectTabs } from "@/components/proyectos/project-tabs";
import { StatusSelect } from "@/components/proyectos/status-select";
import { PROJECT_TYPES, type Project } from "@/lib/types/project";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single<Project>();

  if (!project) notFound();

  const typeLabel = PROJECT_TYPES.find((t) => t.value === project.type)?.label;

  return (
    <div>
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-3xl italic text-navy sm:text-4xl">
            {project.name}
          </h1>
          <StatusSelect projectId={project.id} status={project.status} />
        </div>
        <p className="mt-2 text-sm text-charcoal/70">
          {[typeLabel, project.size_label, project.recipient].filter(Boolean).join(" · ") ||
            "Sin detalles todavía"}
        </p>
        <div className="andean-divider mt-4 max-w-xs" />
      </div>

      <ProjectTabs projectId={project.id} />

      {children}
    </div>
  );
}
