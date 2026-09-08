import { stitchInfo, DEFAULT_STITCH, parseCableCell, cableInstruction } from "@/lib/types/stitch-symbols";
import type { GridData } from "@/lib/types/pattern";

const REPEATED_OPERATIONS = new Set(["K2TOG", "SSK", "M1"]);

function phraseFor(symbol: string, count: number): string {
  const info = stitchInfo(symbol);
  if (REPEATED_OPERATIONS.has(symbol) && count > 1) {
    return `${info.label.toLowerCase()} (repetir ${count} veces)`;
  }
  return `${count} ${count === 1 ? info.label.toLowerCase() : info.labelPlural}`;
}

// Reads the chart bottom-to-top (row 1 = cast-on edge, matching the grid's
// own ruler numbering) and run-length-encodes each row into a compact
// instruction line — the same thing a knitter does by eye when reading a
// symbol chart.
export function buildStitchRowInstructions(
  gridData: GridData,
  width: number,
  height: number,
): string[] {
  const lines: string[] = [];

  for (let i = 0; i < height; i++) {
    const row = height - 1 - i;
    const symbols: string[] = [];
    for (let col = 0; col < width; col++) {
      symbols.push(gridData[`${col},${row}`] ?? DEFAULT_STITCH);
    }

    const parts: string[] = [];
    let start = 0;
    while (start < symbols.length) {
      const cable = parseCableCell(symbols[start]);
      if (cable) {
        // Only the span's first cell emits the instruction — the rest are
        // just the same cable's remaining cells, already accounted for.
        if (cable.index === 0) parts.push(cableInstruction(cable.direction, cable.width));
        start += 1;
        continue;
      }
      let end = start;
      while (end < symbols.length && symbols[end] === symbols[start]) end++;
      parts.push(phraseFor(symbols[start], end - start));
      start = end;
    }

    lines.push(`Vuelta ${i + 1}: ${parts.join(", ")}.`);
  }

  return lines;
}
