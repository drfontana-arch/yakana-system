import { useId } from "react";
import type { GridData, PaletteColor } from "@/lib/types/pattern";

export type GarmentZone =
  | "neck"
  | "yoke"
  | "body"
  | "ribbing"
  | "sleeve_left"
  | "sleeve_right"
  | "cuff_left"
  | "cuff_right";

export const GARMENT_ZONE_LABELS: Record<GarmentZone, string> = {
  neck: "Cuello",
  yoke: "Canesú",
  body: "Cuerpo / espalda",
  ribbing: "Elástico inferior",
  sleeve_left: "Manga izquierda",
  sleeve_right: "Manga derecha",
  cuff_left: "Puño izquierdo",
  cuff_right: "Puño derecho",
};

const NECK_SHAPES: Record<
  string,
  { widthFactor: number; curveDepth: number; isV: boolean; collar: boolean }
> = {
  crew: { widthFactor: 0.45, curveDepth: 10, isV: false, collar: false },
  scoop: { widthFactor: 0.55, curveDepth: 20, isV: false, collar: false },
  boat: { widthFactor: 0.65, curveDepth: 3, isV: false, collar: false },
  v_neck: { widthFactor: 0.45, curveDepth: 0, isV: true, collar: false },
  turtleneck: { widthFactor: 0.45, curveDepth: 10, isV: false, collar: true },
};

export type ZoneFill = {
  gridData: GridData;
  colors: PaletteColor[];
  widthStitches: number;
  heightRows: number;
};

// Size of one stitch cell when a real colorwork chart is tiled into the
// sketch, in SVG user units. It's a visual approximation (the sketch isn't
// drawn at true stitch gauge) rather than a gauge-accurate rendering.
const MOTIF_CELL_PX = 2.5;
// Above this many cells, tiling the motif would mean thousands of <rect>s
// for no visible gain — fall back to a flat fill instead.
const MAX_MOTIF_CELLS = 4000;

