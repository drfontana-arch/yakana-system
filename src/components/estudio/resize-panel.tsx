"use client";

import { Plus, Minus } from "lucide-react";

export function ResizePanel({
  width,
  height,
  onAddRow,
  onRemoveRow,
  onAddColumn,
  onRemoveColumn,
}: {
  width: number;
  height: number;
  onAddRow: (edge: "top" | "bottom") => void;
  onRemoveRow: (edge: "top" | "bottom") => void;
  onAddColumn: (edge: "left" | "right") => void;
  onRemoveColumn: (edge: "left" | "right") => void;
}) {
  return (
    <div className="rounded-yakana border border-linen bg-offwhite p-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-charcoal/60">
        Tamaño de la grilla ({width} × {height})
      </p>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
        <span className="text-charcoal/60">Vueltas arriba</span>
        <div className="flex gap-1">
          <IconButton onClick={() => onAddRow("top")} icon={Plus} title="Agregar vuelta arriba" />
          <IconButton onClick={() => onRemoveRow("top")} icon={Minus} title="Quitar vuelta de arriba" />
        </div>

        <span className="text-charcoal/60">Vueltas abajo</span>
        <div className="flex gap-1">
          <IconButton onClick={() => onAddRow("bottom")} icon={Plus} title="Agregar vuelta abajo" />
          <IconButton onClick={() => onRemoveRow("bottom")} icon={Minus} title="Quitar vuelta de abajo" />
        </div>

        <span className="text-charcoal/60">Puntos izquierda</span>
        <div className="flex gap-1">
          <IconButton onClick={() => onAddColumn("left")} icon={Plus} title="Agregar punto a la izquierda" />
          <IconButton onClick={() => onRemoveColumn("left")} icon={Minus} title="Quitar punto de la izquierda" />
        </div>

        <span className="text-charcoal/60">Puntos derecha</span>
        <div className="flex gap-1">
          <IconButton onClick={() => onAddColumn("right")} icon={Plus} title="Agregar punto a la derecha" />
          <IconButton onClick={() => onRemoveColumn("right")} icon={Minus} title="Quitar punto de la derecha" />
        </div>
      </div>
    </div>
  );
}

function IconButton({
  onClick,
  icon: Icon,
  title,
}: {
  onClick: () => void;
  icon: typeof Plus;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="flex h-6 w-6 items-center justify-center rounded border border-linen bg-white text-navy hover:bg-linen"
    >
      <Icon size={12} />
    </button>
  );
}
