"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pencil, PaintBucket, Pipette, Eraser, Shuffle, Undo2, Redo2, Save, Trash2, BookOpen } from "lucide-react";
import clsx from "clsx";
import { ResizePanel } from "@/components/estudio/resize-panel";
import { saveGridData, savePatternVersion, resizePatternGrid, syncPatternState } from "@/lib/actions/patterns";
import { publishPatternToLibrary } from "@/lib/actions/library";
import { buildStitchRowInstructions } from "@/lib/stitch-chart";
import {
  STITCH_SYMBOLS,
  DEFAULT_STITCH,
  stitchInfo,
  encodeCableCell,
  parseCableCell,
  cableLabel,
  type StitchSymbol,
  type CableDirection,
} from "@/lib/types/stitch-symbols";
import type { GridData, Pattern } from "@/lib/types/pattern";

const GRID_LINE_COLOR = "#c8b89a";
const RULER_BG_COLOR = "#e8e0d0";
const RULER_TEXT_COLOR = "#2c2c2c";
const CELL_BG = "#faf7f2";
const NS_BG = "#d8d0bd";
const UNDO_LIMIT = 50;
const AUTOSAVE_DELAY_MS = 1500;

type Tool = "pencil" | "bucket" | "eyedropper" | "eraser" | "cable";

type HistorySnapshot = { gridData: GridData; width: number; height: number };

function cellKey(col: number, row: number) {
  return `${col},${row}`;
}

function floodFill(
  gridData: GridData,
  width: number,
  height: number,
  startCol: number,
  startRow: number,
  targetSymbol: string,
): GridData {
  const startSymbol = gridData[cellKey(startCol, startRow)] ?? DEFAULT_STITCH;
  if (startSymbol === targetSymbol) return gridData;

  const next = { ...gridData };
  const stack: [number, number][] = [[startCol, startRow]];
  const visited = new Set<string>();

  while (stack.length > 0) {
    const [col, row] = stack.pop()!;
    if (col < 0 || row < 0 || col >= width || row >= height) continue;
    const key = cellKey(col, row);
    if (visited.has(key)) continue;
    const symbol = next[key] ?? DEFAULT_STITCH;
    if (symbol !== startSymbol) continue;
    visited.add(key);
    if (targetSymbol === DEFAULT_STITCH) delete next[key];
    else next[key] = targetSymbol;
    stack.push([col + 1, row], [col - 1, row], [col, row + 1], [col, row - 1]);
  }

  return next;
}

