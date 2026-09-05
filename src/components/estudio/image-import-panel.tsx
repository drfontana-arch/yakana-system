"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImageUp } from "lucide-react";
import { kMeansColors, nearestColorIndex, rgbToHex } from "@/lib/color/kmeans";
import { sampleImageToGrid } from "@/lib/color/sample-image";
import { PatternThumbnail } from "@/components/estudio/pattern-thumbnail";
import type { GridData, PaletteColor } from "@/lib/types/pattern";

export function ImageImportPanel({
  width,
  height,
  currentColorCount,
  onImport,
}: {
  width: number;
  height: number;
  currentColorCount: number;
  onImport: (gridData: GridData, colors: PaletteColor[]) => void;
}) {
  const [colorCount, setColorCount] = useState(Math.min(Math.max(currentColorCount, 3), 10));
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [preview, setPreview] = useState<{ grid: GridData; colors: PaletteColor[] } | null>(null);

  const imgRef = useRef<HTMLImageElement | null>(null);

  function runPreview(img: HTMLImageElement, count: number) {
    try {
      const cellColors = sampleImageToGrid(img, width, height);
      const centroids = kMeansColors(cellColors, count);
      const newColors: PaletteColor[] = centroids.map((c, i) => ({
        hex: rgbToHex(c),
        name: i === 0 ? "Fondo" : `Color ${i}`,
        yarn_id: null,
      }));

      const newGrid: GridData = {};
      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          const idx = row * width + col;
          const bestCentroid = nearestColorIndex(cellColors[idx], centroids);
          newGrid[`${col},${row}`] = newColors[bestCentroid].hex;
        }
      }

      setPreview({ grid: newGrid, colors: newColors });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo procesar la imagen.");
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setProcessing(true);
    setPreview(null);

    try {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      const img = document.createElement("img");
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("No se pudo leer la imagen"));
        img.src = url;
      });
      imgRef.current = img;

      runPreview(img, colorCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo importar la imagen.");
    } finally {
      setProcessing(false);
    }
  }

  function handleColorCountChange(value: number) {
    setColorCount(value);
    if (imgRef.current) {
      setProcessing(true);
      // Let the input update paint before the (synchronous) recompute.
      setTimeout(() => {
        runPreview(imgRef.current!, value);
        setProcessing(false);
      }, 0);
    }
  }

  function handleApply() {
    if (!preview) return;
    onImport(preview.grid, preview.colors);
    handleCancel();
  }

  function handleCancel() {
    setPreview(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
    imgRef.current = null;
  }

  return (
    <div className="rounded-yakana border border-linen bg-offwhite p-3">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-charcoal/60">
        <ImageUp size={14} />
        Importar imagen
      </p>

      {!previewUrl ? (
        <>
          <label className="mb-2 block text-xs text-navy">
            Cantidad de colores a usar
            <input
              type="number"
              min={2}
              max={10}
              value={colorCount}
              onChange={(e) => setColorCount(Number(e.target.value))}
              className="mt-1 w-full rounded-yakana border border-linen bg-white px-2 py-1 text-xs outline-none focus:border-terracotta"
            />
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFile}
            disabled={processing}
            className="block w-full text-xs text-charcoal/70 file:mr-2 file:rounded-yakana file:border-0 file:bg-terracotta file:px-2 file:py-1 file:text-xs file:text-offwhite"
          />
        </>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <div className="text-center">
              <Image
                src={previewUrl}
                alt="Imagen original"
                width={80}
                height={80}
                unoptimized
                className="mx-auto h-20 w-20 rounded-yakana border border-linen object-cover"
              />
              <p className="mt-1 text-[10px] text-charcoal/50">Original</p>
            </div>
            <span className="text-charcoal/40">→</span>
            <div className="text-center">
              {preview ? (
                <PatternThumbnail
                  gridData={preview.grid}
                  width={width}
                  height={height}
                  backgroundHex={preview.colors[0]?.hex ?? "#faf7f2"}
                  size={80}
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-yakana border border-linen text-[10px] text-charcoal/40">
                  …
                </div>
              )}
              <p className="mt-1 text-[10px] text-charcoal/50">Vista previa</p>
            </div>
          </div>

          <label className="block text-xs text-navy">
            Cantidad de colores a usar
            <input
              type="number"
              min={2}
              max={10}
              value={colorCount}
              onChange={(e) => handleColorCountChange(Number(e.target.value))}
              className="mt-1 w-full rounded-yakana border border-linen bg-white px-2 py-1 text-xs outline-none focus:border-terracotta"
            />
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleApply}
              disabled={!preview || processing}
              className="flex-1 rounded-yakana bg-terracotta px-3 py-1.5 text-xs font-medium text-offwhite hover:bg-terracotta-dark disabled:opacity-60"
            >
              Aplicar al tapiz
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-yakana border border-linen bg-white px-3 py-1.5 text-xs text-navy hover:bg-linen"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <p className="mt-1.5 text-xs text-charcoal/50">
        Al aplicar se reemplaza toda la grilla actual. Después podés ajustar cada color desde
        la paleta.
      </p>
      {processing ? <p className="mt-1 text-xs text-charcoal/60">Procesando…</p> : null}
      {error ? <p className="mt-1 text-xs text-terracotta">{error}</p> : null}
    </div>
  );
}
