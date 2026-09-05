"use client";

import Image from "next/image";
import { usePhotoUpload } from "@/lib/hooks/use-photo-upload";
import { Field } from "@/components/ui/field";
import { WEIGHT_CATEGORIES, type Yarn } from "@/lib/types/yarn";

export function YarnForm({
  yarn,
  action,
  errorMessage,
}: {
  yarn?: Yarn;
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
  } = usePhotoUpload("yarn-photos", {
    colorHex: yarn?.color_hex ?? undefined,
    photoUrl: yarn?.photo_url ?? undefined,
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
        <p className="mb-3 text-sm font-medium text-navy">Foto de la lana</p>
        <div className="flex items-center gap-4">
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-yakana border border-linen"
            style={{ backgroundColor: colorHex }}
          >
            {photoPreview ? (
              <Image
                src={photoPreview}
                alt="Foto de la lana"
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
            <p className="mt-1 text-xs text-charcoal/50">
              En el celular te va a ofrecer sacar la foto directo con la cámara.
            </p>
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
            Color aproximado
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
        <Field label="Nombre *" name="name" defaultValue={yarn?.name} required />
        <Field label="Marca" name="brand" defaultValue={yarn?.brand ?? ""} />
        <Field
          label="Nombre del colorway"
          name="colorway_name"
          defaultValue={yarn?.colorway_name ?? ""}
        />
        <Field
          label="Código del lote (dye lot)"
          name="dye_lot_code"
          defaultValue={yarn?.dye_lot_code ?? ""}
        />
        <Field
          label="Código de color"
          name="color_code"
          defaultValue={yarn?.color_code ?? ""}
        />
        <Field
          label="Composición (fibra)"
          name="fiber_content"
          defaultValue={yarn?.fiber_content ?? ""}
          placeholder="Lana merino, alpaca, algodón..."
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-navy" htmlFor="weight_category">
            Grosor
          </label>
          <select
            id="weight_category"
            name="weight_category"
            defaultValue={yarn?.weight_category ?? ""}
            className="w-full rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
          >
            <option value="">Sin especificar</option>
            {WEIGHT_CATEGORIES.map((w) => (
              <option key={w.value} value={w.value}>
                {w.label}
              </option>
            ))}
          </select>
        </div>

        <Field
          label="Aguja recomendada (mm)"
          name="recommended_needle_mm"
          type="number"
          step="0.25"
          defaultValue={yarn?.recommended_needle_mm ?? ""}
        />
        <Field
          label="Peso por madeja (g)"
          name="skein_weight_grams"
          type="number"
          step="0.01"
          defaultValue={yarn?.skein_weight_grams ?? ""}
        />
        <Field
          label="Metraje por madeja (m)"
          name="skein_yardage_meters"
          type="number"
          step="0.01"
          defaultValue={yarn?.skein_yardage_meters ?? ""}
        />
        <Field
          label="Cantidad en stock (madejas)"
          name="quantity_skeins"
          type="number"
          step="0.01"
          defaultValue={yarn?.quantity_skeins ?? ""}
        />
        <Field
          label="Cantidad en stock (gramos)"
          name="quantity_grams"
          type="number"
          step="0.01"
          defaultValue={yarn?.quantity_grams ?? ""}
        />
        <Field
          label="Costo por madeja ($)"
          name="cost_per_skein"
          type="number"
          step="0.01"
          defaultValue={yarn?.cost_per_skein ?? ""}
        />
        <Field
          label="Etiquetas (separadas por coma)"
          name="tags"
          defaultValue={yarn?.tags?.join(", ") ?? ""}
          placeholder="suave, importada, bebé"
        />
        <Field
          label="Ubicación física"
          name="location"
          defaultValue={yarn?.location ?? ""}
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
          defaultValue={yarn?.notes ?? ""}
          className="w-full rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
        />
      </div>

      <button
        type="submit"
        disabled={uploading}
        className="rounded-yakana bg-terracotta px-5 py-2.5 text-sm font-medium text-offwhite transition-colors hover:bg-terracotta-dark disabled:opacity-60"
      >
        {yarn ? "Guardar cambios" : "Agregar lana"}
      </button>
    </form>
  );
}
