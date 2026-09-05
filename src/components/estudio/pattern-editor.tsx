"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Pencil,
  PaintBucket,
  Pipette,
  Eraser,
  Crop,
  Undo2,
  Redo2,
  Save,
  Trash2,
  BookOpen,
} from "lucide-react";
import clsx from "clsx";
import { PaletteEditor } from "@/components/estudio/palette-editor";
import { ImageImportPanel } from "@/components/estudio/image-import-panel";
import { ResizePanel } from "@/components/estudio/resize-panel";
import { RepeatPanel } from "@/components/estudio/repeat-panel";
import { SuggestPanel } from "@/components/estudio/suggest-panel";
import {
  saveGridData,
  savePatternVersion,
  resizePatternGrid,
  syncPatternState,
  setRepeatRegion,
} from "@/lib/actions/patterns";
import { publishPatternToLibrary } from "@/lib/actions/library";
import { normalizeRegion, type RepeatRegion } from "@/lib/estudio/repeat-tile";
import type { GridData, PaletteColor, Pattern } from "@/lib/types/pattern";

const GRID_LINE_COLOR = "#c8b89a";
const RULER_BG_COLOR = "#e8e0d0";
const RULER_TEXT_COLOR = "#2c2c2c";
const UNDO_LIMIT = 50;
const AUTOSAVE_DELAY_MS = 1500;

type Tool = "pencil" | "bucket" | "eyedropper" | "eraser" | "region";

type HistorySnapshot = {
  gridData: GridData;
  colors: PaletteColor[];
  width: number;
  height: number;
};

function cellKey(col: number, row: number) {
  return `${col},${row}`;
}

function floodFill(
  gridData: GridData,
  width: number,
  height: number,
  startCol: number,
  startRow: number,
  backgroundHex: string,
  targetHex: string,
): GridData {
  const startColor = gridData[cellKey(startCol, startRow)] ?? backgroundHex;
  if (startColor === targetHex) return gridData;

  const next = { ...gridData };
  const stack: [number, number][] = [[startCol, startRow]];
  const visited = new Set<string>();

  while (stack.length > 0) {
    const [col, row] = stack.pop()!;
    if (col < 0 || row < 0 || col >= width || row >= height) continue;
    const key = cellKey(col, row);
    if (visited.has(key)) continue;
    const color = next[key] ?? backgroundHex;
    if (color !== startColor) continue;
    visited.add(key);
    if (targetHex === backgroundHex) delete next[key];
    else next[key] = targetHex;
    stack.push([col + 1, row], [col - 1, row], [col, row + 1], [col, row - 1]);
  }

  return next;
}

