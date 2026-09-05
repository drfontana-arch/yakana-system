import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { LibraryEntryCard } from "@/components/biblioteca/library-entry-card";
import { createClient } from "@/lib/supabase/server";
import type { LibraryEntry } from "@/lib/types/library";

export default async function BibliotecaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("pattern_library").select("*, patterns(name)");
  if (q) {
    query = query.or(`title.ilike.%${q}%,author.ilike.%${q}%`);
  }
  query = query.order("created_at", { ascending: false });

  const { data: entries } = await query.returns<
    (LibraryEntry & { patterns: { name: string } | null })[]
  >();

  const withUrls = await Promise.all(
    (entries ?? []).map(async (entry) => {
      if (!entry.file_url) return { ...entry, viewUrl: null };
      const { data } = await supabase.storage
        .from("pattern-library")
        .createSignedUrl(entry.file_url, 3600);
      return { ...entry, viewUrl: data?.signedUrl ?? null };
    }),
  );

  const ownEntries = withUrls.filter((e) => e.pattern_id);
  const referenceEntries = withUrls.filter((e) => !e.pattern_id);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Biblioteca"
          description="Patrones de referencia importados y patrones propios publicados."
        />
        <Link
          href="/biblioteca/nueva"
          className="flex items-center gap-2 rounded-yakana bg-terracotta px-4 py-2.5 text-sm font-medium text-offwhite transition-colors hover:bg-terracotta-dark"
        >
          <Plus size={18} />
          Nueva referencia
        </Link>
      </div>

      <form className="mb-6" method="get">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Buscar por título o autora..."
          className="w-full max-w-md rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
        />
      </form>

      <h2 className="mb-3 font-heading text-xl italic text-navy">
        Patrones propios publicados ({ownEntries.length})
      </h2>
      {ownEntries.length === 0 ? (
        <p className="mb-8 text-sm text-charcoal/60">
          Todavía no publicaste ningún patrón del Estudio a la biblioteca.
        </p>
      ) : (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ownEntries.map((entry) => (
            <LibraryEntryCard key={entry.id} entry={entry} viewUrl={entry.viewUrl} own />
          ))}
        </div>
      )}

      <h2 className="mb-3 font-heading text-xl italic text-navy">
        Patrones de referencia ({referenceEntries.length})
      </h2>
      {referenceEntries.length === 0 ? (
        <p className="rounded-yakana border border-dashed border-linen bg-offwhite p-6 text-center text-sm text-charcoal/60">
          Todavía no guardaste ningún patrón de referencia.{" "}
          <Link href="/biblioteca/nueva" className="font-medium text-terracotta">
            Agregá el primero
          </Link>
          .
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {referenceEntries.map((entry) => (
            <LibraryEntryCard key={entry.id} entry={entry} viewUrl={entry.viewUrl} />
          ))}
        </div>
      )}
    </div>
  );
}
