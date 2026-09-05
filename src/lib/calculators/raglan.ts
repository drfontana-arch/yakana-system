import { neckStyleLabel, closureTypeLabel, type ClosureType, type BodyFit } from "@/lib/calculators/raglan-options";

export type RaglanInputs = {
  stitchesPer10cm: number;
  rowsPer10cm: number;
  chestCm: number;
  yokeDepthCm: number;
  bodyLengthCm: number;
  neckCm: number;
  sleeveLengthCm: number;
  sleeveCircumferenceCm: number;
  cuffCircumferenceCm: number;
  underarmEaseCm: number;
  direction: "top_down" | "bottom_up";
};

export type RaglanResults = {
  neckCastOn: number;
  frontStitches: number;
  backStitches: number;
  sleeveStitchesAtNeck: number;
  underarmStitches: number;
  underarmEaseStitches: number;
  totalIncreases: number;
  increaseRounds: number;
  increaseEveryNRows: number;
  yokeRows: number;
  bodyRows: number;
  sleeveInitialStitches: number;
  cuffStitches: number;
  sleeveDecreases: number;
  sleeveDecreaseEveryNRows: number;
  sleeveRows: number;
};

function stitchesFor(cm: number, stitchesPer10cm: number) {
  return Math.round((cm * stitchesPer10cm) / 10);
}

function rowsFor(cm: number, rowsPer10cm: number) {
  return Math.round((cm * rowsPer10cm) / 10);
}

export function calculateRaglan(inputs: RaglanInputs): RaglanResults {
  const {
    stitchesPer10cm,
    rowsPer10cm,
    chestCm,
    yokeDepthCm,
    bodyLengthCm,
    neckCm,
    sleeveLengthCm,
    sleeveCircumferenceCm,
    cuffCircumferenceCm,
    underarmEaseCm,
  } = inputs;

  const neckCastOn = stitchesFor(neckCm, stitchesPer10cm);
  const frontStitches = Math.round(neckCastOn * 0.33);
  const backStitches = Math.round(neckCastOn * 0.33);
  const sleeveStitchesAtNeck = Math.round((neckCastOn - frontStitches - backStitches) / 2);

  const underarmStitches = stitchesFor(chestCm, stitchesPer10cm);
  const underarmEaseStitches = stitchesFor(underarmEaseCm, stitchesPer10cm);
  const sleeveTargetStitches = stitchesFor(sleeveCircumferenceCm, stitchesPer10cm);

  // A raglan increase round adds 2 sts to each of the 4 sections (front,
  // back, and both sleeves) — 8 sts total per round. Solving for how many
  // rounds are needed to grow the whole neck cast-on out to the combined
  // chest + both sleeves circumference ties all three measurements together,
  // instead of only depending on chest (which ignored the sleeve width).
  const totalIncreases = Math.max(
    0,
    underarmStitches + 2 * sleeveTargetStitches - neckCastOn,
  );
  const increaseRounds = Math.max(1, Math.round(totalIncreases / 8));

  const yokeRows = rowsFor(yokeDepthCm, rowsPer10cm);
  const increaseEveryNRows = Math.max(1, Math.floor(yokeRows / increaseRounds));

  const bodyRows = rowsFor(bodyLengthCm, rowsPer10cm);

  const sleeveInitialStitches =
    sleeveStitchesAtNeck + increaseRounds * 2 + underarmEaseStitches;
  const cuffStitches = stitchesFor(cuffCircumferenceCm, stitchesPer10cm);
  const sleeveRows = rowsFor(sleeveLengthCm, rowsPer10cm);
  const sleeveDecreases = Math.max(0, Math.round((sleeveInitialStitches - cuffStitches) / 2));
  const sleeveDecreaseEveryNRows = Math.max(1, Math.floor(sleeveRows / Math.max(1, sleeveDecreases)));

  return {
    neckCastOn,
    frontStitches,
    backStitches,
    sleeveStitchesAtNeck,
    underarmStitches,
    underarmEaseStitches,
    totalIncreases,
    increaseRounds,
    increaseEveryNRows,
    yokeRows,
    bodyRows,
    sleeveInitialStitches,
    cuffStitches,
    sleeveDecreases,
    sleeveDecreaseEveryNRows,
    sleeveRows,
  };
}

