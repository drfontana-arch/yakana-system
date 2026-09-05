import { createClient } from "@/lib/supabase/server";
import { TimerWidget } from "@/components/proyectos/timer-widget";
import { addManualSession, deleteWorkSession } from "@/lib/actions/work-sessions";
import { formatMinutes } from "@/lib/format";
import type { WorkSession } from "@/lib/types/project";

export default async function ProjectTiempoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: sessions } = await supabase
    .from("work_sessions")
    .select("*")
    .eq("project_id", id)
    .order("started_at", { ascending: false })
    .returns<WorkSession[]>();

  const totalMinutes = (sessions ?? []).reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0);
  const addManualSessionWithId = addManualSession.bind(null, id);

  return (
    <div className="space-y-6">
      <TimerWidget projectId={id} />

      <div className="rounded-yakana border border-linen bg-offwhite p-4">
        <p className="text-xs uppercase tracking-wide text-charcoal/60">Total registrado</p>
        <p className="mt-1 font-heading text-2xl text-navy">{formatMinutes(totalMinutes)}</p>
      </div>

      <details className="rounded-yakana border border-linen bg-offwhite p-4">
        <summary className="cursor-pointer text-sm font-medium text-navy">
          Cargar una sesión pasada manualmente
        </summary>
        <form action={addManualSessionWithId} className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-navy" htmlFor="date">
              Fecha
            </label>
            <input
              id="date"
              name="date"
              type="date"
              required
              className="rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-navy" htmlFor="hours">
              Horas
            </label>
            <input
              id="hours"
              name="hours"
              type="number"
              min="0"
              defaultValue={0}
              className="w-20 rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-navy" htmlFor="minutes">
              Minutos
            </label>
            <input
              id="minutes"
              name="minutes"
              type="number"
              min="0"
              max="59"
              defaultValue={0}
              className="w-20 rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
            />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="mb-1 block text-xs font-medium text-navy" htmlFor="session_notes">
              Nota
            </label>
            <input
              id="session_notes"
              name="notes"
              className="w-full rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
            />
          </div>
          <button
            type="submit"
            className="rounded-yakana bg-terracotta px-4 py-2 text-sm font-medium text-offwhite hover:bg-terracotta-dark"
          >
            Agregar
          </button>
        </form>
      </details>

      <div>
        <h2 className="mb-3 font-heading text-xl italic text-navy">Sesiones</h2>
        {!sessions || sessions.length === 0 ? (
          <p className="text-sm text-charcoal/60">Todavía no hay sesiones registradas.</p>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-yakana border border-linen bg-offwhite p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-navy">
                    {new Date(s.started_at).toLocaleDateString("es-AR")} ·{" "}
                    {formatMinutes(s.duration_minutes ?? 0)}
                  </p>
                  {s.notes ? (
                    <p className="truncate text-xs text-charcoal/60">{s.notes}</p>
                  ) : null}
                </div>
                <form action={deleteWorkSession}>
                  <input type="hidden" name="project_id" value={id} />
                  <input type="hidden" name="id" value={s.id} />
                  <button
                    type="submit"
                    className="text-xs font-medium text-terracotta hover:underline"
                  >
                    Borrar
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
