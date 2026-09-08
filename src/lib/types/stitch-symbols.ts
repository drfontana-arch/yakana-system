// Universal-ish knitting chart symbols, worked flat per cell. Cable crosses
// are the one exception that spans multiple cells — see the CBL: encoding
// and helpers below.
export type StitchSymbol = "K" | "P" | "YO" | "K2TOG" | "SSK" | "M1" | "NS";

export const STITCH_SYMBOLS: {
  value: StitchSymbol;
  label: string;
  labelPlural: string;
  glyph: string;
}[] = [
  { value: "K", label: "Punto derecho", labelPlural: "puntos derechos", glyph: "" },
  { value: "P", label: "Punto revés", labelPlural: "puntos revés", glyph: "•" },
  { value: "YO", label: "Ojal (hebra)", labelPlural: "ojales", glyph: "○" },
  { value: "K2TOG", label: "2 juntos al derecho", labelPlural: "2 juntos al derecho", glyph: "/" },
  { value: "SSK", label: "2 juntos al derecho invertido", labelPlural: "2 juntos al derecho invertido", glyph: "\\" },
  { value: "M1", label: "Aumento (levantar 1 hebra)", labelPlural: "aumentos", glyph: "▲" },
  { value: "NS", label: "Sin puntada", labelPlural: "sin puntada", glyph: "▨" },
];

export const DEFAULT_STITCH: StitchSymbol = "K";

export function stitchInfo(symbol: string) {
  return STITCH_SYMBOLS.find((s) => s.value === symbol) ?? STITCH_SYMBOLS[0];
}

// Cable crosses span several cells in one row, so a single cell code can't
// describe one on its own. Each cell in the span stores the same direction
// and width plus its own position, e.g. a 4-wide left cross starting at
// column 3 writes "CBL:L:4:0" at col 3, "CBL:L:4:1" at col 4, and so on —
// every cell is self-describing, so reading just one cell (or resizing the
// grid) never leaves an ambiguous fragment.
export type CableDirection = "L" | "R";

export type CableCell = { direction: CableDirection; width: number; index: number };

export function encodeCableCell(direction: CableDirection, width: number, index: number): string {
  return `CBL:${direction}:${width}:${index}`;
}

export function parseCableCell(symbol: string): CableCell | null {
  if (!symbol.startsWith("CBL:")) return null;
  const [, dir, widthStr, indexStr] = symbol.split(":");
  const width = Number(widthStr);
  const index = Number(indexStr);
  if ((dir !== "L" && dir !== "R") || !Number.isFinite(width) || !Number.isFinite(index)) return null;
  return { direction: dir, width, index };
}

export function cableLabel(direction: CableDirection, width: number): string {
  const half = width / 2;
  const side = direction === "L" ? "izquierda" : "derecha";
  return `Trenza ${half} sobre ${half} a la ${side}`;
}

export function cableInstruction(direction: CableDirection, width: number): string {
  const half = width / 2;
  const place = direction === "L" ? "adelante" : "atrás";
  return (
    `Trenza: pasá los primeros ${half} puntos a una aguja auxiliar y dejalos ${place} del ` +
    `trabajo, tejé derechos los siguientes ${half} puntos, y después tejé derechos los ${half} ` +
    `puntos de la aguja auxiliar.`
  );
}
