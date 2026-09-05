"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Repeat } from "lucide-react";
import { generateTiledPattern } from "@/lib/actions/patterns";
import { regionSize, type RepeatRegion } from "@/lib/estudio/repeat-tile";

export function RepeatPanel({
  patternId,
  patternName,
  repeatRegion,
  projectId,
  garmentZone,
  suggestedWidth,
  onRemoveRegion,
}: {
  patternId: string;
  patternName: string;
  repeatRegion: RepeatRegion;
  projectId: string | null;
  garmentZone: string | null;
  suggestedWidth: number | null;
  onRemoveRegion: () => void;
}) {
  const router = useRouter();
  const motif = regionSize(repeatRegion);

  const [targetWidth, setTargetWidth] = useState(suggestedWidth ?? motif.width * 4);
  const [targetHeight, setTargetHeight] = useState(motif.height);
  const [name, setName] = useState(`${patternName} (repetido)`);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function handleQuitar() {
    if (!window.confirm("¿Quitar la región de repetición marcada?")) return;
    onRemoveRegion();
  }

  async function handleGenerate() {
    setError("");
    setBusy(true);
    const result = await generateTiledPattern(
      patternId,
      Math.max(1, Math.round(targetWidth)),
      Math.max(1, Math.round(targetHeight)),
      name.trim() || `${patternName} (repetido)`,
      projectId,
      garmentZone,
    );
    setBusy(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    router.push(`/estudio/${result.id}`);
  }

  const widthRepeats = (targetWidth / motif.width).toFixed(1);
  const heightRepeats = (targetHeight / motif.height).toFixed(1);

  return (
    <div className="rounded-yakana border border-linen bg-offwhite p-3">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-charcoal/60">
        <Repeat size={14} />
        Repetición en cadena
      </p>
      <p className="mb-2 text-xs text-charcoal/70">
        Tu motivo marcado mide {motif.width} × {motif.height} puntos. Elegí el ancho total (en
        puntos) de la parte de la prenda donde querés que se repita, y armo un gráfico nuevo con
        el motivo encadenado — se acopla sin costura, como se teje en redondo.
      </p>

      {suggestedWidth ? (
        <button
          type="button"
          onClick={() => setTargetWidth(suggestedWidth)}
          className="mb-2 rounded-yakana border border-terracotta/40 px-2.5 py-1 text-xs font-medium text-terracotta hover:bg-terracotta/10"
        >
          Usar ancho de esta zona ({suggestedWidth} p.)
        </button>
      ) : null}

      <div className="mb-2 grid grid-cols-2 gap-2">
        <label className="text-xs font-medium text-navy">
          Ancho total (puntos)
          <input
            type="number"
            min={motif.width}
            value={targetWidth}
            onChange={(e) => setTargetWidth(Number(e.target.value))}
            className="mt-1 w-full rounded-yakana border border-linen bg-white px-2 py-1 text-sm outline-none focus:border-terracotta"
          />
        </label>
        <label className="text-xs font-medium text-navy">
          Alto total (vueltas)
          <input
            type="number"
            min={motif.height}
            value={targetHeight}
            onChange={(e) => setTargetHeight(Number(e.target.value))}
            className="mt-1 w-full rounded-yakana border border-linen bg-white px-2 py-1 text-sm outline-none focus:border-terracotta"
          />
        </label>
      </div>

      <p className="mb-2 text-xs text-charcoal/50">
        Se repite {widthRepeats} veces a lo ancho y {heightRepeats} veces a lo alto.
      </p>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre del gráfico repetido"
        className="mb-2 w-full rounded-yakana border border-linen bg-white px-2 py-1 text-sm outline-none focus:border-terracotta"
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={busy}
          className="flex-1 rounded-yakana bg-terracotta px-3 py-1.5 text-xs font-medium text-offwhite hover:bg-terracotta-dark disabled:opacity-50"
        >
          {busy ? "Generando…" : "Generar gráfico repetido"}
        </button>
        <button
          type="button"
          onClick={handleQuitar}
          className="rounded-yakana border border-linen bg-white px-3 py-1.5 text-xs text-charcoal/60 hover:bg-linen"
        >
          Quitar región
        </button>
      </div>

      {error ? <p className="mt-2 text-xs text-terracotta">{error}</p> : null}
    </div>
  );
}
