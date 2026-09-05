import type { GridData } from "@/lib/types/pattern";

export type RepeatRegion = { x1: number; y1: number; x2: number; y2: number };

export function normalizeRegion(
  a: { col: number; row: number },
  b: { col: number; row: number },
): RepeatRegion {
  return {
    x1: Math.min(a.col, b.col),
    y1: Math.min(a.row, b.row),
    x2: Math.max(a.col, b.col),
    y2: Math.max(a.row, b.row),
  };
}

export function regionSize(region: RepeatRegion): { width: number; height: number } {
  return { width: region.x2 - region.x1 + 1, height: region.y2 - region.y1 + 1 };
}

// Tiles the motif inside `region` across a canvas of targetWidth x targetHeight,
// wrapping with modulo so the repeat is seamless at the edges — matching how a
// motif actually behaves when knit in the round, with no visible seam.
export function tileGrid(
  sourceGrid: GridData,
  region: RepeatRegion,
  targetWidth: number,
  targetHeight: number,
): GridData {
  const { width: motifW, height: motifH } = regionSize(region);
  const next: GridData = {};
  for (let row = 0; row < targetHeight; row++) {
    const motifRow = region.y1 + (row % motifH);
    for (let col = 0; col < targetWidth; col++) {
      const motifCol = region.x1 + (col % motifW);
      const hex = sourceGrid[`${motifCol},${motifRow}`];
      if (hex) next[`${col},${row}`] = hex;
    }
  }
  return next;
}
