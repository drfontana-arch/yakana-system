"use client";

import { useEffect, useRef, useState } from "react";
import { ImageUp, Pipette, X, Package } from "lucide-react";
import { extractDominantColors, pickPixelColor } from "@/lib/color/extract-dominant";
import { createGlobalPalette } from "@/lib/actions/palettes";
import { createClient } from "@/lib/supabase/client";
import type { PaletteColor } from "@/lib/types/pattern";

type YarnPhoto = { id: string; name: string; photo_url: string };

export function PhotoExtractor() {
  const [photoUrl, setPhotoUrl] = useState("");
  const [colorCount, setColorCount] = useState(6);
  const [swatches, setSwatches] = useState<PaletteColor[]>([]);
  const [paletteName, setPaletteName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  const [yarnPhotos, setYarnPhotos] = useState<YarnPhoto[]>([]);
  const [canvasReady, setCanvasReady] = useState(false);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("yarns")
        .select("id, name, photo_url")
        .not("photo_url", "is", null)
        .order("name");
      setYarnPhotos((data as YarnPhoto[]) ?? []);
    });
  }, []);

  async function loadImage(url: string) {
    setError("");
    setProcessing(true);
    setCanvasReady(false);
    try {
      setPhotoUrl(url);

      const img = document.createElement("img");
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("No se pudo leer la imagen"));
        img.src = url;
      });
      imgRef.current = img;
      runExtraction(img, colorCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo importar la imagen.");
    } finally {
      setProcessing(false);
    }
  }

  function runExtraction(img: HTMLImageElement, count: number) {
    try {
      const hexes = extractDominantColors(img, count);
      setSwatches(hexes.map((hex, i) => ({ hex, name: `Color ${i + 1}`, yarn_id: null })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo procesar la imagen.");
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await loadImage(URL.createObjectURL(file));
  }

  function handleColorCountChange(value: number) {
    setColorCount(value);
    if (imgRef.current) runExtraction(imgRef.current, value);
  }

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas || !canvasReady) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * canvas.width);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * canvas.height);
    try {
      const hex = pickPixelColor(canvas, x, y);
      setSwatches((s) => [...s, { hex, name: `Color ${s.length + 1}`, yarn_id: null }]);
    } catch {
      // ignore out-of-bounds clicks
    }
  }

  function removeSwatch(index: number) {
    setSwatches((s) => s.filter((_, i) => i !== index));
  }

  function renameSwatch(index: number, name: string) {
    setSwatches((s) => s.map((c, i) => (i === index ? { ...c, name } : c)));
  }

  async function handleSave() {
    if (swatches.length === 0 || !paletteName.trim()) return;
    await createGlobalPalette(paletteName.trim(), swatches);
    setSaveMessage("Paleta guardada ✓");
    setPaletteName("");
    setTimeout(() => setSaveMessage(""), 2500);
  }

  return (
    <section className="rounded-yakana border border-linen bg-offwhite p-4">
      <h2 className="mb-3 flex items-center gap-2 font-heading text-lg italic text-navy">
        <ImageUp size={18} />
        Extraer paleta de una foto
      </h2>

      <input
        type="file"
        accept="image/*"
        onChange={handleFile}
        disabled={processing}
        className="mb-3 block w-full text-sm text-charcoal/70 file:mr-3 file:rounded-yakana file:border-0 file:bg-terracotta file:px-3 file:py-1.5 file:text-sm file:text-offwhite"
      />

      {yarnPhotos.length > 0 ? (
        <div className="mb-3">
          <p className="mb-1.5 flex items-center gap-1 text-xs font-medium text-navy">
            <Package size={13} />O elegí una lana de tu inventario
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {yarnPhotos.map((y) => (
              <button
                key={y.id}
                type="button"
                onClick={() => loadImage(y.photo_url)}
                title={y.name}
                className="h-14 w-14 shrink-0 overflow-hidden rounded-yakana border border-linen hover:border-terracotta"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={y.photo_url} alt={y.name} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {photoUrl ? (
        <>
          <div className="relative">
            <PhotoCanvas
              url={photoUrl}
              canvasRef={canvasRef}
              onClick={handleCanvasClick}
              onReady={() => setCanvasReady(true)}
            />
            {!canvasReady ? (
              <div className="absolute inset-0 flex items-center justify-center rounded-yakana bg-offwhite/70 text-xs text-charcoal/60">
                Cargando foto…
              </div>
            ) : null}
          </div>
          <p className="mb-3 mt-1.5 flex items-center gap-1 text-xs text-charcoal/50">
            <Pipette size={12} />
            {canvasReady
              ? "Hacé clic en la foto para sumar el color exacto de ese punto (gotero)."
              : "Esperá a que cargue la foto para poder usar el gotero."}
          </p>

          <label className="mb-3 block text-xs font-medium text-navy">
            Cantidad de colores a detectar
            <input
              type="number"
              min={2}
              max={10}
              value={colorCount}
              onChange={(e) => handleColorCountChange(Number(e.target.value))}
              className="mt-1 w-full rounded-yakana border border-linen bg-white px-2 py-1 text-sm outline-none focus:border-terracotta"
            />
          </label>

          {swatches.length > 0 ? (
            <div className="mb-3 space-y-1.5">
              {swatches.map((c, i) => (
                <div key={i} className="flex items-center gap-2 rounded-yakana bg-white px-2 py-1">
                  <div
                    className="h-6 w-6 shrink-0 rounded border border-linen"
                    style={{ backgroundColor: c.hex }}
                  />
                  <input
                    value={c.name}
                    onChange={(e) => renameSwatch(i, e.target.value)}
                    className="flex-1 bg-transparent text-xs text-charcoal/80 outline-none"
                  />
                  <span className="text-xs text-charcoal/50">{c.hex}</span>
                  <button
                    type="button"
                    onClick={() => removeSwatch(i)}
                    className="text-charcoal/40 hover:text-terracotta"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            <input
              value={paletteName}
              onChange={(e) => setPaletteName(e.target.value)}
              placeholder="Nombre de la paleta"
              className="flex-1 rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={swatches.length === 0 || !paletteName.trim()}
              className="rounded-yakana bg-terracotta px-4 py-2 text-sm font-medium text-offwhite hover:bg-terracotta-dark disabled:opacity-50"
            >
              Guardar paleta
            </button>
          </div>
          <span className="mt-1 block text-xs text-olive">{saveMessage}</span>
        </>
      ) : null}

      {error ? <p className="mt-2 text-xs text-terracotta">{error}</p> : null}
      <p className="mt-2 text-xs text-charcoal/50">
        Los colores en pantalla no son exactos a la lana real — usalos como referencia, no
        como calibración de color.
      </p>
    </section>
  );
}

function PhotoCanvas({
  url,
  canvasRef,
  onClick,
  onReady,
}: {
  url: string;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onClick: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onReady: () => void;
}) {
  useEffect(() => {
    const node = canvasRef.current;
    if (!node) return;
    const img = document.createElement("img");
    img.crossOrigin = "anonymous";
    img.onload = () => {
      node.width = img.naturalWidth;
      node.height = img.naturalHeight;
      const ctx = node.getContext("2d");
      ctx?.drawImage(img, 0, 0);
      onReady();
    };
    img.src = url;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return (
    <canvas
      ref={canvasRef}
      onClick={onClick}
      className="mb-2 w-full cursor-crosshair rounded-yakana border border-linen"
    />
  );
}
