"use client";

import { useState } from "react";
import Image from "next/image";

const POSITIONS = [
  { value: "top-left", label: "Arriba a la izquierda" },
  { value: "top-right", label: "Arriba a la derecha" },
  { value: "bottom-left", label: "Abajo a la izquierda" },
  { value: "bottom-right", label: "Abajo a la derecha" },
] as const;

const POSITION_STYLES: Record<string, string> = {
  "top-left": "top-3 left-3",
  "top-right": "top-3 right-3",
  "bottom-left": "bottom-3 left-3",
  "bottom-right": "bottom-3 right-3",
};

export function WatermarkPreview({
  initialPosition,
  initialOpacity,
}: {
  initialPosition: string;
  initialOpacity: number;
}) {
  const [position, setPosition] = useState(initialPosition);
  const [opacity, setOpacity] = useState(initialOpacity);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-sm font-medium text-navy" htmlFor="watermark_position">
          Posición
        </label>
        <select
          id="watermark_position"
          name="watermark_position"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className="mb-4 w-full rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
        >
          {POSITIONS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>

        <label className="mb-1 block text-sm font-medium text-navy" htmlFor="watermark_opacity">
          Opacidad ({Math.round(opacity * 100)}%)
        </label>
        <input
          id="watermark_opacity"
          name="watermark_opacity"
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={opacity}
          onChange={(e) => setOpacity(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <p className="mb-1 text-sm font-medium text-navy">Vista previa</p>
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-yakana border border-linen bg-linen/30">
          <div
            className={`absolute h-16 w-16 ${POSITION_STYLES[position]}`}
            style={{ opacity }}
          >
            <Image
              src="/brand/yakana-logo.png"
              alt="Marca de agua"
              fill
              className="rounded-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
