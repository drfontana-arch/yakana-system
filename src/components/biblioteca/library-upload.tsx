"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LibraryUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [filePath, setFilePath] = useState("");
  const [fileName, setFileName] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setUploading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesión expirada, volvé a ingresar.");

      const ext = file.name.split(".").pop() || "pdf";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("pattern-library")
        .upload(path, file, { upsert: false });
      if (uploadErr) throw uploadErr;

      setFilePath(path);
      setFileName(file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir el archivo.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <input type="hidden" name="file_url" value={filePath} />
      <label className="mb-1 block text-sm font-medium text-navy">Archivo (PDF o imagen)</label>
      <input
        type="file"
        accept="image/*,application/pdf"
        onChange={handleFile}
        disabled={uploading}
        className="block w-full text-sm text-charcoal/70 file:mr-3 file:rounded-yakana file:border-0 file:bg-terracotta file:px-3 file:py-1.5 file:text-sm file:text-offwhite"
      />
      {uploading ? <p className="mt-1 text-xs text-charcoal/60">Subiendo…</p> : null}
      {fileName ? <p className="mt-1 text-xs text-olive">{fileName} ✓</p> : null}
      {error ? <p className="mt-1 text-xs text-terracotta">{error}</p> : null}
    </div>
  );
}
