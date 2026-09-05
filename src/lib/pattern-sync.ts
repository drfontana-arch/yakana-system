export type ZoneSync = {
  sectionRows: number;
  chartRows: number;
  repeats: number;
  remainderRows: number;
  fits: boolean;
};

const CHARTABLE_ZONES = new Set(["yoke", "body", "sleeve_left", "sleeve_right"]);

export function isChartableZone(zone: string | null): boolean {
  return !!zone && CHARTABLE_ZONES.has(zone);
}

function zoneRowCount(zone: string, results: Record<string, number>): number | null {
  switch (zone) {
    case "yoke":
      return results.yokeRows ?? null;
    case "body":
      return results.bodyRows ?? null;
    case "sleeve_left":
    case "sleeve_right":
      return results.sleeveRows ?? null;
    default:
      return null;
  }
}

// Zones whose stitch count stays constant along their length, so a motif can
// be tiled to fill the full round without the shaping shifting it out of place.
// The yoke is excluded on purpose — its width grows every increase round.
export function zoneStitchCount(zone: string, results: Record<string, number>): number | null {
  switch (zone) {
    case "body":
      return results.underarmStitches ?? null;
    case "sleeve_left":
    case "sleeve_right":
      return results.sleeveInitialStitches ?? null;
    case "cuff_left":
    case "cuff_right":
      return results.cuffStitches ?? null;
    case "neck":
      return results.neckCastOn ?? null;
    default:
      return null;
  }
}

export function computeZoneSync(
  zone: string,
  results: Record<string, number>,
  chartRows: number,
): ZoneSync | null {
  const sectionRows = zoneRowCount(zone, results);
  if (sectionRows == null || !chartRows) return null;

  const repeats = Math.floor(sectionRows / chartRows);
  const remainderRows = sectionRows - repeats * chartRows;

  return { sectionRows, chartRows, repeats, remainderRows, fits: chartRows <= sectionRows };
}

export function syncGuidanceText(sync: ZoneSync, patternName: string): string {
  if (!sync.fits) {
    return `El gráfico "${patternName}" tiene ${sync.chartRows} filas, pero este tramo solo tiene ${sync.sectionRows} vueltas — no entra completo. Achicá el gráfico en el Estudio o extendé el tramo.`;
  }
  if (sync.remainderRows === 0) {
    return `Empezá el gráfico "${patternName}" en la fila 1 y repetilo ${sync.repeats} ${sync.repeats === 1 ? "vez" : "veces"} seguidas hasta completar las ${sync.sectionRows} vueltas de este tramo.`;
  }
  return `Empezá el gráfico "${patternName}" en la fila 1. Repetilo ${sync.repeats} ${sync.repeats === 1 ? "vez" : "veces"} completas y después tejé ${sync.remainderRows} fila${sync.remainderRows === 1 ? "" : "s"} más (desde la fila 1 del gráfico) para completar las ${sync.sectionRows} vueltas de este tramo.`;
}

// Which instruction line each zone's chart callout should be inserted after —
// matched by a distinctive substring already present in buildRowByRowInstructions.
const ZONE_LINE_MARKERS: Record<string, string> = {
  yoke: "vueltas del canesú",
  body: "Cuerpo",
  sleeve_left: "Mangas",
  sleeve_right: "Mangas",
};

export type InstructionItem = { text: string; callouts: string[] };

export function buildAnnotatedInstructions(
  instructions: string[],
  calloutsByZone: Record<string, string[]>,
): InstructionItem[] {
  return instructions.map((text) => {
    const callouts: string[] = [];
    for (const [zone, marker] of Object.entries(ZONE_LINE_MARKERS)) {
      if (!calloutsByZone[zone]) continue;
      const matches =
        zone === "body" ? text.startsWith(marker) : text.includes(marker);
      if (matches) callouts.push(...calloutsByZone[zone]);
    }
    return { text, callouts };
  });
}
