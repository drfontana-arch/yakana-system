import { PageHeader } from "@/components/ui/page-header";
import { Field } from "@/components/ui/field";
import { LibraryUpload } from "@/components/biblioteca/library-upload";
import { createLibraryEntry } from "@/lib/actions/library";

export default async function NuevaReferenciaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div>
      <PageHeader
        title="Nueva referencia"
        description="Guardá un patrón de otra autora para consultar después."
      />
      <form action={createLibraryEntry} className="max-w-xl space-y-4">
        {params.error ? (
          <p className="rounded-yakana border border-terracotta/30 bg-terracotta/10 px-3 py-2 text-sm text-terracotta">
            {params.error}
          </p>
        ) : null}

        <Field label="Título *" name="title" required placeholder="Nombre del patrón" />
        <Field label="Autora / autor" name="author" placeholder="Quién lo diseñó" />
        <Field label="Link de origen" name="source_url" placeholder="https://..." />
        <Field
          label="Nota de derechos de autor"
          name="copyright_note"
          placeholder="Ej: uso personal, no reproducir ni vender"
        />
        <Field
          label="Etiquetas (separadas por coma)"
          name="tags"
          placeholder="bebé, colorwork, top-down"
        />

        <LibraryUpload />

        <div>
          <label className="mb-1 block text-sm font-medium text-navy" htmlFor="notes">
            Notas personales
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            className="w-full rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
          />
        </div>

        <button
          type="submit"
          className="rounded-yakana bg-terracotta px-5 py-2.5 text-sm font-medium text-offwhite hover:bg-terracotta-dark"
        >
          Guardar referencia
        </button>
      </form>
    </div>
  );
}
