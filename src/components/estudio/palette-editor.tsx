"use client";

import { useRef } from "react";
import { Plus, X } from "lucide-react";
import clsx from "clsx";
import type { PaletteColor } from "@/lib/types/pattern";

export function PaletteEditor({
  colors,
  activeColor,
  onSelectColor,
  onChangeColors,
  onRecolor,
}: {
  colors: PaletteColor[];
  activeColor: string;
  onSelectColor: (hex: string) => void;
  onChangeColors: (colors: PaletteColor[]) => void;
  onRecolor: (oldHex: string, newHex: string, index: number) => void;
}) {
  const pickerRefs = useRef<Record<number, HTMLInputElement | null>>({});

  function updateColor(index: number, patch: Partial<PaletteColor>) {
    if (patch.hex && patch.hex !== colors[index].hex) {
      onRecolor(colors[index].hex, patch.hex, index);
      return;
    }
    const next = colors.map((c, i) => (i === index ? { ...c, ...patch } : c));
    onChangeColors(next);
  }

  function addColor() {
    if (colors.length >= 10) return;
    const next = [...colors, { hex: "#c49a2a", name: `Color ${colors.length}`, yarn_id: null }];
    onChangeColors(next);
    onSelectColor(next[next.length - 1].hex);
  }

  function removeColor(index: number) {
    if (colors.length <= 1) return;
    onChangeColors(colors.filter((_, i) => i !== index));
  }

  return (
    <div className="rounded-yakana border border-linen bg-offwhite p-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-charcoal/60">
        Paleta ({colors.length}/10)
      </p>
      <div className="space-y-1.5">
        {colors.map((color, i) => (
          <div
            key={i}
            className={clsx(
              "flex items-center gap-2 rounded-yakana border px-1.5 py-1",
              activeColor === color.hex ? "border-terracotta" : "border-transparent",
            )}
          >
            <button
              type="button"
              onClick={() => onSelectColor(color.hex)}
              className="h-6 w-6 shrink-0 rounded border border-linen"
              style={{ backgroundColor: color.hex }}
              title="Usar este color"
            />
            <input
              ref={(el) => {
                pickerRefs.current[i] = el;
              }}
              type="color"
              value={color.hex}
              onChange={(e) => updateColor(i, { hex: e.target.value })}
              className="sr-only"
            />
            <button
              type="button"
              onClick={() => pickerRefs.current[i]?.click()}
              className="text-xs text-charcoal/50 hover:text-terracotta"
              title="Cambiar color"
            >
              ✎
            </button>
            <input
              value={color.name}
              onChange={(e) => updateColor(i, { name: e.target.value })}
              className="w-20 flex-1 bg-transparent text-xs text-charcoal/80 outline-none"
            />
            {colors.length > 1 ? (
              <button
                type="button"
                onClick={() => removeColor(i)}
                className="text-charcoal/40 hover:text-terracotta"
                title="Quitar color"
              >
                <X size={13} />
              </button>
            ) : null}
          </div>
        ))}
      </div>
      {colors.length < 10 ? (
        <button
          type="button"
          onClick={addColor}
          className="mt-2 flex w-full items-center justify-center gap-1 rounded-yakana border border-dashed border-linen py-1.5 text-xs text-charcoal/60 hover:border-terracotta hover:text-terracotta"
        >
          <Plus size={13} />
          Agregar color
        </button>
      ) : null}
    </div>
  );
}
