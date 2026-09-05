"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { suggestPatternIdea } from "@/lib/actions/ai";

export function SuggestPanel({ patternId }: { patternId: string }) {
  const [ideas, setIdeas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSuggest() {
    setLoading(true);
    setError("");
    const result = await suggestPatternIdea(patternId);
    setLoading(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setIdeas(result.ideas);
  }

  return (
    <div className="rounded-yakana border border-linen bg-offwhite p-3">
      <button
        type="button"
        onClick={handleSuggest}
        disabled={loading}
        className="flex w-full items-center justify-center gap-1.5 rounded-yakana border border-navy/30 bg-white py-1.5 text-xs font-medium text-navy hover:bg-linen disabled:opacity-50"
      >
        <Sparkles size={13} />
        {loading ? "Pensando…" : "Sugerime una idea"}
      </button>

      {ideas.length > 0 ? (
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-charcoal/80">
          {ideas.map((idea, i) => (
            <li key={i}>{idea}</li>
          ))}
        </ul>
      ) : null}

      {ideas.length > 0 ? (
        <p className="mt-2 text-xs text-charcoal/50">
          Son ideas de una inteligencia artificial, no un dibujo automático — usalas como
          inspiración.
        </p>
      ) : null}

      {error ? <p className="mt-2 text-xs text-terracotta">{error}</p> : null}
    </div>
  );
}
