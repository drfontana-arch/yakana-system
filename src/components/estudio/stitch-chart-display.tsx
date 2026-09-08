import {
  STITCH_SYMBOLS,
  DEFAULT_STITCH,
  stitchInfo,
  parseCableCell,
  cableLabel,
} from "@/lib/types/stitch-symbols";
import type { GridData } from "@/lib/types/pattern";

const MAX_CELLS_FOR_FULL_CHART = 6000;
const CELL_BG = "#faf7f2";
const NS_BG = "#d8d0bd";
const CABLE_BG = "#efe6d4";

// Read-only, printable version of the stitch-symbol grid — mirrors what the
// interactive canvas editor draws, as plain SVG so it can live in a static
// document (and print cleanly).
export function StitchChartDisplay({
  gridData,
  width,
  height,
  cellSize = 20,
}: {
  gridData: GridData;
  width: number;
  height: number;
  cellSize?: number;
}) {
  if (width * height > MAX_CELLS_FOR_FULL_CHART) {
    return (
      <p className="text-xs text-charcoal/50">
        Este diagrama es muy grande para mostrarlo completo acá — abrilo en el Diagrama para verlo
        entero.
      </p>
    );
  }

  const rulerSize = Math.max(16, Math.round(cellSize * 0.8));
  const fontSize = Math.min(9, cellSize * 0.5);
  const svgWidth = width * cellSize + rulerSize;
  const svgHeight = height * cellSize + rulerSize;

  const cableGlyphs: React.ReactNode[] = [];
  for (const [key, symbol] of Object.entries(gridData)) {
    const cable = parseCableCell(symbol);
    if (!cable || cable.index !== 0) continue;
    const [col, row] = key.split(",").map(Number);
    const x0 = rulerSize + col * cellSize;
    const y0 = rulerSize + row * cellSize;
    const spanW = cable.width * cellSize;
    const midX = x0 + spanW / 2;
    const midY = y0 + cellSize / 2;
    const topY = y0 + cellSize * 0.2;
    const botY = y0 + cellSize * 0.8;
    const leftX = x0 + cellSize * 0.15;
    const rightX = x0 + spanW - cellSize * 0.15;
    const gapSize = cellSize * 0.35;
    const frontFromLeft = cable.direction === "L";

    function segment(fromX: number, fromY: number, toX: number, toY: number, gap: boolean, k: string) {
      if (!gap) {
        return <line key={k} x1={fromX} y1={fromY} x2={toX} y2={toY} stroke="#8b3a2a" strokeWidth={Math.max(1.5, cellSize * 0.12)} strokeLinecap="round" />;
      }
      const dx = toX - fromX;
      const dy = toY - fromY;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      return (
        <g key={k}>
          <line x1={fromX} y1={fromY} x2={midX - (ux * gapSize) / 2} y2={midY - (uy * gapSize) / 2} stroke="#8b3a2a" strokeWidth={Math.max(1.5, cellSize * 0.12)} strokeLinecap="round" />
          <line x1={midX + (ux * gapSize) / 2} y1={midY + (uy * gapSize) / 2} x2={toX} y2={toY} stroke="#8b3a2a" strokeWidth={Math.max(1.5, cellSize * 0.12)} strokeLinecap="round" />
        </g>
      );
    }

    cableGlyphs.push(segment(leftX, topY, rightX, botY, !frontFromLeft, `${key}-a`));
    cableGlyphs.push(segment(rightX, topY, leftX, botY, frontFromLeft, `${key}-b`));
  }

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full" style={{ maxWidth: svgWidth }}>
      <rect x={0} y={0} width={svgWidth} height={rulerSize} fill="#e8e0d0" />
      <rect x={0} y={0} width={rulerSize} height={svgHeight} fill="#e8e0d0" />
      {Array.from({ length: width }, (_, col) => (
        <text key={`c${col}`} x={rulerSize + col * cellSize + cellSize / 2} y={rulerSize / 2} textAnchor="middle" dominantBaseline="middle" fontSize={fontSize} fill="#2c2c2c">
          {col + 1}
        </text>
      ))}
      {Array.from({ length: height }, (_, row) => (
        <text key={`r${row}`} x={rulerSize / 2} y={rulerSize + row * cellSize + cellSize / 2} textAnchor="middle" dominantBaseline="middle" fontSize={fontSize} fill="#2c2c2c">
          {height - row}
        </text>
      ))}
      {Array.from({ length: height }, (_, row) =>
        Array.from({ length: width }, (_, col) => {
          const symbol = gridData[`${col},${row}`] ?? DEFAULT_STITCH;
          const cable = parseCableCell(symbol);
          const x = rulerSize + col * cellSize;
          const y = rulerSize + row * cellSize;
          const fill = symbol === "NS" ? NS_BG : cable ? CABLE_BG : CELL_BG;
          const glyph = !cable && symbol !== "K" ? stitchInfo(symbol).glyph : "";
          return (
            <g key={`${col},${row}`}>
              <rect x={x} y={y} width={cellSize} height={cellSize} fill={fill} stroke="#c8b89a" strokeWidth={0.5} />
              {glyph ? (
                <text x={x + cellSize / 2} y={y + cellSize / 2} textAnchor="middle" dominantBaseline="middle" fontSize={Math.round(cellSize * 0.6)} fill="#2c3e50">
                  {glyph}
                </text>
              ) : null}
            </g>
          );
        }),
      )}
      {cableGlyphs}
    </svg>
  );
}

export function StitchChartLegend({ gridData }: { gridData: GridData }) {
  const usedSymbols = new Set<string>();
  const usedCables = new Set<string>();
  for (const symbol of Object.values(gridData)) {
    const cable = parseCableCell(symbol);
    if (cable) usedCables.add(`${cable.direction}:${cable.width}`);
    else usedSymbols.add(symbol);
  }

  const entries = STITCH_SYMBOLS.filter((s) => s.value !== "K" && usedSymbols.has(s.value));
  const cableEntries = Array.from(usedCables).map((key) => {
    const [dir, width] = key.split(":");
    return { key, label: cableLabel(dir as "L" | "R", Number(width)) };
  });

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-charcoal/70">
      <span className="flex items-center gap-1">
        <span className="flex h-4 w-4 items-center justify-center rounded border border-linen bg-[#faf7f2]" />
        Punto derecho (celda en blanco)
      </span>
      {entries.map((s) => (
        <span key={s.value} className="flex items-center gap-1">
          <span className="flex h-4 w-4 items-center justify-center rounded border border-linen bg-[#faf7f2] text-[10px]">
            {s.glyph}
          </span>
          {s.label}
        </span>
      ))}
      {cableEntries.map((c) => (
        <span key={c.key} className="flex items-center gap-1">
          <span className="flex h-4 w-4 items-center justify-center rounded border border-linen bg-[#efe6d4] text-[10px]">
            ✕
          </span>
          {c.label}
        </span>
      ))}
    </div>
  );
}
