import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatMinutes, money } from "@/lib/format";
import { computeProjectCost } from "@/lib/project-cost";
import type { Project, ProjectYarn, WorkSession } from "@/lib/types/project";

export default async function ProjectCostosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: project }, { data: projectYarns }, { data: sessions }, { data: profile }] =
    await Promise.all([
      supabase.from("projects").select("*").eq("id", id).single<Project>(),
      supabase
        .from("project_yarns")
        .select("*, yarns(*)")
        .eq("project_id", id)
        .returns<ProjectYarn[]>(),
      supabase
        .from("work_sessions")
        .select("*")
        .eq("project_id", id)
        .returns<WorkSession[]>(),
      user
        ? supabase
            .from("user_profiles")
            .select("markup_factor")
            .eq("id", user.id)
            .single<{ markup_factor: number | null }>()
        : Promise.resolve({ data: null }),
    ]);

  if (!project) return null;

  const cost = computeProjectCost(
    projectYarns ?? [],
    sessions ?? [],
    project.hourly_rate ?? 0,
    profile?.markup_factor ?? 3.0,
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-yakana border border-linen bg-offwhite p-5">
        <p className="mb-3 text-sm font-medium text-navy">Materiales</p>
        {cost.materialLines.length === 0 ? (
          <p className="text-sm text-charcoal/60">
            No hay lanas vinculadas todavía —{" "}
            <Link href={`/proyectos/${id}`} className="font-medium text-terracotta">
              vinculá alguna en Resumen
            </Link>
            .
          </p>
        ) : (
          <div className="space-y-1.5 text-sm">
            {cost.materialLines.map((line, i) => (
              <div key={i} className="flex justify-between text-charcoal/80">
                <span>
                  {line.name} — {line.quantity} × ${money(line.unitCost)}
                </span>
                <span>${money(line.subtotal)}</span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-3 flex justify-between border-t border-linen pt-2 text-sm font-medium text-navy">
          <span>Subtotal materiales</span>
          <span>${money(cost.materialsTotal)}</span>
        </div>
      </div>

      <div className="rounded-yakana border border-linen bg-offwhite p-5">
        <p className="mb-3 text-sm font-medium text-navy">Mano de obra</p>
        <div className="flex justify-between text-sm text-charcoal/80">
          <span>
            {formatMinutes(cost.totalMinutes)} × ${money(project.hourly_rate ?? 0)}/h
          </span>
          <span>${money(cost.laborTotal)}</span>
        </div>
        {!project.hourly_rate ? (
          <p className="mt-2 text-xs text-charcoal/50">
            No configuraste una tarifa horaria para este proyecto —{" "}
            <Link href={`/proyectos/${id}/editar`} className="font-medium text-terracotta">
              agregala acá
            </Link>
            .
          </p>
        ) : null}
        <div className="mt-3 flex justify-between border-t border-linen pt-2 text-sm font-medium text-navy">
          <span>Subtotal mano de obra</span>
          <span>${money(cost.laborTotal)}</span>
        </div>
      </div>

      <div className="rounded-yakana border border-terracotta/30 bg-terracotta/5 p-5">
        <Row label="Costo total" value={`$${money(cost.totalCost)}`} bold />
        <Row
          label={`Precio sugerido (×${cost.markupFactor})`}
          value={`$${money(cost.suggestedPrice)}`}
          bold
        />
        <Row label="Ganancia estimada" value={`$${money(cost.profit)}`} />
        <Row label="Margen" value={`${cost.margin.toFixed(0)}%`} />
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div
      className={`flex justify-between py-1 text-sm ${bold ? "font-semibold text-navy" : "text-charcoal/80"}`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
