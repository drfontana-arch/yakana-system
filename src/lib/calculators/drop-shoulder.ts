import { neckStyleLabel, closureTypeLabel, type ClosureType, type BodyFit } from "@/lib/calculators/raglan-options";

export type WorkingMethod = "circular" | "flat";

// Drop-shoulder construction: the body is worked straight (no shaping at
// all) from the underarm up to the shoulder line, and the sleeve is set in
// with a straight seam instead of a shaped cap — that's what makes the
// shoulder seam sit past the actual shoulder ("dropped"). Bottom-up only:
// the top-down version of this construction is rare enough that it's out
// of scope for now.
export type DropShoulderInputs = {
  stitchesPer10cm: number;
  rowsPer10cm: number;
  chestCm: number;
  bodyLengthCm: number; // hem to underarm
  armholeDepthCm: number; // underarm to shoulder, worked straight
  neckCm: number;
  sleeveLengthCm: number;
  sleeveCircumferenceCm: number; // upper arm, at the top of the sleeve
  cuffCircumferenceCm: number;
  underarmEaseCm: number;
  workingMethod?: WorkingMethod;
};

export type DropShoulderResults = {
  bodyStitches: number;
  bodyRows: number;
  armholeRows: number;
  neckStitches: number;
  shoulderStitchesEachSide: number;
  cuffStitches: number;
  sleeveTargetStitches: number;
  sleeveIncreases: number;
  sleeveIncreaseEveryNRows: number;
  sleeveRows: number;
};

function stitchesFor(cm: number, stitchesPer10cm: number) {
  return Math.round((cm * stitchesPer10cm) / 10);
}

function rowsFor(cm: number, rowsPer10cm: number) {
  return Math.round((cm * rowsPer10cm) / 10);
}

export function calculateDropShoulder(inputs: DropShoulderInputs): DropShoulderResults {
  const {
    stitchesPer10cm,
    rowsPer10cm,
    chestCm,
    bodyLengthCm,
    armholeDepthCm,
    neckCm,
    sleeveLengthCm,
    sleeveCircumferenceCm,
    cuffCircumferenceCm,
    underarmEaseCm,
  } = inputs;

  const bodyStitches = stitchesFor(chestCm + underarmEaseCm, stitchesPer10cm);
  const bodyRows = rowsFor(bodyLengthCm, rowsPer10cm);
  const armholeRows = rowsFor(armholeDepthCm, rowsPer10cm);

  // The neck circumference is a 3D measurement around the neck; the flat
  // opening left at the shoulder line (front + back combined) runs roughly
  // half of that — same kind of approximation the raglan calculator makes
  // for its neck cast-on split.
  const neckStitches = Math.round(stitchesFor(neckCm, stitchesPer10cm) * 0.5);
  const shoulderStitchesEachSide = Math.max(0, Math.round((bodyStitches - neckStitches) / 2));

  const sleeveTargetStitches = stitchesFor(sleeveCircumferenceCm, stitchesPer10cm);
  const cuffStitches = stitchesFor(cuffCircumferenceCm, stitchesPer10cm);
  const sleeveRows = rowsFor(sleeveLengthCm, rowsPer10cm);
  const sleeveIncreases = Math.max(0, Math.round((sleeveTargetStitches - cuffStitches) / 2));
  // Working flat means an increase can only happen on a right-side row —
  // every 2nd row — so round the interval up to the nearest even number.
  const rawInterval = Math.floor(sleeveRows / Math.max(1, sleeveIncreases));
  const sleeveIncreaseEveryNRows =
    inputs.workingMethod === "flat"
      ? Math.max(2, rawInterval % 2 === 0 ? rawInterval : rawInterval + 1)
      : Math.max(1, rawInterval);

  return {
    bodyStitches,
    bodyRows,
    armholeRows,
    neckStitches,
    shoulderStitchesEachSide,
    cuffStitches,
    sleeveTargetStitches,
    sleeveIncreases,
    sleeveIncreaseEveryNRows,
    sleeveRows,
  };
}

function rowWord(n: number) {
  return n === 1 ? "vuelta" : "vueltas";
}

const NECKS_NEEDING_MANUAL_SHAPING = new Set(["v_neck", "turtleneck", "boat", "scoop"]);

