"use client";

import { useState } from "react";
import { Plus, X, Trash2 } from "lucide-react";
import { updateGlobalPalette, deleteGlobalPalette } from "@/lib/actions/palettes";
import type { Palette, PaletteColor } from "@/lib/types/pattern";

export function GlobalPaletteList({ palettes }: { palettes: Palette[] }) {
  if (palettes.length === 0) {
    return (
      <p className="rounded-yakana border border-dashed border-linen bg-offwhite p-6 text-center text-sm text-charcoal/60">
        Todavía no guardaste ninguna paleta global. Extraé una de una foto o generá una con la
        rueda de color, arriba.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {palettes.map((p) => (
        <PaletteCard key={p.id} palette={p} />
      ))}
    </div>
  );
}

function PaletteCard({ palette }: { palette: Palette }) {
  const [name, setName] = useState(palette.name);
  const [colors, setColors] = useState<PaletteColor[]>(palette.colors);
  const [dirty, setDirty] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  function updateColor(index: number, hex: string) {
    setColors((c) => c.map((col, i) => (i === index ? { ...col, hex } : col)));
    setDirty(true);
  }

  function removeColor(index: number) {
    setColors((c) => c.filter((_, i) => i !== index));
    setDirty(true);
  }

  function addColor() {
    if (colors.length >= 10) return;
    setColors((c) => [...c, { hex: "#c49a2a", name: `Color ${c.length + 1}`, yarn_id: null }]);
    setDirty(true);
  }

  async function handleSave() {
    await updateGlobalPalette(palette.id, name, colors);
    setDirty(false);
    setSaveMessage("Guardado ✓");
    setTimeout(() => setSaveMessage(""), 2000);
  }

  return (
    <div className="rounded-yakana border border-linen bg-offwhite p-4">
      <input
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setDirty(true);
        }}
        className="mb-2 w-full bg-transparent font-heading text-lg italic text-navy outline-none"
      />
      <div className="mb-3 flex flex-wrap gap-1.5">
        {colors.map((c, i) => (
          <div key={i} className="group relative">
            <input
              type="color"
              value={c.hex}
              onChange={(e) => updateColor(i, e.target.value)}
              className="h-8 w-8 cursor-pointer rounded border border-linen"
              title={c.hex}
            />
            <button
              type="button"
              onClick={() => removeColor(i)}
              className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-terracotta text-offwhite group-hover:flex"
            >
              <X size={10} />
            </button>
          </div>
        ))}
        {colors.length < 10 ? (
          <button
            type="button"
            onClick={addColor}
            className="flex h-8 w-8 items-center justify-center rounded border border-dashed border-linen text-charcoal/50 hover:border-terracotta hover:text-terracotta"
          >
            <Plus size={14} />
          </button>
        ) : null}
      </div>

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
        <form action={deleteGlobalPalette} className="ml-auto">
          <input type="hidden" name="id" value={palette.id} />
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
