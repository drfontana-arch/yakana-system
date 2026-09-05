"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { addProjectMedia } from "@/lib/actions/project-media";

export function PhotoUploadWidget({ projectId }: { projectId: string }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
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

      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${projectId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("project-photos")
        .upload(path, file, { upsert: false });
      if (uploadErr) throw uploadErr;

      const { data: publicUrlData } = supabase.storage
        .from("project-photos")
        .getPublicUrl(path);

      await addProjectMedia(projectId, publicUrlData.publicUrl, "photo", null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir la foto.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="rounded-yakana border border-dashed border-linen bg-offwhite p-4">
      <label className="mb-1 block text-sm font-medium text-navy">Subir foto</label>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        disabled={uploading}
        className="block text-sm text-charcoal/70 file:mr-3 file:rounded-yakana file:border-0 file:bg-terracotta file:px-3 file:py-1.5 file:text-sm file:text-offwhite"
      />
      {uploading ? <p className="mt-1 text-xs text-charcoal/60">Subiendo…</p> : null}
      {error ? <p className="mt-1 text-xs text-terracotta">{error}</p> : null}
    </div>
  );
}