export function StitchPatternEditor({ pattern }: { pattern: Pattern }) {
  const [width, setWidth] = useState(pattern.width_stitches);
  const [height, setHeight] = useState(pattern.height_rows);
  const [gridData, setGridData] = useState<GridData>(pattern.grid_data ?? {});
  const [activeSymbol, setActiveSymbol] = useState<StitchSymbol>("P");
  const [tool, setTool] = useState<Tool>("pencil");
  const [cableDirection, setCableDirection] = useState<CableDirection>("L");
  const [cableWidth, setCableWidth] = useState(4);
  const [cableError, setCableError] = useState("");
  const [cellSize, setCellSize] = useState(24);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [versionLabel, setVersionLabel] = useState("");
  const [publishMessage, setPublishMessage] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isPaintingRef = useRef(false);
  const undoStack = useRef<HistorySnapshot[]>([]);
  const redoStack = useRef<HistorySnapshot[]>([]);
  const strokeStartRef = useRef<HistorySnapshot | null>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rulerSize = Math.max(18, cellSize);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const ctx = context;

    canvas.width = width * cellSize + rulerSize;
    canvas.height = height * cellSize + rulerSize;

    ctx.fillStyle = RULER_BG_COLOR;
    ctx.fillRect(0, 0, canvas.width, rulerSize);
    ctx.fillRect(0, 0, rulerSize, canvas.height);

    ctx.fillStyle = RULER_TEXT_COLOR;
    ctx.font = `${Math.min(11, rulerSize - 6)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let col = 0; col < width; col++) {
      ctx.fillText(String(col + 1), rulerSize + col * cellSize + cellSize / 2, rulerSize / 2);
    }
    for (let row = 0; row < height; row++) {
      ctx.fillText(String(height - row), rulerSize / 2, rulerSize + row * cellSize + cellSize / 2);
    }

    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const symbol = gridData[cellKey(col, row)] ?? DEFAULT_STITCH;
        const x = rulerSize + col * cellSize;
        const y = rulerSize + row * cellSize;
        const cable = parseCableCell(symbol);
        ctx.fillStyle = symbol === "NS" ? NS_BG : cable ? "#efe6d4" : CELL_BG;
        ctx.fillRect(x, y, cellSize, cellSize);
        if (!cable && symbol !== "K") {
          const glyph = stitchInfo(symbol).glyph;
          ctx.fillStyle = "#2c3e50";
          ctx.font = `${Math.round(cellSize * 0.6)}px sans-serif`;
          ctx.fillText(glyph, x + cellSize / 2, y + cellSize / 2 + 1);
        }
      }
    }

    // Cable crosses span several cells — drawn as one crossing glyph over
    // the whole span, triggered once from the span's first cell, instead of
    // a per-cell symbol like every other stitch.
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

      ctx.lineWidth = Math.max(2, cellSize * 0.12);
      ctx.lineCap = "round";
      // The strand that crosses IN FRONT is drawn solid and on top; the one
      // that goes behind is drawn first and left with a small gap at the
      // crossing point, the usual chart convention for which side is which.
      const frontFromLeft = cable.direction === "L";
      ctx.strokeStyle = "#8b3a2a";

      function halfLine(fromX: number, fromY: number, toX: number, toY: number, gap: boolean) {
        if (!gap) {
          ctx.beginPath();
          ctx.moveTo(fromX, fromY);
          ctx.lineTo(toX, toY);
          ctx.stroke();
          return;
        }
        const gapSize = cellSize * 0.35;
        const dx = toX - fromX;
        const dy = toY - fromY;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len;
        const uy = dy / len;
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(midX - (ux * gapSize) / 2, midY - (uy * gapSize) / 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(midX + (ux * gapSize) / 2, midY + (uy * gapSize) / 2);
        ctx.lineTo(toX, toY);
        ctx.stroke();
      }

      // Back strand first (with a gap at the crossing), then the front
      // strand unbroken on top.
      halfLine(leftX, topY, rightX, botY, !frontFromLeft);
      halfLine(rightX, topY, leftX, botY, frontFromLeft);
    }

    ctx.strokeStyle = GRID_LINE_COLOR;
    ctx.lineWidth = 1;
    for (let col = 0; col <= width; col++) {
      ctx.beginPath();
      ctx.moveTo(rulerSize + col * cellSize + 0.5, rulerSize);
      ctx.lineTo(rulerSize + col * cellSize + 0.5, rulerSize + height * cellSize);
      ctx.stroke();
    }
    for (let row = 0; row <= height; row++) {
      ctx.beginPath();
      ctx.moveTo(rulerSize, rulerSize + row * cellSize + 0.5);
      ctx.lineTo(rulerSize + width * cellSize, rulerSize + row * cellSize + 0.5);
      ctx.stroke();
    }
  }, [gridData, width, height, cellSize, rulerSize]);

  useEffect(() => {
    draw();
  }, [draw]);

  const scheduleAutosave = useCallback(
    (nextGrid: GridData) => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      setSaveState("saving");
      autosaveTimer.current = setTimeout(async () => {
        await saveGridData(pattern.id, pattern.palette_id, nextGrid, []);
        setSaveState("saved");
      }, AUTOSAVE_DELAY_MS);
    },
    [pattern.id, pattern.palette_id],
  );

  function commitGridChange(next: GridData) {
    setGridData(next);
    scheduleAutosave(next);
  }

  function pushUndo(snapshot: HistorySnapshot) {
    undoStack.current.push(snapshot);
    if (undoStack.current.length > UNDO_LIMIT) undoStack.current.shift();
    redoStack.current = [];
  }

  function getCellFromEvent(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX - rulerSize;
    const y = (e.clientY - rect.top) * scaleY - rulerSize;
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    if (col < 0 || row < 0 || col >= width || row >= height) return null;
    return { col, row };
  }

  function paintCell(col: number, row: number, current: GridData): GridData {
    const key = cellKey(col, row);
    const next = { ...current };
    if (tool === "eraser" || activeSymbol === DEFAULT_STITCH) delete next[key];
    else next[key] = activeSymbol;
    return next;
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const cell = getCellFromEvent(e);
    if (!cell) return;

    if (tool === "eyedropper") {
      setActiveSymbol((gridData[cellKey(cell.col, cell.row)] as StitchSymbol) ?? DEFAULT_STITCH);
      return;
    }
    if (tool === "bucket") {
      pushUndo({ gridData, width, height });
      commitGridChange(floodFill(gridData, width, height, cell.col, cell.row, activeSymbol));
      return;
    }
    if (tool === "eraser") {
      const existing = parseCableCell(gridData[cellKey(cell.col, cell.row)] ?? "");
      if (existing) {
        pushUndo({ gridData, width, height });
        const next = { ...gridData };
        const startCol = cell.col - existing.index;
        for (let i = 0; i < existing.width; i++) delete next[cellKey(startCol + i, cell.row)];
        commitGridChange(next);
        return;
      }
    }
    if (tool === "cable") {
      setCableError("");
      if (cell.col + cableWidth > width) {
        setCableError(`No entra: hacen falta ${cableWidth} puntos libres a la derecha de esa columna.`);
        return;
      }
      pushUndo({ gridData, width, height });
      const next = { ...gridData };
      for (let i = 0; i < cableWidth; i++) {
        next[cellKey(cell.col + i, cell.row)] = encodeCableCell(cableDirection, cableWidth, i);
      }
      commitGridChange(next);
      return;
    }

    isPaintingRef.current = true;
    strokeStartRef.current = { gridData, width, height };
    setGridData((current) => paintCell(cell.col, cell.row, current));
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isPaintingRef.current) return;
    const cell = getCellFromEvent(e);
    if (!cell) return;
    setGridData((current) => paintCell(cell.col, cell.row, current));
  }

  function handleMouseUp() {
    if (!isPaintingRef.current) return;
    isPaintingRef.current = false;
    if (strokeStartRef.current) {
      pushUndo(strokeStartRef.current);
      strokeStartRef.current = null;
    }
    scheduleAutosave(gridData);
  }

  function applySnapshot(snapshot: HistorySnapshot) {
    setGridData(snapshot.gridData);
    setWidth(snapshot.width);
    setHeight(snapshot.height);
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    setSaveState("saving");
    syncPatternState(pattern.id, pattern.palette_id, snapshot.width, snapshot.height, snapshot.gridData, []).then(
      () => setSaveState("saved"),
    );
  }

  function handleUndo() {
    const previous = undoStack.current.pop();
    if (previous === undefined) return;
    redoStack.current.push({ gridData, width, height });
    applySnapshot(previous);
  }

  function handleRedo() {
    const next = redoStack.current.pop();
    if (next === undefined) return;
    undoStack.current.push({ gridData, width, height });
    applySnapshot(next);
  }

  function handleClear() {
    if (!window.confirm("¿Seguro que querés limpiar todo el diagrama? Podés deshacer después si te arrepentís.")) {
      return;
    }
    pushUndo({ gridData, width, height });
    commitGridChange({});
  }

  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (e.key === "y" || (e.key === "z" && e.shiftKey)) {
        e.preventDefault();
        handleRedo();
      }
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridData]);

  function shiftGrid(source: GridData, colOffset: number, rowOffset: number): GridData {
    const next: GridData = {};
    for (const [key, symbol] of Object.entries(source)) {
      const [col, row] = key.split(",").map(Number);
      next[cellKey(col + colOffset, row + rowOffset)] = symbol;
    }
    return next;
  }

  function persistResize(newWidth: number, newHeight: number, newGrid: GridData) {
    setWidth(newWidth);
    setHeight(newHeight);
    setGridData(newGrid);
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    setSaveState("saving");
    resizePatternGrid(pattern.id, newWidth, newHeight, newGrid).then(() => setSaveState("saved"));
  }

  function handleAddRow(edge: "top" | "bottom") {
    pushUndo({ gridData, width, height });
    const nextGrid = edge === "top" ? shiftGrid(gridData, 0, 1) : { ...gridData };
    persistResize(width, height + 1, nextGrid);
  }

  function handleRemoveRow(edge: "top" | "bottom") {
    if (height <= 1) return;
    if (!window.confirm("¿Seguro? Se va a perder lo que esté marcado en esa vuelta.")) return;
    pushUndo({ gridData, width, height });
    const next: GridData = {};
    for (const [key, symbol] of Object.entries(gridData)) {
      const [col, row] = key.split(",").map(Number);
      if (edge === "top") {
        if (row === 0) continue;
        next[cellKey(col, row - 1)] = symbol;
      } else {
        if (row === height - 1) continue;
        next[cellKey(col, row)] = symbol;
      }
    }
    persistResize(width, height - 1, next);
  }

  function handleAddColumn(edge: "left" | "right") {
    pushUndo({ gridData, width, height });
    const nextGrid = edge === "left" ? shiftGrid(gridData, 1, 0) : { ...gridData };
    persistResize(width + 1, height, nextGrid);
  }

  function handleRemoveColumn(edge: "left" | "right") {
    if (width <= 1) return;
    if (!window.confirm("¿Seguro? Se va a perder lo que esté marcado en esa columna de puntos.")) return;
    pushUndo({ gridData, width, height });
    const next: GridData = {};
    for (const [key, symbol] of Object.entries(gridData)) {
      const [col, row] = key.split(",").map(Number);
      if (edge === "left") {
        if (col === 0) continue;
        next[cellKey(col - 1, row)] = symbol;
      } else {
        if (col === width - 1) continue;
        next[cellKey(col, row)] = symbol;
      }
    }
    persistResize(width - 1, height, next);
  }

  async function handleSaveVersion() {
    await savePatternVersion(pattern.id, versionLabel, gridData);
    setVersionLabel("");
  }

  async function handlePublishToLibrary() {
    await publishPatternToLibrary(pattern.id, pattern.name, "");
    setPublishMessage("Publicado ✓");
    setTimeout(() => setPublishMessage(""), 2500);
  }

  const tools: { key: Tool; icon: typeof Pencil; label: string }[] = [
    { key: "pencil", icon: Pencil, label: "Lápiz" },
    { key: "bucket", icon: PaintBucket, label: "Balde de relleno" },
    { key: "eyedropper", icon: Pipette, label: "Gotero" },
    { key: "eraser", icon: Eraser, label: "Borrador (punto derecho)" },
    { key: "cable", icon: Shuffle, label: "Trenza" },
  ];

  const instructions = buildStitchRowInstructions(gridData, width, height);

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="flex shrink-0 flex-row flex-wrap gap-3 lg:w-64 lg:flex-col">
        <div className="flex gap-1.5 rounded-yakana border border-linen bg-offwhite p-1.5">
          {tools.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTool(t.key)}
              title={t.label}
              className={clsx(
                "flex h-9 w-9 items-center justify-center rounded-yakana",
                tool === t.key ? "bg-terracotta text-offwhite" : "text-navy hover:bg-linen",
              )}
            >
              <t.icon size={18} />
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            title="Limpiar todo el diagrama"
            className="flex h-9 w-9 items-center justify-center rounded-yakana text-terracotta hover:bg-terracotta/10"
          >
            <Trash2 size={18} />
          </button>
        </div>

        <div className="rounded-yakana border border-linen bg-offwhite p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-charcoal/60">
            Referencia de puntos
          </p>
          <div className="space-y-1">
            {STITCH_SYMBOLS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setActiveSymbol(s.value)}
                className={clsx(
                  "flex w-full items-center gap-2 rounded-yakana px-2 py-1.5 text-left text-xs",
                  activeSymbol === s.value ? "bg-terracotta text-offwhite" : "hover:bg-linen",
                )}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-current bg-white/40 text-sm text-charcoal">
                  {s.glyph || "—"}
                </span>
                {s.label}
              </button>
            ))}
          </div>
          <p className="mt-2 border-t border-linen pt-2 text-xs text-charcoal/50">
            Trenzas: la línea entera pasa por delante, la línea con un corte pasa por detrás.
          </p>
        </div>

        {tool === "cable" ? (
          <div className="rounded-yakana border border-linen bg-offwhite p-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-charcoal/60">
              Trenza a colocar
            </p>
            <div className="mb-2 flex gap-1.5">
              {(["L", "R"] as CableDirection[]).map((dir) => (
                <button
                  key={dir}
                  type="button"
                  onClick={() => setCableDirection(dir)}
                  className={clsx(
                    "flex-1 rounded-yakana px-2 py-1.5 text-xs font-medium",
                    cableDirection === dir ? "bg-terracotta text-offwhite" : "border border-linen hover:bg-linen",
                  )}
                >
                  {dir === "L" ? "Izquierda" : "Derecha"}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              {[2, 4, 6].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setCableWidth(w)}
                  className={clsx(
                    "flex-1 rounded-yakana px-2 py-1.5 text-xs font-medium",
                    cableWidth === w ? "bg-terracotta text-offwhite" : "border border-linen hover:bg-linen",
                  )}
                >
                  {w / 2} sobre {w / 2}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-charcoal/60">{cableLabel(cableDirection, cableWidth)}</p>
            <p className="mt-1 text-xs text-charcoal/50">
              Hacé clic en el primer punto (el de más a la izquierda) de la trenza.
            </p>
            {cableError ? <p className="mt-1 text-xs text-terracotta">{cableError}</p> : null}
          </div>
        ) : null}

        <ResizePanel
          width={width}
          height={height}
          onAddRow={handleAddRow}
          onRemoveRow={handleRemoveRow}
          onAddColumn={handleAddColumn}
          onRemoveColumn={handleRemoveColumn}
        />

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleUndo}
              className="flex flex-1 items-center justify-center gap-1 rounded-yakana border border-linen bg-offwhite py-2 text-xs text-navy hover:bg-linen"
            >
              <Undo2 size={14} />
              Deshacer
            </button>
            <button
              type="button"
              onClick={handleRedo}
              className="flex flex-1 items-center justify-center gap-1 rounded-yakana border border-linen bg-offwhite py-2 text-xs text-navy hover:bg-linen"
            >
              <Redo2 size={14} />
              Rehacer
            </button>
          </div>

          <label className="text-xs font-medium text-navy">
            Zoom
            <input
              type="range"
              min={12}
              max={40}
              value={cellSize}
              onChange={(e) => setCellSize(Number(e.target.value))}
              className="w-full"
            />
          </label>

          <div className="rounded-yakana border border-linen bg-offwhite p-2">
            <input
              value={versionLabel}
              onChange={(e) => setVersionLabel(e.target.value)}
              placeholder="Nombre de la versión"
              className="mb-1.5 w-full rounded border border-linen px-2 py-1 text-xs outline-none focus:border-terracotta"
            />
            <button
              type="button"
              onClick={handleSaveVersion}
              className="flex w-full items-center justify-center gap-1 rounded-yakana bg-navy py-1.5 text-xs font-medium text-offwhite hover:opacity-90"
            >
              <Save size={13} />
              Guardar versión
            </button>
          </div>

          <p className="text-center text-xs text-charcoal/50">
            {saveState === "saving" ? "Guardando…" : saveState === "saved" ? "Guardado ✓" : ""}
          </p>

          <div className="rounded-yakana border border-linen bg-offwhite p-2">
            <button
              type="button"
              onClick={handlePublishToLibrary}
              className="flex w-full items-center justify-center gap-1 rounded-yakana border border-linen bg-white py-1.5 text-xs font-medium text-navy hover:bg-linen"
            >
              <BookOpen size={13} />
              Publicar en Biblioteca
            </button>
            <span className="mt-1 block text-center text-xs text-olive">{publishMessage}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4">
        <div className="overflow-auto rounded-yakana border border-linen bg-white p-2">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="cursor-crosshair"
          />
        </div>

        <div className="rounded-yakana border border-linen bg-offwhite p-4">
          <h2 className="mb-2 font-heading text-lg italic text-navy">Instrucciones vuelta por vuelta</h2>
          <p className="mb-3 text-xs text-charcoal/50">
            Las celdas en blanco se leen como punto derecho — es la convención habitual de los
            diagramas de puntos, no hace falta marcarlas.
          </p>
          <ol className="max-h-96 list-inside list-decimal space-y-1 overflow-y-auto text-sm text-charcoal/80">
            {instructions.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