function bodyFitLine(results: DropShoulderResults, bodyFit: BodyFit, knitAs: string): string {
  if (bodyFit === "fitted") {
    const waistStitches = Math.max(1, Math.round(results.bodyStitches * 0.9));
    return `Cuerpo entallado: montá ${results.bodyStitches} p. y tejé ${knitAs} disminuyendo hasta ${waistStitches} p. en la cintura (mitad del largo), y volvé a aumentar hasta ${results.bodyStitches} p. hacia la axila. En total ${results.bodyRows} vueltas hasta la axila.`;
  }
  if (bodyFit === "a_line") {
    const hemStitches = Math.round(results.bodyStitches * 1.15);
    return `Cuerpo evasé en A: montá ${hemStitches} p. y tejé ${knitAs} disminuyendo gradualmente hasta ${results.bodyStitches} p. en la axila, a lo largo de ${results.bodyRows} vueltas.`;
  }
  if (bodyFit === "oversize") {
    return `Cuerpo oversize: montá ${results.bodyStitches} p. (ya incluye holgura extra) y tejé ${knitAs} derecho durante ${results.bodyRows} vueltas hasta la axila.`;
  }
  return `Cuerpo recto: montá ${results.bodyStitches} p. y tejé ${knitAs} derecho durante ${results.bodyRows} vueltas hasta la axila.`;
}

export function buildDropShoulderInstructions(
  results: DropShoulderResults,
  neckStyle: string,
  closureType: ClosureType = "pullover",
  bodyFit: BodyFit = "straight",
  workingMethod: WorkingMethod = "circular",
): string[] {
  const lines: string[] = [];
  const isOpenFront = closureType !== "pullover";
  const isFlatMethod = workingMethod === "flat";
  const isFlat = isOpenFront || isFlatMethod;
  const knitAs = isFlat ? "plano" : "en redondo";

  lines.push(
    `Construcción de abajo hacia arriba, hombro caído (sin canesú ni disminuciones de sisa), con agujas ${isFlat ? "rectas (tejido plano)" : "circulares (en redondo)"}.`,
  );

  if (isOpenFront) {
    lines.push(
      `Es una prenda abierta adelante (${closureTypeLabel(closureType).toLowerCase()}) — tejé el cuerpo plano, en dos mitades delanteras separadas por la línea central, en vez de en redondo.`,
    );
  } else if (isFlatMethod) {
    lines.push(
      "Elegiste tejido plano: no unas en redondo — tejé de ida y vuelta (una vuelta al derecho, la siguiente al revés), y cerrá con una costura lateral de axila a ruedo al terminar.",
    );
  }

  lines.push(bodyFitLine(results, bodyFit, knitAs));
  lines.push(
    `Seguí tejiendo derecho, sin ninguna disminución, ${results.armholeRows} ${rowWord(results.armholeRows)} más hasta el hombro — esto es lo que hace que quede "caído": no hay ninguna sisa curva, solo una costura recta.`,
  );

  const neckDesc = neckStyleLabel(neckStyle).toLowerCase();
  lines.push(
    `En la última vuelta, dejá en espera o cerrá los ${results.neckStitches} p. centrales para el cuello (${neckDesc}), y cerrá (o injertá con costura) los ${results.shoulderStitchesEachSide} p. de cada hombro.`,
  );
  if (NECKS_NEEDING_MANUAL_SHAPING.has(neckStyle)) {
    lines.push(
      `El cuello ${neckDesc} necesita disminuciones o vueltas adicionales en el delantero que esta calculadora no detalla automáticamente — usá el conteo de puntos como base y ajustá a ojo o con una referencia.`,
    );
  }

  lines.push(
    `Mangas (tejidas por separado): montá ${results.cuffStitches} p. en el puño, aumentá 2 p. cada ${results.sleeveIncreaseEveryNRows} ${rowWord(results.sleeveIncreaseEveryNRows)}, ${results.sleeveIncreases} veces, hasta llegar a ${results.sleeveTargetStitches} p. Tejé ${results.sleeveRows} vueltas en total y cerrá derecho.`,
  );
  lines.push(
    `Unión: cosé el borde recto de arriba de cada manga contra el hueco de la sisa del cuerpo (${results.armholeRows} ${rowWord(results.armholeRows)} de alto). Si el borde de la manga no coincide exacto en cantidad de vueltas, repartí la diferencia a lo largo de toda la costura en vez de juntarla en una punta.`,
  );

  if (isOpenFront) {
    lines.push(
      `Terminación: levantá puntos a lo largo de cada borde delantero y tejé la ${closureType === "button_placket" ? "botonera con ojales" : closureType === "kimono" ? "tira de cruce" : closureType === "ties" ? "tira para coser los lazos o cordones" : "cinta donde vas a coser el cierre"}.`,
    );
  }

  return lines;
}

export function calculateDropShoulderYarnMeters(
  results: DropShoulderResults,
  stitchesPer10cm: number,
  wastePct: number,
): number {
  const stitchLengthCm = (10 / stitchesPer10cm) * 1.5;

  const bodyStitchRows = (results.bodyRows + results.armholeRows) * results.bodyStitches;
  const sleeveStitchRows =
    results.sleeveRows * ((results.sleeveTargetStitches + results.cuffStitches) / 2) * 2;

  const totalStitchRows = bodyStitchRows + sleeveStitchRows;
  const meters = (totalStitchRows * stitchLengthCm) / 100;

  return meters * (1 + wastePct / 100);
}
