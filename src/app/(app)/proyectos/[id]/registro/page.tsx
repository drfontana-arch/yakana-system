import { createClient } from "@/lib/supabase/server";
import { addProjectNote, deleteProjectNote } from "@/lib/actions/project-notes";
import { NOTE_TYPES, type ProjectNote } from "@/lib/types/project";

export default async function ProjectRegistroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: notes } = await supabase
    .from("project_notes")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false })
    .returns<ProjectNote[]>();

  const addNoteWithId = addProjectNote.bind(null, id);

  return (
    <div className="space-y-6">
      <form
        action={addNoteWithId}
        className="rounded-yakana border border-linen bg-offwhite p-4"
      >
        <div className="mb-3 flex flex-wrap gap-2">
          {NOTE_TYPES.map((t, i) => (
            <label
              key={t.value}
              className="flex cursor-pointer items-center gap-1.5 rounded-full border border-linen bg-white px-3 py-1.5 text-sm has-[:checked]:border-terracotta has-[:checked]:bg-terracotta/10"
            >
              <input
                type="radio"
                name="type"
                value={t.value}
                defaultChecked={i === 0}
                className="sr-only"
              />
              <span>{t.icon}</span>
              {t.label}
            </label>
          ))}
        </div>
        <textarea
          name="content"
          required
          rows={3}
          placeholder="Escribí tu nota, corrección o hito..."
          className="w-full rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
        />
        <button
          type="submit"
          className="mt-3 rounded-yakana bg-terracotta px-4 py-2 text-sm font-medium text-offwhite hover:bg-terracotta-dark"
        >
          Agregar al registro
        </button>
      </form>

      {!notes || notes.length === 0 ? (
        <p className="text-sm text-charcoal/60">Todavía no hay entradas en el registro.</p>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => {
            const meta = NOTE_TYPES.find((t) => t.value === note.type);
            return (
              <div
                key={note.id}
                className="flex items-start gap-3 rounded-yakana border border-linen bg-offwhite p-4"
              >
                <span className="text-lg">{meta?.icon ?? "📝"}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-terracotta">
                      {meta?.label ?? note.type}
                    </span>
                    <span className="text-xs text-charcoal/50">
                      {new Date(note.created_at).toLocaleString("es-AR")}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-charcoal/80">
                    {note.content}
                  </p>
                </div>
                <form action={deleteProjectNote}>
                  <input type="hidden" name="project_id" value={id} />
                  <input type="hidden" name="id" value={note.id} />
                  <button
                    type="submit"
                    className="text-xs font-medium text-terracotta hover:underline"
                  >
                    Borrar
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
