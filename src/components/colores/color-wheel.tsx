"use client";

import { useState } from "react";
import { Palette as PaletteIcon } from "lucide-react";
import {
  generateHarmony,
  seasonalPalette,
  colorTemperature,
  HARMONY_LABELS,
  SEASON_LABELS,
  type HarmonyType,
  type Season,
} from "@/lib/color/harmony";
import { createGlobalPalette } from "@/lib/actions/palettes";
import type { PaletteColor } from "@/lib/types/pattern";

export function ColorWheel() {
  const [baseColor, setBaseColor] = useState("#8b3a2a");
  const [mode, setMode] = useState<"harmony" | "season">("harmony");
  const [harmonyType, setHarmonyType] = useState<HarmonyType>("complementary");
  const [season, setSeason] = useState<Season>("autumn");
  const [paletteName, setPaletteName] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  const colors =
    mode === "harmony" ? generateHarmony(baseColor, harmonyType) : seasonalPalette(baseColor, season);
  const temperature = colorTemperature(baseColor);

  async function handleSave() {
    if (!paletteName.trim()) return;
    const paletteColors: PaletteColor[] = colors.map((hex, i) => ({
      hex,
      name: `Color ${i + 1}`,
      yarn_id: null,
    }));
    await createGlobalPalette(paletteName.trim(), paletteColors);
    setSaveMessage("Paleta guardada ✓");
    setPaletteName("");
    setTimeout(() => setSaveMessage(""), 2500);
  }

  return (
    <section className="rounded-yakana border border-linen bg-offwhite p-4">
      <h2 className="mb-3 flex items-center gap-2 font-heading text-lg italic text-navy">
        <PaletteIcon size={18} />
        Rueda de color
      </h2>

      <div className="mb-3 flex items-center gap-3">
        <input
          type="color"
          value={baseColor}
          onChange={(e) => setBaseColor(e.target.value)}
          className="h-10 w-14 cursor-pointer rounded border border-linen"
        />
        <div className="text-sm">
          <p className="font-medium text-navy">{baseColor}</p>
          <p className="text-xs text-charcoal/60">
            Color {temperature === "warm" ? "cálido" : "frío"}
          </p>
        </div>
      </div>

      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => setMode("harmony")}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            mode === "harmony" ? "bg-terracotta text-offwhite" : "border border-linen bg-white text-navy"
          }`}
        >
          Armonía
        </button>
        <button
          type="button"
          onClick={() => setMode("season")}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            mode === "season" ? "bg-terracotta text-offwhite" : "border border-linen bg-white text-navy"
          }`}
        >
          Temporada
        </button>
      </div>

      {mode === "harmony" ? (
        <select
          value={harmonyType}
          onChange={(e) => setHarmonyType(e.target.value as HarmonyType)}
          className="mb-3 w-full rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
        >
          {(Object.keys(HARMONY_LABELS) as HarmonyType[]).map((h) => (
            <option key={h} value={h}>
              {HARMONY_LABELS[h]}
            </option>
          ))}
        </select>
      ) : (
        <select
          value={season}
          onChange={(e) => setSeason(e.target.value as Season)}
          className="mb-3 w-full rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
        >
          {(Object.keys(SEASON_LABELS) as Season[]).map((s) => (
            <option key={s} value={s}>
              {SEASON_LABELS[s]}
            </option>
          ))}
        </select>
      )}

      <div className="mb-3 flex gap-2">
        {colors.map((hex, i) => (
          <div key={i} className="text-center">
            <div
              className="h-12 w-12 rounded-yakana border border-linen"
              style={{ backgroundColor: hex }}
            />
            <p className="mt-1 text-[10px] text-charcoal/50">{hex}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          value={paletteName}
          onChange={(e) => setPaletteName(e.target.value)}
          placeholder="Nombre de la paleta"
          className="flex-1 rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={!paletteName.trim()}
          className="rounded-yakana bg-terracotta px-4 py-2 text-sm font-medium text-offwhite hover:bg-terracotta-dark disabled:opacity-50"
        >
          Guardar paleta
        </button>
      </div>
      <span className="mt-1 block text-xs text-olive">{saveMessage}</span>
    </section>
  );
}
