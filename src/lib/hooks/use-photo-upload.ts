"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

function extractAverageColor(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 40;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("No se pudo leer la imagen"));
        return;
      }
      ctx.drawImage(img, 0, 0, size, size);
      const { data } = ctx.getImageData(0, 0, size, size);
      let r = 0;
      let g = 0;
      let b = 0;
      const pixelCount = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
      }
      r = Math.round(r / pixelCount);
      g = Math.round(g / pixelCount);
      b = Math.round(b / pixelCount);
      const hex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
      URL.revokeObjectURL(url);
      resolve(hex);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen"));
    };
    img.src = url;
  });
}

export function usePhotoUpload(bucket: string, initial?: { colorHex?: string; photoUrl?: string }) {
  const [colorHex, setColorHex] = useState(initial?.colorHex ?? "#8b3a2a");
  const [photoUrl, setPhotoUrl] = useState(initial?.photoUrl ?? "");
  const [photoPreview, setPhotoPreview] = useState(initial?.photoUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");
    setPhotoPreview(URL.createObjectURL(file));

    try {
      const hex = await extractAverageColor(file);
      setColorHex(hex);
    } catch {
      // color extraction is best-effort; user can still pick manually
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesión expirada, volvé a ingresar.");

      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        upsert: false,
      });
      if (error) throw error;

      const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(path);
      setPhotoUrl(publicUrlData.publicUrl);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "No se pudo subir la foto.");
    } finally {
      setUploading(false);
    }
  }

  return {
    colorHex,
    setColorHex,
    photoUrl,
    photoPreview,
    uploading,
    uploadError,
    handlePhotoChange,
  };
}