function rowWord(n: number) {
  return n === 1 ? "vuelta" : "vueltas";
}

function neckDescription(neckStyle: string) {
  return neckStyleLabel(neckStyle).toLowerCase();
}

const NECKS_NEEDING_MANUAL_SHAPING = new Set(["v_neck", "turtleneck", "boat", "scoop"]);

export function buildRowByRowInstructions(
  inputs: RaglanInputs,
  results: RaglanResults,
  neckStyle: string,
  shortRows: boolean,
  closureType: ClosureType = "pullover",
  bodyFit: BodyFit = "straight",
): string[] {
  const lines: string[] = [];
  const dirLabel = inputs.direction === "top_down" ? "de arriba hacia abajo" : "de abajo hacia arriba";
  const isOpenFront = closureType !== "pullover";
  const placketStitches = isOpenFront ? stitchesFor(2, inputs.stitchesPer10cm) : 0;

  lines.push(`Construcción ${dirLabel}.`);

  if (isOpenFront) {
    lines.push(
      `Es una prenda abierta adelante (${closureTypeLabel(closureType).toLowerCase()}) — a partir de separar las mangas, tejé el cuerpo PLANO (no en redondo), dividiendo el delantero en dos mitades sobre la línea central. Sumá ${placketStitches} p. en cada borde delantero para la ${closureType === "button_placket" ? "botonera" : "cinta de cierre"}.`,
    );
  }

  if (inputs.direction === "top_down") {
    lines.push(`Montá ${results.neckCastOn} puntos para el cuello (${neckDescription(neckStyle)}).`);
    if (shortRows) {
      lines.push("Tejé vueltas cortas para levantar la parte de atrás del cuello antes de unir en redondo.");
    }
    if (NECKS_NEEDING_MANUAL_SHAPING.has(neckStyle)) {
      lines.push(
        `El cuello ${neckDescription(neckStyle)} necesita disminuciones o vueltas adicionales en el delantero que esta calculadora no detalla automáticamente — usá el conteo de puntos como base y ajustá a ojo o con una referencia.`,
      );
    }
    lines.push(
      `Distribuí: ${results.frontStitches} p. delantero, ${results.backStitches} p. espalda, ${results.sleeveStitchesAtNeck} p. cada manga, con 4 marcadores raglán entre secciones.`,
    );
    lines.push(
      `Vuelta de aumento: aumentá 1 punto a cada lado de los 4 marcadores raglán (8 puntos por vuelta de aumento).`,
    );
    lines.push(
      `Repetí la vuelta de aumento cada ${results.increaseEveryNRows} ${rowWord(results.increaseEveryNRows)}, ${results.increaseRounds} veces en total, hasta completar las ${results.yokeRows} vueltas del canesú.`,
    );
    lines.push(
      `Separá las mangas: pasá los puntos de cada manga (${results.sleeveInitialStitches - results.underarmEaseStitches} p.) a hilo auxiliar, montá ${results.underarmEaseStitches} p. nuevos en cada axila para unir delantero y espalda.`,
    );
    lines.push(bodyInstructionLine(results, bodyFit, isOpenFront));
    lines.push(
      `Mangas: retomá los ${results.sleeveInitialStitches} p. de cada manga (incluida la parte del axila), tejé disminuyendo 2 p. cada ${results.sleeveDecreaseEveryNRows} ${rowWord(results.sleeveDecreaseEveryNRows)}, ${results.sleeveDecreases} veces, hasta llegar a ${results.cuffStitches} p. Tejé ${results.sleeveRows} vueltas en total y terminá con el puño.`,
    );
  } else {
    lines.push(bodyInstructionLine(results, bodyFit, isOpenFront, true));
    lines.push(
      `Mangas (tejidas por separado): montá ${results.cuffStitches} p. en el puño, aumentá 2 p. cada ${results.sleeveDecreaseEveryNRows} ${rowWord(results.sleeveDecreaseEveryNRows)}, ${results.sleeveDecreases} veces, hasta ${results.sleeveInitialStitches} p. Tejé ${results.sleeveRows} vueltas en total.`,
    );
    lines.push(
      `Unión: uní cuerpo y las dos mangas en una sola vuelta, dejando ${results.underarmEaseStitches} p. de axila sin tejer (en hilo auxiliar) a cada lado.`,
    );
    lines.push(
      `Canesú: disminuí 8 p. por vuelta (2 p. a cada lado de los 4 marcadores raglán) cada ${results.increaseEveryNRows} ${rowWord(results.increaseEveryNRows)}, ${results.increaseRounds} veces, hasta llegar a ${results.neckCastOn} p.`,
    );
    if (NECKS_NEEDING_MANUAL_SHAPING.has(neckStyle)) {
      lines.push(
        `El cuello ${neckDescription(neckStyle)} necesita disminuciones o vueltas adicionales en el delantero que esta calculadora no detalla automáticamente — usá el conteo de puntos como base y ajustá a ojo o con una referencia.`,
      );
    }
    lines.push(
      `Cerrá o rematá el cuello (${neckDescription(neckStyle)}) con los ${results.neckCastOn} p. restantes.`,
    );
  }

  if (isOpenFront) {
    lines.push(
      `Terminación: levantá puntos a lo largo de cada borde delantero y tejé la ${closureType === "button_placket" ? "botonera con ojales" : closureType === "kimono" ? "tira de cruce" : closureType === "ties" ? "tira para coser los lazos o cordones" : "cinta donde vas a coser el cierre"}.`,
    );
  }

  return lines;
}

