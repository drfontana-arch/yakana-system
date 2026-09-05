"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { generateCaption } from "@/lib/actions/ai";
import { updateContentText } from "@/lib/actions/content";
import { TONES, type ContentTone } from "@/lib/types/content";

export function CaptionGenerator({
  contentId,
  initialCaption,
  initialHashtags,
}: {
  contentId: string;
  initialCaption: string | null;
  initialHashtags: string[] | null;
}) {
  const router = useRouter();
  const [tone, setTone] = useState<ContentTone>("inspirational");
  const [caption, setCaption] = useState(initialCaption ?? "");
  const [hashtags, setHashtags] = useState<string[]>(initialHashtags ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  async function handleGenerate() {
    setLoading(true);
    setError("");
    const result = await generateCaption(contentId, tone);
    setLoading(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setCaption(result.caption);
    setHashtags(result.hashtags);
    router.refresh();
  }

  async function handleSaveEdits() {
    await updateContentText(contentId, { caption_es: caption, hashtags });
    setSaveMessage("Guardado ✓");
    setTimeout(() => setSaveMessage(""), 2000);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={tone}
          onChange={(e) => setTone(e.target.value as ContentTone)}
          className="rounded-yakana border border-linen bg-white px-2 py-1.5 text-xs outline-none focus:border-terracotta"
        >
          {TONES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-yakana border border-navy/30 bg-white px-3 py-1.5 text-xs font-medium text-navy hover:bg-linen disabled:opacity-50"
        >
          <Sparkles size={13} />
          {loading ? "Escribiendo…" : caption ? "Generar de nuevo" : "Generar con IA"}
        </button>
      </div>

      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        rows={6}
        placeholder="El texto de la publicación va a aparecer acá — podés editarlo después de generarlo."
        className="w-full rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
      />

      <input
        value={hashtags.join(" ")}
        onChange={(e) => setHashtags(e.target.value.split(/\s+/).filter(Boolean))}
        placeholder="#hashtags"
        className="w-full rounded-yakana border border-linen bg-white px-3 py-2 text-xs text-charcoal/70 outline-none focus:border-terracotta"
      />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSaveEdits}
          className="rounded-yakana border border-linen bg-white px-3 py-1.5 text-xs font-medium text-navy hover:bg-linen"
        >
          Guardar texto
        </button>
        <span className="text-xs text-olive">{saveMessage}</span>
      </div>

      {error ? <p className="text-xs text-terracotta">{error}</p> : null}
    </div>
  );
}
