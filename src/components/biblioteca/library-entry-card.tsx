"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FileText, Pencil, Sparkles, Trash2 } from "lucide-react";
import {
  updateLibraryEntry,
  deleteLibraryEntry,
  analyzeLibraryPatternImage,
} from "@/lib/actions/library";
import { isPdfUrl } from "@/lib/types/library";
import type { LibraryEntry } from "@/lib/types/library";

export function LibraryEntryCard({
  entry,
  viewUrl,
  own = false,
}: {
  entry: LibraryEntry & { patterns?: { name: string } | null };
  viewUrl: string | null;
  own?: boolean;
}) {
  const [title, setTitle] = useState(entry.title);
  const [author, setAuthor] = useState(entry.author ?? "");
  const [sourceUrl, setSourceUrl] = useState(entry.source_url ?? "");
  const [copyrightNote, setCopyrightNote] = useState(entry.copyright_note ?? "");
  const [tags, setTags] = useState(entry.tags?.join(", ") ?? "");
  const [notes, setNotes] = useState(entry.notes ?? "");
  const [dirty, setDirty] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");

  const updateWithId = updateLibraryEntry.bind(null, entry.id);
  const canAnalyze = !!viewUrl && !isPdfUrl(viewUrl);

  async function handleAnalyze() {
    setAnalyzing(true);
    setAnalyzeError("");
    const result = await analyzeLibraryPatternImage(entry.id);
    setAnalyzing(false);
    if ("error" in result) {
      setAnalyzeError(result.error);
      return;
    }
    markDirty(setNotes)(result.notes);
  }

  function markDirty<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setDirty(true);
    };
  }

  async function handleSave() {
    const formData = new FormData();
    formData.set("title", title);
    formData.set("author", author);
    formData.set("source_url", sourceUrl);
    formData.set("copyright_note", copyrightNote);
    formData.set("tags", tags);
    formData.set("notes", notes);
    await updateWithId(formData);
    setDirty(false);
    setSaveMessage("Guardado ✓");
    setTimeout(() => setSaveMessage(""), 2000);
  }

  return (
    <div className="rounded-yakana border border-linen bg-offwhite p-4">
      {viewUrl ? (
        isPdfUrl(viewUrl) ? (
          <a
            href={viewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-3 flex h-32 items-center justify-center gap-2 rounded-yakana border border-linen bg-white text-sm text-navy hover:bg-linen"
          >
            <FileText size={18} />
            Abrir PDF
          </a>
        ) : (
          <a href={viewUrl} target="_blank" rel="noopener noreferrer">
            <div className="relative mb-3 h-32 w-full overflow-hidden rounded-yakana border border-linen bg-white">
              <Image src={viewUrl} alt={title} fill unoptimized className="object-contain" />
            </div>
          </a>
        )
      ) : own ? (
        <div className="mb-3 flex h-32 items-center justify-center rounded-yakana border border-linen bg-white text-xs text-charcoal/40">
          Sin vista previa
        </div>
      ) : null}

      <input
        value={title}
        onChange={(e) => markDirty(setTitle)(e.target.value)}
        className="mb-2 w-full bg-transparent font-heading text-lg italic text-navy outline-none"
      />

      {own && entry.pattern_id ? (
        <Link
          href={`/estudio/${entry.pattern_id}`}
          className="mb-2 flex items-center gap-1 text-xs font-medium text-terracotta hover:underline"
        >
          <Pencil size={12} />
          Abrir en el editor
        </Link>
      ) : (
        <>
          <input
            value={author}
            onChange={(e) => markDirty(setAuthor)(e.target.value)}
            placeholder="Autora / autor"
            className="mb-1.5 w-full rounded border border-linen bg-white px-2 py-1 text-xs outline-none focus:border-terracotta"
          />
          <input
            value={sourceUrl}
            onChange={(e) => markDirty(setSourceUrl)(e.target.value)}
            placeholder="Link de origen"
            className="mb-1.5 w-full rounded border border-linen bg-white px-2 py-1 text-xs outline-none focus:border-terracotta"
          />
          <input
            value={copyrightNote}
            onChange={(e) => markDirty(setCopyrightNote)(e.target.value)}
            placeholder="Nota de derechos de autor"
            className="mb-1.5 w-full rounded border border-linen bg-white px-2 py-1 text-xs outline-none focus:border-terracotta"
          />
        </>
      )}

      <input
        value={tags}
        onChange={(e) => markDirty(setTags)(e.target.value)}
        placeholder="Etiquetas (separadas por coma)"
        className="mb-1.5 w-full rounded border border-linen bg-white px-2 py-1 text-xs outline-none focus:border-terracotta"
      />
      <textarea
        value={notes}
        onChange={(e) => markDirty(setNotes)(e.target.value)}
        placeholder="Notas personales"
        rows={2}
        className="mb-1.5 w-full rounded border border-linen bg-white px-2 py-1 text-xs outline-none focus:border-terracotta"
      />

      {canAnalyze ? (
        <div className="mb-2">
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={analyzing}
            className="flex items-center gap-1 rounded-yakana border border-terracotta px-2.5 py-1 text-xs font-medium text-terracotta hover:bg-terracotta/10 disabled:opacity-50"
          >
            <Sparkles size={12} />
            {analyzing ? "Analizando..." : "Analizar con IA"}
          </button>
          {analyzeError ? <p className="mt-1 text-xs text-terracotta">{analyzeError}</p> : null}
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        {dirty ? (
          <button
            type="button"
            onClick={handleSave}
            className="rounded-yakana bg-terracotta px-3 py-1.5 text-xs font-medium text-offwhite hover:bg-terracotta-dark"
          >
            Guardar cambios
          </button>
        ) : null}
        <span className="text-xs text-olive">{saveMessage}</span>
        <form action={deleteLibraryEntry} className="ml-auto">
          <input type="hidden" name="id" value={entry.id} />
          <button
            type="submit"
            className="flex items-center gap-1 text-xs text-charcoal/50 hover:text-terracotta"
          >
            <Trash2 size={12} />
            Eliminar
          </button>
        </form>
      </div>
    </div>
  );
}