function bodyInstructionLine(
  results: RaglanResults,
  bodyFit: BodyFit,
  isOpenFront: boolean,
  isBottomUp = false,
): string {
  const shape = isBottomUp ? "hasta la axila" : "hasta el largo deseado, y terminá con el elástico inferior";
  const knitAs = isOpenFront ? "plano" : "en redondo";

  if (bodyFit === "fitted") {
    const waistStitches = Math.max(1, Math.round(results.underarmStitches * 0.9));
    return `Cuerpo entallado: tejé ${knitAs} disminuyendo hasta ${waistStitches} p. en la cintura (mitad del largo), y volvé a aumentar hasta ${results.underarmStitches} p. hacia la cadera. En total ${results.bodyRows} vueltas ${shape}.`;
  }
  if (bodyFit === "a_line") {
    return `Cuerpo evasé en A: tejé ${knitAs} sobre ${results.underarmStitches} p., aumentando 2 p. cada varias vueltas a medida que avanzás, para que se abra suavemente hacia el ruedo. En total ${results.bodyRows} vueltas ${shape}.`;
  }
  if (bodyFit === "oversize") {
    return `Cuerpo oversize: tejé ${knitAs} sobre ${results.underarmStitches} p. (ya incluye holgura extra) durante ${results.bodyRows} vueltas ${shape}.`;
  }
  return `Cuerpo recto: tejé ${knitAs} sobre ${results.underarmStitches} p. durante ${results.bodyRows} vueltas ${shape}.`;
}

export function calculateYarnMeters(
  results: RaglanResults,
  stitchesPer10cm: number,
  wastePct: number,
): number {
  const stitchLengthCm = (10 / stitchesPer10cm) * 1.5;

  const bodyStitchRows = results.bodyRows * results.underarmStitches;
  const yokeStitchRows = results.yokeRows * ((results.neckCastOn + results.underarmStitches) / 2);
  const sleeveStitchRows =
    results.sleeveRows * ((results.sleeveInitialStitches + results.cuffStitches) / 2) * 2;

  const totalStitchRows = bodyStitchRows + yokeStitchRows + sleeveStitchRows;
  const meters = (totalStitchRows * stitchLengthCm) / 100;

  return meters * (1 + wastePct / 100);
}
