import type { GridData } from "@/lib/types/pattern";

const MAX_CELLS_FOR_FULL_CHART = 6000;

// A read-only, printable version of the color grid — the interactive
// editor is canvas-based (mouse handlers, undo/redo) which doesn't belong
// in a static document, so this renders the same grid as plain SVG instead.
export function ColorChartDisplay({
  gridData,
  width,
  height,
  backgroundHex,
  cellSize = 18,
}: {
  gridData: GridData;
  width: number;
  height: number;
  backgroundHex: string;
  cellSize?: number;
}) {
  if (width * height > MAX_CELLS_FOR_FULL_CHART) {
    return (
      <p className="text-xs text-charcoal/50">
        Este gráfico es muy grande para mostrarlo completo acá — abrilo en el Diagrama para verlo
        entero.
      </p>
    );
  }

  const rulerSize = Math.max(16, Math.round(cellSize * 0.8));
  const fontSize = Math.min(9, cellSize * 0.5);
  const svgWidth = width * cellSize + rulerSize;
  const svgHeight = height * cellSize + rulerSize;

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full" style={{ maxWidth: svgWidth }}>
      <rect x={0} y={0} width={svgWidth} height={rulerSize} fill="#e8e0d0" />
      <rect x={0} y={0} width={rulerSize} height={svgHeight} fill="#e8e0d0" />
      {Array.from({ length: width }, (_, col) => (
        <text
          key={`c${col}`}
          x={rulerSize + col * cellSize + cellSize / 2}
          y={rulerSize / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={fontSize}
          fill="#2c2c2c"
        >
          {col + 1}
        </text>
      ))}
      {Array.from({ length: height }, (_, row) => (
        <text
          key={`r${row}`}
          x={rulerSize / 2}
          y={rulerSize + row * cellSize + cellSize / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={fontSize}
          fill="#2c2c2c"
        >
          {height - row}
        </text>
      ))}
      {Array.from({ length: height }, (_, row) =>
        Array.from({ length: width }, (_, col) => (
          <rect
            key={`${col},${row}`}
            x={rulerSize + col * cellSize}
            y={rulerSize + row * cellSize}
            width={cellSize}
            height={cellSize}
            fill={gridData[`${col},${row}`] ?? backgroundHex}
            stroke="#c8b89a"
            strokeWidth={0.5}
          />
        )),
      )}
    </svg>
  );
}
