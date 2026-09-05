"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUp, Save, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { addContentMedia, removeContentMedia } from "@/lib/actions/content";
import { formatSpec } from "@/lib/types/content";

const WATERMARK_POSITION_STYLES: Record<string, { x: (w: number, m: number, s: number) => number; y: (h: number, m: number, s: number) => number }> = {
  "top-left": { x: (_w, m) => m, y: (_h, m) => m },
  "top-right": { x: (w, m, s) => w - m - s, y: (_h, m) => m },
  "bottom-left": { x: (_w, m) => m, y: (h, m, s) => h - m - s },
  "bottom-right": { x: (w, m, s) => w - m - s, y: (h, m, s) => h - m - s },
};

function loadImage(src: string, crossOrigin = true): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    if (crossOrigin) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo cargar la imagen"));
    img.src = src;
  });
}

export function ImageComposer({
  contentId,
  format,
  projectPhotos,
  watermarkPosition,
  watermarkOpacity,
  existingMedia,
}: {
  contentId: string;
  format: string;
  projectPhotos: { id: string; file_url: string }[];
  watermarkPosition: string;
  watermarkOpacity: number;
  existingMedia: string[];
}) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(projectPhotos[0]?.file_url ?? null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);

  const spec = formatSpec(format);

  useEffect(() => {
    let cancelled = false;
    async function draw() {
      const canvas = canvasRef.current;
      if (!canvas || !sourceUrl) return;
      setReady(false);
      setError("");
      try {
        const [source, logo] = await Promise.all([
          loadImage(sourceUrl),
          loadImage("/brand/yakana-logo.png", false),
        ]);
        if (cancelled) return;

        canvas.width = spec.width;
        canvas.height = spec.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Cover-fit crop: scale the source so it fills the target box, then
        // center-crop whatever overflows either dimension.
        const scale = Math.max(spec.width / source.width, spec.height / source.height);
        const drawW = source.width * scale;
        const drawH = source.height * scale;
        const dx = (spec.width - drawW) / 2;
        const dy = (spec.height - drawH) / 2;
        ctx.drawImage(source, dx, dy, drawW, drawH);

        const logoSize = Math.min(spec.width, spec.height) * 0.14;
        const margin = Math.min(spec.width, spec.height) * 0.04;
        const pos = WATERMARK_POSITION_STYLES[watermarkPosition] ?? WATERMARK_POSITION_STYLES["bottom-right"];
        ctx.globalAlpha = watermarkOpacity;
        ctx.drawImage(
          logo,
          pos.x(spec.width, margin, logoSize),
          pos.y(spec.height, margin, logoSize),
          logoSize,
          logoSize,
        );
        ctx.globalAlpha = 1;

        setReady(true);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "No se pudo componer la imagen.");
      }
    }
    draw();
    return () => {
      cancelled = true;
    };
  }, [sourceUrl, spec, watermarkPosition, watermarkOpacity]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSourceUrl(URL.createObjectURL(file));
  }

  async function handleSave() {
    const canvas = canvasRef.current;
    if (!canvas || !ready) return;
    setSaving(true);
    setError("");
    try {
      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.92),
      );
      if (!blob) throw new Error("No se pudo generar el archivo de imagen.");

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesión expirada, volvé a ingresar.");

      const path = `${user.id}/social-${crypto.randomUUID()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("project-photos")
        .upload(path, blob, { upsert: false, contentType: "image/jpeg" });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from("project-photos").getPublicUrl(path);
      await addContentMedia(contentId, publicUrlData.publicUrl);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la imagen.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(url: string) {
    await removeContentMedia(contentId, url);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {projectPhotos.length > 0 ? (
        <div>
          <p className="mb-1.5 text-xs font-medium text-navy">Elegí una foto del proyecto</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {projectPhotos.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSourceUrl(p.file_url)}
                className={`h-14 w-14 shrink-0 overflow-hidden rounded-yakana border ${
                  sourceUrl === p.file_url ? "border-terracotta" : "border-linen"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.file_url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <label className="flex items-center gap-1.5 text-xs font-medium text-terracotta">
        <ImageUp size={14} />
        <span>O subí una foto nueva</span>
        <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </label>

      {sourceUrl ? (
        <div>
          <p className="mb-1.5 text-xs text-charcoal/50">
            Vista previa ({spec.label}) — recorte automático + tu marca de agua
          </p>
          <canvas
            ref={canvasRef}
            className="w-full max-w-[260px] rounded-yakana border border-linen bg-linen/30"
            style={{ aspectRatio: `${spec.width} / ${spec.height}` }}
          />
        </div>
      ) : (
        <p className="text-xs text-charcoal/50">
          Todavía no hay fotos en este proyecto — subí una para componer la imagen.
        </p>
      )}

      {sourceUrl ? (
        <button
          type="button"
          onClick={handleSave}
          disabled={!ready || saving}
          className="flex items-center gap-1.5 rounded-yakana bg-terracotta px-3 py-1.5 text-xs font-medium text-offwhite hover:bg-terracotta-dark disabled:opacity-50"
        >
          <Save size={13} />
          {saving ? "Guardando…" : "Guardar imagen compuesta"}
        </button>
      ) : null}

      {error ? <p className="text-xs text-terracotta">{error}</p> : null}

      {existingMedia.length > 0 ? (
        <div>
          <p className="mb-1.5 text-xs font-medium text-navy">Imágenes guardadas</p>
          <div className="flex flex-wrap gap-2">
            {existingMedia.map((url) => (
              <div key={url} className="relative h-16 w-16 overflow-hidden rounded-yakana border border-linen">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemove(url)}
                  className="absolute right-0.5 top-0.5 rounded-full bg-charcoal/70 p-0.5 text-offwhite"
                  title="Quitar"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
