import { PageHeader } from "@/components/ui/page-header";
import { ProjectForm } from "@/components/proyectos/project-form";
import { createProject } from "@/lib/actions/projects";
import { createClient } from "@/lib/supabase/server";

export default async function NuevoProyectoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("user_profiles")
        .select("default_hourly_rate")
        .eq("id", user.id)
        .single<{ default_hourly_rate: number | null }>()
    : { data: null };

  return (
    <div>
      <PageHeader title="Nuevo proyecto" description="Empezá a registrar una prenda nueva." />
      <ProjectForm
        action={createProject}
        errorMessage={params.error}
        defaultHourlyRate={profile?.default_hourly_rate}
      />
    </div>
  );
}