export function PatternEditor({
  pattern,
  initialColors,
  globalPalettes,
  suggestedRepeatWidth,
}: {
  pattern: Pattern;
  initialColors: PaletteColor[];
  globalPalettes: { id: string; name: string; colors: PaletteColor[] }[];
  suggestedRepeatWidth?: number | null;
}) {
  const [width, setWidth] = useState(pattern.width_stitches);
  const [height, setHeight] = useState(pattern.height_rows);

  const [gridData, setGridData] = useState<GridData>(pattern.grid_data ?? {});
  const [colors, setColors] = useState<PaletteColor[]>(initialColors);
  const [activeColor, setActiveColor] = useState(initialColors[1]?.hex ?? initialColors[0].hex);
  const [tool, setTool] = useState<Tool>("pencil");
  const [cellSize, setCellSize] = useState(20);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [versionLabel, setVersionLabel] = useState("");
  const [publishMessage, setPublishMessage] = useState("");
  const [importPaletteId, setImportPaletteId] = useState("");
  const [repeatRegion, setRepeatRegionState] = useState<RepeatRegion | null>(
    pattern.repeat_region,
  );
  const [selectionStart, setSelectionStart] = useState<{ col: number; row: number } | null>(null);
  const [selectionDraft, setSelectionDraft] = useState<RepeatRegion | null>(null);
  const [savingRegion, setSavingRegion] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isPaintingRef = useRef(false);
  const undoStack = useRef<HistorySnapshot[]>([]);
  const redoStack = useRef<HistorySnapshot[]>([]);
  const strokeStartRef = useRef<HistorySnapshot | null>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const backgroundHex = colors[0]?.hex ?? "#faf7f2";
  const rulerSize = Math.max(18, cellSize);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = width * cellSize + rulerSize;
    canvas.height = height * cellSize + rulerSize;

    // Rulers
    ctx.fillStyle = RULER_BG_COLOR;
    ctx.fillRect(0, 0, canvas.width, rulerSize);
    ctx.fillRect(0, 0, rulerSize, canvas.height);

    ctx.fillStyle = RULER_TEXT_COLOR;
    ctx.font = `${Math.min(11, rulerSize - 6)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let col = 0; col < width; col++) {
      ctx.fillText(
        String(col + 1),
        rulerSize + col * cellSize + cellSize / 2,
        rulerSize / 2,
      );
    }
    // Rows are numbered bottom-to-top, matching how a chart is knit (row 1 at cast-on edge).
    for (let row = 0; row < height; row++) {
      ctx.fillText(
        String(height - row),
        rulerSize / 2,
        rulerSize + row * cellSize + cellSize / 2,
      );
    }

    // Cells
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const hex = gridData[cellKey(col, row)] ?? backgroundHex;
        ctx.fillStyle = hex;
        ctx.fillRect(rulerSize + col * cellSize, rulerSize + row * cellSize, cellSize, cellSize);
      }
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

    function strokeRegion(region: RepeatRegion, color: string) {
      ctx!.strokeStyle = color;
      ctx!.lineWidth = 2;
      ctx!.setLineDash([6, 4]);
      ctx!.strokeRect(
        rulerSize + region.x1 * cellSize,
        rulerSize + region.y1 * cellSize,
        (region.x2 - region.x1 + 1) * cellSize,
        (region.y2 - region.y1 + 1) * cellSize,
      );
      ctx!.setLineDash([]);
    }

    if (repeatRegion) strokeRegion(repeatRegion, "#2c3e50");
    if (selectionDraft) strokeRegion(selectionDraft, "#c1440e");
  }, [gridData, width, height, cellSize, backgroundHex, rulerSize, repeatRegion, selectionDraft]);

  useEffect(() => {
    draw();
  }, [draw]);

  const scheduleAutosave = useCallback(
    (nextGrid: GridData, nextColors: PaletteColor[]) => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      setSaveState("saving");
      autosaveTimer.current = setTimeout(async () => {
        await saveGridData(pattern.id, pattern.palette_id, nextGrid, nextColors);
        setSaveState("saved");
      }, AUTOSAVE_DELAY_MS);
    },
    [pattern.id, pattern.palette_id],
  );

  function commitGridChange(next: GridData) {
    setGridData(next);
    scheduleAutosave(next, colors);
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
    if (tool === "eraser" || activeColor === backgroundHex) {
      delete next[key];
    } else {
      next[key] = activeColor;
    }
    return next;
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const cell = getCellFromEvent(e);
    if (!cell) return;

    if (tool === "region") {
      setSelectionStart(cell);
      setSelectionDraft(normalizeRegion(cell, cell));
      return;
    }

    if (tool === "eyedropper") {
      const hex = gridData[cellKey(cell.col, cell.row)] ?? backgroundHex;
      setActiveColor(hex);
      return;
    }

    if (tool === "bucket") {
      pushUndo({ gridData, colors, width, height });
      const next = floodFill(gridData, width, height, cell.col, cell.row, backgroundHex, activeColor);
      commitGridChange(next);
      return;
    }

    isPaintingRef.current = true;
    strokeStartRef.current = { gridData, colors, width, height };
    setGridData((current) => paintCell(cell.col, cell.row, current));
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (tool === "region") {
      if (!selectionStart) return;
      const cell = getCellFromEvent(e);
      if (!cell) return;
      setSelectionDraft(normalizeRegion(selectionStart, cell));
      return;
    }
    if (!isPaintingRef.current) return;
    const cell = getCellFromEvent(e);
    if (!cell) return;
    setGridData((current) => paintCell(cell.col, cell.row, current));
  }

  function handleMouseUp() {
    if (tool === "region") {
      setSelectionStart(null);
      return;
    }
    if (!isPaintingRef.current) return;
    isPaintingRef.current = false;
    if (strokeStartRef.current) {
      pushUndo(strokeStartRef.current);
      strokeStartRef.current = null;
    }
    scheduleAutosave(gridData, colors);
  }

  async function confirmSelection() {
    if (!selectionDraft) return;
    setSavingRegion(true);
    await setRepeatRegion(pattern.id, selectionDraft);
    setRepeatRegionState(selectionDraft);
    setSelectionDraft(null);
    setSavingRegion(false);
    setTool("pencil");
  }

  function cancelSelection() {
    setSelectionDraft(null);
  }

  async function handleRemoveRegion() {
    await setRepeatRegion(pattern.id, null);
    setRepeatRegionState(null);
  }

  function applySnapshot(snapshot: HistorySnapshot) {
    setGridData(snapshot.gridData);
    setColors(snapshot.colors);
    setWidth(snapshot.width);
    setHeight(snapshot.height);
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    setSaveState("saving");
    syncPatternState(
      pattern.id,
      pattern.palette_id,
      snapshot.width,
      snapshot.height,
      snapshot.gridData,
      snapshot.colors,
    ).then(() => setSaveState("saved"));
  }

  function handleUndo() {
    const previous = undoStack.current.pop();
    if (previous === undefined) return;
    redoStack.current.push({ gridData, colors, width, height });
    applySnapshot(previous);
  }

  function handleRedo() {
    const next = redoStack.current.pop();
    if (next === undefined) return;
    undoStack.current.push({ gridData, colors, width, height });
    applySnapshot(next);
  }

  function handleClear() {
    if (!window.confirm("¿Seguro que querés limpiar todo el tapiz? Podés deshacer después si te arrepentís.")) {
      return;
    }
    pushUndo({ gridData, colors, width, height });
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
  }, [gridData, colors]);

  function handleColorsChange(next: PaletteColor[]) {
    setColors(next);
    scheduleAutosave(gridData, next);
  }

  function handleRecolor(oldHex: string, newHex: string, index: number) {
    pushUndo({ gridData, colors, width, height });
    const nextGrid = { ...gridData };
    for (const key of Object.keys(nextGrid)) {
      if (nextGrid[key] === oldHex) nextGrid[key] = newHex;
    }
    const nextColors = colors.map((c, i) => (i === index ? { ...c, hex: newHex } : c));
    setGridData(nextGrid);
    setColors(nextColors);
    if (activeColor === oldHex) setActiveColor(newHex);
    scheduleAutosave(nextGrid, nextColors);
  }

  function handleImageImport(newGrid: GridData, newColors: PaletteColor[]) {
    pushUndo({ gridData, colors, width, height });
    setGridData(newGrid);
    setColors(newColors);
    setActiveColor(newColors[1]?.hex ?? newColors[0].hex);
    scheduleAutosave(newGrid, newColors);
  }

  function handleImportPalette(paletteId: string) {
    const source = globalPalettes.find((p) => p.id === paletteId);
    if (!source) return;

    const existingHexes = new Set(colors.map((c) => c.hex));
    const newOnes = source.colors.filter((c) => {
      if (existingHexes.has(c.hex)) return false;
      existingHexes.add(c.hex); // also dedupe repeats within the source palette itself
      return true;
    });
    const room = Math.max(0, 10 - colors.length);
    const toAdd = newOnes.slice(0, room);
    if (toAdd.length === 0) return;

    pushUndo({ gridData, colors, width, height });
    const nextColors = [...colors, ...toAdd];
    setColors(nextColors);
    scheduleAutosave(gridData, nextColors);
  }

  function shiftGrid(source: GridData, colOffset: number, rowOffset: number): GridData {
    const next: GridData = {};
    for (const [key, hex] of Object.entries(source)) {
      const [col, row] = key.split(",").map(Number);
      next[cellKey(col + colOffset, row + rowOffset)] = hex;
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
    pushUndo({ gridData, colors, width, height });
    const nextGrid = edge === "top" ? shiftGrid(gridData, 0, 1) : { ...gridData };
    persistResize(width, height + 1, nextGrid);
  }

  function handleRemoveRow(edge: "top" | "bottom") {
    if (height <= 1) return;
    if (!window.confirm("¿Seguro? Se va a perder lo que esté dibujado en esa vuelta.")) return;
    pushUndo({ gridData, colors, width, height });
    const next: GridData = {};
    for (const [key, hex] of Object.entries(gridData)) {
      const [col, row] = key.split(",").map(Number);
      if (edge === "top") {
        if (row === 0) continue;
        next[cellKey(col, row - 1)] = hex;
      } else {
        if (row === height - 1) continue;
        next[cellKey(col, row)] = hex;
      }
    }
    persistResize(width, height - 1, next);
  }

  function handleAddColumn(edge: "left" | "right") {
    pushUndo({ gridData, colors, width, height });
    const nextGrid = edge === "left" ? shiftGrid(gridData, 1, 0) : { ...gridData };
    persistResize(width + 1, height, nextGrid);
  }

  function handleRemoveColumn(edge: "left" | "right") {
    if (width <= 1) return;
    if (!window.confirm("¿Seguro? Se va a perder lo que esté dibujado en esa columna de puntos.")) return;
    pushUndo({ gridData, colors, width, height });
    const next: GridData = {};
    for (const [key, hex] of Object.entries(gridData)) {
      const [col, row] = key.split(",").map(Number);
      if (edge === "left") {
        if (col === 0) continue;
        next[cellKey(col - 1, row)] = hex;
      } else {
        if (col === width - 1) continue;
        next[cellKey(col, row)] = hex;
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
    { key: "eraser", icon: Eraser, label: "Borrador" },
    { key: "region", icon: Crop, label: "Marcar región para repetir" },
  ];

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="flex shrink-0 flex-row flex-wrap gap-3 lg:w-56 lg:flex-col">
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
            title="Limpiar todo el tapiz"
            className="flex h-9 w-9 items-center justify-center rounded-yakana text-terracotta hover:bg-terracotta/10"
          >
            <Trash2 size={18} />
          </button>
        </div>

        <PaletteEditor
          colors={colors}
          activeColor={activeColor}
          onSelectColor={setActiveColor}
          onChangeColors={handleColorsChange}
          onRecolor={handleRecolor}
        />

        <SuggestPanel patternId={pattern.id} />

        {globalPalettes.length > 0 ? (
          <div className="rounded-yakana border border-linen bg-offwhite p-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-charcoal/60">
              Importar paleta global
            </p>
            <div className="flex gap-1.5">
              <select
                value={importPaletteId}
                onChange={(e) => setImportPaletteId(e.target.value)}
                className="flex-1 rounded-yakana border border-linen bg-white px-2 py-1 text-xs outline-none focus:border-terracotta"
              >
                <option value="">Elegí una paleta</option>
                {globalPalettes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handleImportPalette(importPaletteId)}
                disabled={!importPaletteId}
                className="rounded-yakana bg-navy px-2.5 py-1 text-xs font-medium text-offwhite disabled:opacity-50"
              >
                Sumar
              </button>
            </div>
            <p className="mt-1.5 text-xs text-charcoal/50">
              Agrega los colores que falten a esta paleta, sin borrar los que ya tenés.
            </p>
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

        {selectionDraft && !selectionStart ? (
          <div className="rounded-yakana border border-terracotta/40 bg-terracotta/5 p-3">
            <p className="mb-2 text-xs text-charcoal/70">
              Región marcada: {selectionDraft.x2 - selectionDraft.x1 + 1} ×{" "}
              {selectionDraft.y2 - selectionDraft.y1 + 1} puntos
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={confirmSelection}
                disabled={savingRegion}
                className="flex-1 rounded-yakana bg-navy px-3 py-1.5 text-xs font-medium text-offwhite disabled:opacity-50"
              >
                {savingRegion ? "Guardando…" : "Usar esta región"}
              </button>
              <button
                type="button"
                onClick={cancelSelection}
                className="rounded-yakana border border-linen bg-white px-3 py-1.5 text-xs text-charcoal/60 hover:bg-linen"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : null}

        {repeatRegion ? (
          <RepeatPanel
            patternId={pattern.id}
            patternName={pattern.name}
            repeatRegion={repeatRegion}
            projectId={pattern.project_id}
            garmentZone={pattern.garment_zone}
            suggestedWidth={suggestedRepeatWidth ?? null}
            onRemoveRegion={handleRemoveRegion}
          />
        ) : (
          <p className="rounded-yakana border border-dashed border-linen bg-offwhite p-3 text-xs text-charcoal/50">
            Con la herramienta <Crop size={11} className="inline" /> marcá un rectángulo sobre el
            motivo que querés repetir en cadena (como en los tejidos nórdicos), para poder generar
            un gráfico con ese motivo repetido a todo el ancho de una parte de la prenda.
          </p>
        )}

        <ImageImportPanel
          width={width}
          height={height}
          currentColorCount={colors.length}
          onImport={handleImageImport}
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
              min={8}
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

      <div className="flex-1 overflow-auto rounded-yakana border border-linen bg-white p-2">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="cursor-crosshair"
        />
      </div>
    </div>
  );
}
