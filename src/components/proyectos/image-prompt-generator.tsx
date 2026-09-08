"use client";

import { useState } from "react";
import { Sparkles, Copy, Check, ExternalLink } from "lucide-react";
import { generateGarmentImagePrompt } from "@/lib/actions/ai";

export function ImagePromptGenerator({ projectId }: { projectId: string }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    setError("");
    const result = await generateGarmentImagePrompt(projectId);
    setLoading(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setPrompt(result.prompt);
    setCopied(false);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("No se pudo copiar automáticamente — seleccioná el texto a mano.");
    }
  }

  return (
    <div className="rounded-yakana border border-dashed border-linen bg-offwhite p-4">
      <h2 className="mb-2 flex items-center gap-2 font-heading text-lg italic text-navy">
        <Sparkles size={18} />
        Prompt para una imagen realista
      </h2>
      <p className="mb-3 text-xs text-charcoal/60">
        Arma un texto listo para pegar en{" "}
        <a
          href="https://gemini.google.com"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-0.5 font-medium text-terracotta hover:underline"
        >
          Gemini <ExternalLink size={11} />
        </a>{" "}
        (u otro generador de imágenes) y pedirle una foto aproximada de cómo va a quedar la
        prenda terminada, con tus medidas, diseño, lanas y colores reales.
      </p>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-yakana border border-navy/30 bg-white px-3 py-1.5 text-xs font-medium text-navy hover:bg-linen disabled:opacity-50"
      >
        <Sparkles size={13} />
        {loading ? "Escribiendo…" : prompt ? "Generar de nuevo" : "Generar prompt"}
      </button>

      {prompt ? (
        <div className="mt-3">
          <textarea
            readOnly
            value={prompt}
            rows={6}
            className="w-full rounded-yakana border border-linen bg-white px-3 py-2 text-xs text-charcoal/80 outline-none focus:border-terracotta"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="mt-2 flex items-center gap-1.5 rounded-yakana bg-terracotta px-3 py-1.5 text-xs font-medium text-offwhite hover:bg-terracotta-dark"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Copiado ✓" : "Copiar prompt"}
          </button>
        </div>
      ) : null}

      {error ? <p className="mt-2 text-xs text-terracotta">{error}</p> : null}
    </div>
  );
}