export function GarmentSketch({
  chestCm,
  bodyLengthCm,
  yokeDepthCm,
  neckCm,
  sleeveLengthCm,
  sleeveCircumferenceCm,
  cuffCircumferenceCm,
  highlightZone,
  neckStyle = "crew",
  bodyFit = "straight",
  closureType = "pullover",
  zoneFills,
}: {
  chestCm: number;
  bodyLengthCm: number;
  yokeDepthCm: number;
  neckCm: number;
  sleeveLengthCm: number;
  sleeveCircumferenceCm: number;
  cuffCircumferenceCm: number;
  highlightZone?: GarmentZone | null;
  neckStyle?: string;
  bodyFit?: string;
  closureType?: string;
  zoneFills?: Partial<Record<GarmentZone, ZoneFill>>;
}) {
  const uid = useId();
  const scale = 3;
  const pad = 28;
  const ribbingCm = 3;
  const cuffRibbingCm = 3;
  const neckShape = NECK_SHAPES[neckStyle] ?? NECK_SHAPES.crew;
  const isOpenFront = closureType !== "pullover";

  const halfChest = (chestCm / 2) * scale;
  const halfNeck = (neckCm / 2) * scale * neckShape.widthFactor;
  const yokeDepth = yokeDepthCm * scale;
  const bodyLength = bodyLengthCm * scale;
  const ribbing = ribbingCm * scale;
  const sleeveLength = Math.max(1, sleeveLengthCm - cuffRibbingCm) * scale;
  const cuffRibbing = cuffRibbingCm * scale;
  const halfSleeveCirc = (sleeveCircumferenceCm / 2) * scale;
  const halfCuff = (cuffCircumferenceCm / 2) * scale;

  const collarHeight = neckShape.collar ? 16 : 0;
  const svgWidth = 2 * (halfChest + sleeveLength + cuffRibbing) + pad * 2;
  const svgHeight = collarHeight + yokeDepth + bodyLength + ribbing + pad * 2;
  const centerX = svgWidth / 2;
  const topY = pad + collarHeight;
  const underarmY = topY + yokeDepth;
  const hemY = underarmY + bodyLength;

  function motifPatternId(zone: GarmentZone) {
    return `motif-fill-${uid}-${zone}`;
  }

  function usableZoneFill(zone: GarmentZone): ZoneFill | null {
    const zf = zoneFills?.[zone];
    if (!zf) return null;
    if (zf.widthStitches * zf.heightRows > MAX_MOTIF_CELLS) return null;
    return zf;
  }

  function fill(zone: GarmentZone) {
    if (usableZoneFill(zone)) return `url(#${motifPatternId(zone)})`;
    if (!highlightZone) return "var(--yakana-offwhite, #faf7f2)";
    return highlightZone === zone ? "var(--yakana-terracotta, #8b3a2a)" : "var(--yakana-offwhite, #faf7f2)";
  }
  function textColor(zone: GarmentZone) {
    if (usableZoneFill(zone)) return "#faf7f2";
    return highlightZone === zone ? "#faf7f2" : "#1a2744";
  }
  function strokeFor(zone: GarmentZone) {
    return highlightZone === zone
      ? { stroke: "#8b3a2a", strokeWidth: 3 }
      : { stroke: "#1a2744", strokeWidth: 1.5 };
  }
  // Motif colors are unpredictable, so labels over a real chart get a dark
  // outline instead of a flat color, to stay legible against any of them.
  function textProps(zone: GarmentZone) {
    if (usableZoneFill(zone)) {
      return { fill: "#faf7f2", stroke: "#1a2744", strokeWidth: 3, paintOrder: "stroke" as const };
    }
    return { fill: textColor(zone) };
  }

  const filledZones = (
    ["neck", "yoke", "body", "ribbing", "sleeve_left", "sleeve_right", "cuff_left", "cuff_right"] as GarmentZone[]
  )
    .map((zone) => ({ zone, zf: usableZoneFill(zone) }))
    .filter((z): z is { zone: GarmentZone; zf: ZoneFill } => z.zf !== null);

  // Yoke top edge: a plain line for curved necklines, or an actual V notch
  // cut into the polygon for a V-neck (the curve stroke below only applies
  // to the non-V styles, since the notch itself reads as the neckline).
  const vDepth = yokeDepth * 0.55;
  const yokeTopPoints = neckShape.isV
    ? `${centerX - halfNeck},${topY} ${centerX},${topY + vDepth} ${centerX + halfNeck},${topY}`
    : `${centerX - halfNeck},${topY} ${centerX + halfNeck},${topY}`;

  // Body silhouette varies with the chosen fit — same underarm/hem width for
  // "straight" (and "oversize", which instead gets its extra room from a
  // larger chest measurement upstream), a waist taper for "fitted", and a
  // gradual flare for "a_line".
  let bodyPoints: string;
  if (bodyFit === "fitted") {
    const waistHalf = halfChest * 0.86;
    const waistY = underarmY + bodyLength * 0.55;
    bodyPoints = `
      ${centerX - halfChest},${underarmY}
      ${centerX + halfChest},${underarmY}
      ${centerX + waistHalf},${waistY}
      ${centerX + halfChest * 0.94},${hemY}
      ${centerX - halfChest * 0.94},${hemY}
      ${centerX - waistHalf},${waistY}
    `;
  } else if (bodyFit === "a_line") {
    const hemHalf = halfChest * 1.3;
    bodyPoints = `
      ${centerX - halfChest},${underarmY}
      ${centerX + halfChest},${underarmY}
      ${centerX + hemHalf},${hemY}
      ${centerX - hemHalf},${hemY}
    `;
  } else {
    bodyPoints = `
      ${centerX - halfChest},${underarmY}
      ${centerX + halfChest},${underarmY}
      ${centerX + halfChest},${hemY}
      ${centerX - halfChest},${hemY}
    `;
  }
  const hemHalfWidth =
    bodyFit === "a_line" ? halfChest * 1.3 : bodyFit === "fitted" ? halfChest * 0.94 : halfChest;

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className="w-full max-w-md"
      style={{ fontFamily: "sans-serif" }}
    >
      <defs>
        {filledZones.map(({ zone, zf }) => {
          const bgHex = zf.colors[0]?.hex ?? "#faf7f2";
          const tileW = zf.widthStitches * MOTIF_CELL_PX;
          const tileH = zf.heightRows * MOTIF_CELL_PX;
          return (
            <pattern
              key={zone}
              id={motifPatternId(zone)}
              patternUnits="userSpaceOnUse"
              width={tileW}
              height={tileH}
            >
              <rect width={tileW} height={tileH} fill={bgHex} />
              {Object.entries(zf.gridData).map(([key, hex]) => {
                const [col, row] = key.split(",").map(Number);
                return (
                  <rect
                    key={key}
                    x={col * MOTIF_CELL_PX}
                    y={row * MOTIF_CELL_PX}
                    width={MOTIF_CELL_PX}
                    height={MOTIF_CELL_PX}
                    fill={hex}
                  />
                );
              })}
            </pattern>
          );
        })}
        <linearGradient id={`sheen-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.35} />
          <stop offset="45%" stopColor="#ffffff" stopOpacity={0.05} />
          <stop offset="100%" stopColor="#1a2744" stopOpacity={0.12} />
        </linearGradient>
        <filter id={`softShadow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#1a2744" floodOpacity={0.18} />
        </filter>
      </defs>

      {/* Right sleeve */}
      <g filter={`url(#softShadow-${uid})`}>
      <polygon
        points={`
          ${centerX + halfChest},${underarmY - halfSleeveCirc}
          ${centerX + halfChest + sleeveLength},${underarmY - halfCuff}
          ${centerX + halfChest + sleeveLength},${underarmY + halfCuff}
          ${centerX + halfChest},${underarmY + halfSleeveCirc}
        `}
        fill={fill("sleeve_right")}
        {...strokeFor("sleeve_right")}
      />
      {/* Right cuff ribbing */}
      <rect
        x={centerX + halfChest + sleeveLength}
        y={underarmY - halfCuff}
        width={cuffRibbing}
        height={halfCuff * 2}
        fill={fill("cuff_right")}
        {...strokeFor("cuff_right")}
      />

      {/* Left sleeve (mirrored) */}
      <polygon
        points={`
          ${centerX - halfChest},${underarmY - halfSleeveCirc}
          ${centerX - halfChest - sleeveLength},${underarmY - halfCuff}
          ${centerX - halfChest - sleeveLength},${underarmY + halfCuff}
          ${centerX - halfChest},${underarmY + halfSleeveCirc}
        `}
        fill={fill("sleeve_left")}
        {...strokeFor("sleeve_left")}
      />
      {/* Left cuff ribbing */}
      <rect
        x={centerX - halfChest - sleeveLength - cuffRibbing}
        y={underarmY - halfCuff}
        width={cuffRibbing}
        height={halfCuff * 2}
        fill={fill("cuff_left")}
        {...strokeFor("cuff_left")}
      />

      {/* Yoke (top edge dips into a V for a v-neck) */}
      <polygon
        points={`${yokeTopPoints} ${centerX + halfChest},${underarmY} ${centerX - halfChest},${underarmY}`}
        fill={fill("yoke")}
        {...strokeFor("yoke")}
      />

      {/* Neckline curve (crew/scoop/boat) or collar (turtleneck) */}
      {!neckShape.isV ? (
        <path
          d={`M ${centerX - halfNeck} ${topY} Q ${centerX} ${topY + neckShape.curveDepth} ${centerX + halfNeck} ${topY}`}
          fill="none"
          stroke={highlightZone === "neck" ? "#8b3a2a" : "#1a2744"}
          strokeWidth={highlightZone === "neck" ? 4 : 2}
        />
      ) : null}
      {neckShape.collar ? (
        <rect
          x={centerX - halfNeck}
          y={topY - collarHeight}
          width={halfNeck * 2}
          height={collarHeight}
          fill={fill("neck")}
          stroke={highlightZone === "neck" ? "#8b3a2a" : "#1a2744"}
          strokeWidth={highlightZone === "neck" ? 3 : 1.5}
        />
      ) : null}

      {/* Body (straight / fitted / a-line) */}
      <polygon points={bodyPoints} fill={fill("body")} {...strokeFor("body")} />

      {/* Ribbing */}
      <rect
        x={centerX - hemHalfWidth}
        y={hemY}
        width={hemHalfWidth * 2}
        height={ribbing}
        fill={fill("ribbing")}
        {...strokeFor("ribbing")}
      />
      </g>

      {/* Soft top-lit sheen over every shape, for a bit of volume instead of
          a flat silhouette — same shapes redrawn with no stroke, blended on
          top rather than replacing the real fill underneath. */}
      <g style={{ mixBlendMode: "overlay" }} pointerEvents="none">
        <polygon
          points={`
            ${centerX + halfChest},${underarmY - halfSleeveCirc}
            ${centerX + halfChest + sleeveLength},${underarmY - halfCuff}
            ${centerX + halfChest + sleeveLength},${underarmY + halfCuff}
            ${centerX + halfChest},${underarmY + halfSleeveCirc}
          `}
          fill={`url(#sheen-${uid})`}
        />
        <polygon
          points={`
            ${centerX - halfChest},${underarmY - halfSleeveCirc}
            ${centerX - halfChest - sleeveLength},${underarmY - halfCuff}
            ${centerX - halfChest - sleeveLength},${underarmY + halfCuff}
            ${centerX - halfChest},${underarmY + halfSleeveCirc}
          `}
          fill={`url(#sheen-${uid})`}
        />
        <polygon
          points={`${yokeTopPoints} ${centerX + halfChest},${underarmY} ${centerX - halfChest},${underarmY}`}
          fill={`url(#sheen-${uid})`}
        />
        <polygon points={bodyPoints} fill={`url(#sheen-${uid})`} />
        <rect
          x={centerX - hemHalfWidth}
          y={hemY}
          width={hemHalfWidth * 2}
          height={ribbing}
          fill={`url(#sheen-${uid})`}
        />
      </g>

      {/* Center-front opening, for cardigans/vests/zip styles */}
      {isOpenFront ? (
        <line
          x1={centerX}
          y1={topY}
          x2={centerX}
          y2={hemY + ribbing}
          stroke="#1a2744"
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />
      ) : null}

      {/* Labels */}
      <text x={centerX} y={topY - collarHeight - 8} textAnchor="middle" fontSize={9} fill="#1a2744">
        Cuello
      </text>
      <text
        x={centerX}
        y={(topY + underarmY) / 2}
        textAnchor="middle"
        fontSize={9}
        {...textProps("yoke")}
      >
        Canesú
      </text>
      <text
        x={centerX}
        y={(underarmY + hemY) / 2}
        textAnchor="middle"
        fontSize={9}
        {...textProps("body")}
      >
        Cuerpo / espalda
      </text>
      <text x={centerX} y={hemY + ribbing / 2 + 3} textAnchor="middle" fontSize={8} {...textProps("ribbing")}>
        Elástico
      </text>
      <text
        x={centerX + halfChest + sleeveLength / 2}
        y={underarmY - 6}
        textAnchor="middle"
        fontSize={8}
        {...textProps("sleeve_right")}
      >
        Manga
      </text>
      <text
        x={centerX - halfChest - sleeveLength / 2}
        y={underarmY - 6}
        textAnchor="middle"
        fontSize={8}
        {...textProps("sleeve_left")}
      >
        Manga
      </text>
      <text
        x={centerX + halfChest + sleeveLength + cuffRibbing / 2}
        y={underarmY + halfCuff + 12}
        textAnchor="middle"
        fontSize={7}
        {...textProps("cuff_right")}
      >
        Puño
      </text>
      <text
        x={centerX - halfChest - sleeveLength - cuffRibbing / 2}
        y={underarmY + halfCuff + 12}
        textAnchor="middle"
        fontSize={7}
        {...textProps("cuff_left")}
      >
        Puño
      </text>
    </svg>
  );
}
