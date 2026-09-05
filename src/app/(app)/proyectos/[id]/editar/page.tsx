import { notFound } from "next/navigation";
import { ProjectForm } from "@/components/proyectos/project-form";
import { createClient } from "@/lib/supabase/server";
import { updateProject, deleteProject } from "@/lib/actions/projects";
import type { Project } from "@/lib/types/project";

export default async function EditarProyectoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single<Project>();

  if (!project) notFound();

  const updateWithId = updateProject.bind(null, id);

  return (
    <div>
      <ProjectForm project={project} action={updateWithId} errorMessage={error} />

      <form action={deleteProject} className="mt-6">
        <input type="hidden" name="id" value={project.id} />
        <button
          type="submit"
          className="rounded-yakana border border-terracotta/40 px-4 py-2 text-sm font-medium text-terracotta transition-colors hover:bg-terracotta/10"
        >
          Eliminar proyecto
        </button>
      </form>
    </div>
  );
}
