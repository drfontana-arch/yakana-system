// Universal-ish knitting chart symbols, worked flat per cell (no multi-column
// cable crossings — those need a whole different chart representation and
// are out of scope for this first version).
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
