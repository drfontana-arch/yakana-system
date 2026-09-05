"use client";

import Image from "next/image";
import { usePhotoUpload } from "@/lib/hooks/use-photo-upload";
import { Field } from "@/components/ui/field";
import { SUPPLY_CATEGORIES, type Supply } from "@/lib/types/supply";

export function SupplyForm({
  supply,
  action,
  errorMessage,
}: {
  supply?: Supply;
  action: (formData: FormData) => void;
  errorMessage?: string;
}) {
  const {
    colorHex,
    setColorHex,
    photoUrl,
    photoPreview,
    uploading,
    uploadError,
    handlePhotoChange,
  } = usePhotoUpload("supply-photos", {
    colorHex: supply?.color_hex ?? undefined,
    photoUrl: supply?.photo_url ?? undefined,
  });

  return (
    <form action={action} className="max-w-3xl space-y-6">
      {errorMessage ? (
        <p className="rounded-yakana border border-terracotta/30 bg-terracotta/10 px-3 py-2 text-sm text-terracotta">
          {errorMessage}
        </p>
      ) : null}

      <input type="hidden" name="photo_url" value={photoUrl} />

      <div className="rounded-yakana border border-linen bg-offwhite p-5">
        <p className="mb-3 text-sm font-medium text-navy">Foto</p>
        <div className="flex items-center gap-4">
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-yakana border border-linen"
            style={{ backgroundColor: colorHex }}
          >
            {photoPreview ? (
              <Image
                src={photoPreview}
                alt="Foto del material"
                width={80}
                height={80}
                unoptimized
                className="h-20 w-20 object-cover"
              />
            ) : null}
          </div>
          <div>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
              className="block text-sm text-charcoal/70 file:mr-3 file:rounded-yakana file:border-0 file:bg-terracotta file:px-3 file:py-1.5 file:text-sm file:text-offwhite"
            />
            {uploading ? (
              <p className="mt-1 text-xs text-charcoal/60">Subiendo foto…</p>
            ) : null}
            {uploadError ? (
              <p className="mt-1 text-xs text-terracotta">{uploadError}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <label className="text-sm font-medium text-navy" htmlFor="color_hex">
            Color
          </label>
          <input
            id="color_hex"
            type="color"
            value={colorHex}
            onChange={(e) => setColorHex(e.target.value)}
            className="h-9 w-14 cursor-pointer rounded border border-linen"
          />
          <input type="hidden" name="color_hex" value={colorHex} />
          <span className="text-xs text-charcoal/60">{colorHex}</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-navy" htmlFor="category">
            Categoría *
          </label>
          <select
            id="category"
            name="category"
            required
            defaultValue={supply?.category ?? ""}
            className="w-full rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
          >
            <option value="" disabled>
              Elegí una categoría
            </option>
            {SUPPLY_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <Field
          label="Nombre *"
          name="name"
          defaultValue={supply?.name}
          required
          placeholder="Aguja circular Addi 4mm 80cm"
        />
        <Field label="Marca" name="brand" defaultValue={supply?.brand ?? ""} />
        <Field
          label="Material"
          name="material"
          defaultValue={supply?.material ?? ""}
          placeholder="Metal, madera, bambú, plástico..."
        />
        <Field
          label="Grosor / diámetro (mm)"
          name="size_mm"
          type="number"
          step="0.25"
          defaultValue={supply?.size_mm ?? ""}
        />
        <Field
          label="Largo del cable (cm) — solo circulares"
          name="cable_length_cm"
          type="number"
          step="1"
          defaultValue={supply?.cable_length_cm ?? ""}
        />
        <Field
          label="Cantidad"
          name="quantity"
          type="number"
          step="1"
          defaultValue={supply?.quantity ?? ""}
        />
        <Field
          label="Costo ($)"
          name="cost"
          type="number"
          step="0.01"
          defaultValue={supply?.cost ?? ""}
        />
        <Field
          label="Etiquetas (separadas por coma)"
          name="tags"
          defaultValue={supply?.tags?.join(", ") ?? ""}
          placeholder="favorito, prestado"
        />
        <Field
          label="Ubicación física"
          name="location"
          defaultValue={supply?.location ?? ""}
          placeholder="Estante 2, caja azul..."
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-navy" htmlFor="notes">
          Notas
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={supply?.notes ?? ""}
          className="w-full rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
        />
      </div>

      <button
        type="submit"
        disabled={uploading}
        className="rounded-yakana bg-terracotta px-5 py-2.5 text-sm font-medium text-offwhite transition-colors hover:bg-terracotta-dark disabled:opacity-60"
      >
        {supply ? "Guardar cambios" : "Agregar material"}
      </button>
    </form>
  );
}
