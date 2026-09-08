"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import {
  calculateRaglan,
  buildRowByRowInstructions,
  calculateYarnMeters,
  type RaglanInputs,
} from "@/lib/calculators/raglan";
import { updateStandardSize } from "@/lib/actions/sizes";
import { saveRaglanCalculation } from "@/lib/actions/raglan";
import { reviewRaglanCalculation } from "@/lib/actions/ai";
import {
  NECK_STYLES,
  CLOSURE_TYPES,
  BODY_FITS,
  type ClosureType,
  type BodyFit,
} from "@/lib/calculators/raglan-options";
import {
  GarmentSketch,
  GARMENT_ZONE_LABELS,
  type GarmentZone,
} from "@/components/calculadora/garment-sketch";
import { SIZE_CATEGORIES, type StandardSize } from "@/lib/types/size";
import type { Project } from "@/lib/types/project";

type Measurements = {
  chestCm: number;
  bodyLengthCm: number;
  yokeDepthCm: number;
  neckCm: number;
  shoulderWidthCm: number;
  sleeveLengthCm: number;
  sleeveCircumferenceCm: number;
  cuffCircumferenceCm: number;
};

const EMPTY_MEASUREMENTS: Measurements = {
  chestCm: 0,
  bodyLengthCm: 0,
  yokeDepthCm: 0,
  neckCm: 0,
  shoulderWidthCm: 0,
  sleeveLengthCm: 0,
  sleeveCircumferenceCm: 0,
  cuffCircumferenceCm: 0,
};

function fromStandardSize(size: StandardSize): Measurements {
  return {
    chestCm: size.chest_cm ?? 0,
    bodyLengthCm: size.body_length_cm ?? 0,
    yokeDepthCm: size.yoke_depth_cm ?? 0,
    neckCm: size.neck_cm ?? 0,
    shoulderWidthCm: size.shoulder_width_cm ?? 0,
    sleeveLengthCm: size.sleeve_length_cm ?? 0,
    sleeveCircumferenceCm: size.sleeve_circumference_cm ?? 0,
    cuffCircumferenceCm: size.cuff_circumference_cm ?? 0,
  };
}

export function RaglanCalculator({
  sizes,
  defaultWastePct,
  projects,
}: {
  sizes: StandardSize[];
  defaultWastePct: number;
  projects: Project[];
}) {
  const [category, setCategory] = useState("adult");
  const [sizeId, setSizeId] = useState<string>("");
  const [measurements, setMeasurements] = useState<Measurements>(EMPTY_MEASUREMENTS);

  const [stitchesPer10cm, setStitchesPer10cm] = useState(20);
  const [rowsPer10cm, setRowsPer10cm] = useState(28);
  const [needleMm, setNeedleMm] = useState(4);

  const [direction, setDirection] = useState<"top_down" | "bottom_up">("top_down");
  const [neckStyle, setNeckStyle] = useState("crew");
  const [closureType, setClosureType] = useState<ClosureType>("pullover");
  const [bodyFit, setBodyFit] = useState<BodyFit>("straight");
  const [shortRows, setShortRows] = useState(false);
  const [underarmEaseCm, setUnderarmEaseCm] = useState(3);
  const [wastePct, setWastePct] = useState(defaultWastePct);

  const [projectId, setProjectId] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [sizeSaveMessage, setSizeSaveMessage] = useState("");
  const [highlightZone, setHighlightZone] = useState<GarmentZone | null>(null);

  const [miniEnabled, setMiniEnabled] = useState(false);
  const [miniScalePct, setMiniScalePct] = useState(33);
  const [saveMiniToo, setSaveMiniToo] = useState(false);

  const [review, setReview] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");

  const sizesByCategory = sizes.filter((s) => s.category === category);
  const selectedSize = sizes.find((s) => s.id === sizeId);

  function handlePickSize(id: string) {
    setSizeId(id);
    const size = sizes.find((s) => s.id === id);
    if (size) setMeasurements(fromStandardSize(size));
  }

  function updateMeasurement(key: keyof Measurements, value: number) {
    setMeasurements((m) => ({ ...m, [key]: value }));
  }

  const oversizeEaseCm = bodyFit === "oversize" ? 10 : 0;

  const inputs: RaglanInputs = {
    stitchesPer10cm,
    rowsPer10cm,
    chestCm: measurements.chestCm + oversizeEaseCm,
    yokeDepthCm: measurements.yokeDepthCm,
    bodyLengthCm: measurements.bodyLengthCm,
    neckCm: measurements.neckCm,
    sleeveLengthCm: measurements.sleeveLengthCm,
    sleeveCircumferenceCm: measurements.sleeveCircumferenceCm,
    cuffCircumferenceCm: measurements.cuffCircumferenceCm,
    underarmEaseCm,
    direction,
  };

  const ready =
    stitchesPer10cm > 0 &&
    rowsPer10cm > 0 &&
    measurements.chestCm > 0 &&
    measurements.neckCm > 0 &&
    measurements.yokeDepthCm > 0;

  // Plain (unmemoized) — the raglan math is cheap arithmetic, so there is no
  // benefit to memoizing it, and it sidesteps stale-closure bugs entirely.
  const results = ready ? calculateRaglan(inputs) : null;
  const instructions = results
    ? buildRowByRowInstructions(inputs, results, neckStyle, shortRows, closureType, bodyFit)
    : [];
  const yarnMeters = results ? calculateYarnMeters(results, stitchesPer10cm, wastePct) : 0;

  const scale = miniScalePct / 100;
  const miniMeasurements: Measurements = {
    chestCm: (measurements.chestCm + oversizeEaseCm) * scale,
    bodyLengthCm: measurements.bodyLengthCm * scale,
    yokeDepthCm: measurements.yokeDepthCm * scale,
    neckCm: measurements.neckCm * scale,
    shoulderWidthCm: measurements.shoulderWidthCm * scale,
    sleeveLengthCm: measurements.sleeveLengthCm * scale,
    sleeveCircumferenceCm: measurements.sleeveCircumferenceCm * scale,
    cuffCircumferenceCm: measurements.cuffCircumferenceCm * scale,
  };
  const miniInputs: RaglanInputs = {
    ...inputs,
    chestCm: miniMeasurements.chestCm,
    yokeDepthCm: miniMeasurements.yokeDepthCm,
    bodyLengthCm: miniMeasurements.bodyLengthCm,
    neckCm: miniMeasurements.neckCm,
    sleeveLengthCm: miniMeasurements.sleeveLengthCm,
    sleeveCircumferenceCm: miniMeasurements.sleeveCircumferenceCm,
    cuffCircumferenceCm: miniMeasurements.cuffCircumferenceCm,
  };
  const miniResults = miniEnabled && results ? calculateRaglan(miniInputs) : null;
  const miniInstructions = miniResults
    ? buildRowByRowInstructions(miniInputs, miniResults, neckStyle, false, closureType, bodyFit)
    : [];
  const miniYarnMeters = miniResults
    ? calculateYarnMeters(miniResults, stitchesPer10cm, wastePct)
    : 0;

  async function handleReview() {
    if (!results) return;
    setReviewLoading(true);
    setReviewError("");
    setReview("");
    const result = await reviewRaglanCalculation(inputs, results);
    setReviewLoading(false);
    if ("error" in result) {
      setReviewError(result.error);
      return;
    }
    setReview(result.review);
  }

  async function handleSaveSize() {
    if (!sizeId) return;
    const formData = new FormData();
    formData.set("chest_cm", String(measurements.chestCm));
    formData.set("body_length_cm", String(measurements.bodyLengthCm));
    formData.set("yoke_depth_cm", String(measurements.yokeDepthCm));
    formData.set("neck_cm", String(measurements.neckCm));
    formData.set("shoulder_width_cm", String(measurements.shoulderWidthCm));
    formData.set("sleeve_length_cm", String(measurements.sleeveLengthCm));
    formData.set("sleeve_circumference_cm", String(measurements.sleeveCircumferenceCm));
    formData.set("cuff_circumference_cm", String(measurements.cuffCircumferenceCm));
    await updateStandardSize(sizeId, formData);
    setSizeSaveMessage("Guardado ✓");
    setTimeout(() => setSizeSaveMessage(""), 2000);
  }

  async function handleSaveToProject() {
    if (!projectId || !results) return;
    const designChoices = { neckStyle, bodyFit, closureType };
    await saveRaglanCalculation(
      projectId,
      selectedSize?.size_label ?? "Personalizada",
      { ...measurements, chestCm: measurements.chestCm + oversizeEaseCm, ...designChoices },
      results,
      instructions,
      { stitchesPer10cm, rowsPer10cm, needleMm },
    );
    if (saveMiniToo && miniResults) {
      await saveRaglanCalculation(
        projectId,
        `${selectedSize?.size_label ?? "Personalizada"} — miniatura ${miniScalePct}%`,
        { ...miniMeasurements, ...designChoices },
        miniResults,
        miniInstructions,
        { stitchesPer10cm, rowsPer10cm, needleMm },
        true,
      );
    }
    setSaveMessage("Guardado en el proyecto ✓");
    setTimeout(() => setSaveMessage(""), 2500);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-5">
        <section className="rounded-yakana border border-linen bg-offwhite p-4">
          <h2 className="mb-3 font-heading text-lg italic text-navy">Muestra</h2>
          <div className="grid grid-cols-3 gap-3">
            <NumField
              label="Puntos / 10cm"
              value={stitchesPer10cm}
              onChange={setStitchesPer10cm}
            />
            <NumField label="Vueltas / 10cm" value={rowsPer10cm} onChange={setRowsPer10cm} />
            <NumField label="Aguja (mm)" value={needleMm} onChange={setNeedleMm} step={0.25} />
          </div>
        </section>

        <section className="rounded-yakana border border-linen bg-offwhite p-4">
          <h2 className="mb-3 font-heading text-lg italic text-navy">Talla</h2>
          <div className="mb-3 flex flex-wrap gap-2">
            {SIZE_CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  category === c.value
                    ? "bg-terracotta text-offwhite"
                    : "border border-linen bg-white text-navy"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <select
            value={sizeId}
            onChange={(e) => handlePickSize(e.target.value)}
            className="mb-3 w-full rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
          >
            <option value="">Medidas personalizadas</option>
            {sizesByCategory.map((s) => (
              <option key={s.id} value={s.id}>
                {s.size_label}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-3">
            <NumField
              label="Contorno de pecho"
              value={measurements.chestCm}
              onChange={(v) => updateMeasurement("chestCm", v)}
            />
            <NumField
              label="Largo del cuerpo (axila-basta)"
              value={measurements.bodyLengthCm}
              onChange={(v) => updateMeasurement("bodyLengthCm", v)}
            />
            <NumField
              label="Profundidad del canesú"
              value={measurements.yokeDepthCm}
              onChange={(v) => updateMeasurement("yokeDepthCm", v)}
            />
            <NumField
              label="Contorno de cuello"
              value={measurements.neckCm}
              onChange={(v) => updateMeasurement("neckCm", v)}
            />
            <NumField
              label="Ancho de hombros"
              value={measurements.shoulderWidthCm}
              onChange={(v) => updateMeasurement("shoulderWidthCm", v)}
            />
            <NumField
              label="Largo de manga"
              value={measurements.sleeveLengthCm}
              onChange={(v) => updateMeasurement("sleeveLengthCm", v)}
            />
            <NumField
              label="Contorno de manga"
              value={measurements.sleeveCircumferenceCm}
              onChange={(v) => updateMeasurement("sleeveCircumferenceCm", v)}
            />
            <NumField
              label="Contorno de puño"
              value={measurements.cuffCircumferenceCm}
              onChange={(v) => updateMeasurement("cuffCircumferenceCm", v)}
            />
          </div>

          {sizeId ? (
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveSize}
                className="rounded-yakana border border-linen bg-white px-3 py-1.5 text-xs font-medium text-navy hover:bg-linen"
              >
                Guardar cambios en esta talla
              </button>
              <span className="text-xs text-olive">{sizeSaveMessage}</span>
            </div>
          ) : (
            <p className="mt-3 text-xs text-charcoal/50">
              Editaste medidas personalizadas — no se guardan en una talla estándar.
            </p>
          )}
        </section>

        <section className="rounded-yakana border border-linen bg-offwhite p-4">
          <h2 className="mb-3 font-heading text-lg italic text-navy">Construcción</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-navy">Dirección</label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as "top_down" | "bottom_up")}
                className="w-full rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
              >
                <option value="top_down">De arriba hacia abajo</option>
                <option value="bottom_up">De abajo hacia arriba</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-navy">Cuello</label>
              <select
                value={neckStyle}
                onChange={(e) => setNeckStyle(e.target.value)}
                className="w-full rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
              >
                {NECK_STYLES.map((n) => (
                  <option key={n.value} value={n.value}>
                    {n.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-navy">Entalle del cuerpo</label>
              <select
                value={bodyFit}
                onChange={(e) => setBodyFit(e.target.value as BodyFit)}
                className="w-full rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
              >
                {BODY_FITS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-navy">Tipo de cierre</label>
              <select
                value={closureType}
                onChange={(e) => setClosureType(e.target.value as ClosureType)}
                className="w-full rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
              >
                {CLOSURE_TYPES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <NumField
              label="Holgura (cm)"
              value={underarmEaseCm}
              onChange={setUnderarmEaseCm}
            />
            <NumField label="Merma de lana (%)" value={wastePct} onChange={setWastePct} />
          </div>
          <label className="mt-3 flex items-center gap-2 text-xs text-navy">
            <input
              type="checkbox"
              checked={shortRows}
              onChange={(e) => setShortRows(e.target.checked)}
            />
            Usar vueltas cortas para el cuello
          </label>
          {neckStyle !== "crew" ? (
            <p className="mt-2 text-xs text-charcoal/50">
              El cuello elegido necesita disminuciones o vueltas adicionales manuales que esta
              calculadora todavía no detalla automáticamente — usá el conteo de puntos como
              base.
            </p>
          ) : null}
          {closureType !== "pullover" ? (
            <p className="mt-2 text-xs text-charcoal/50">
              Con este cierre, el cuerpo se teje plano (no en redondo) desde la separación de
              mangas, dividido en dos delanteros — mirá el detalle en las instrucciones.
            </p>
          ) : null}
        </section>

        <section className="rounded-yakana border border-linen bg-offwhite p-4">
          <h2 className="mb-3 font-heading text-lg italic text-navy">
            🧸 Versión miniatura (para muñecas)
          </h2>
          <label className="flex items-center gap-2 text-sm text-navy">
            <input
              type="checkbox"
              checked={miniEnabled}
              onChange={(e) => setMiniEnabled(e.target.checked)}
            />
            Generar también una versión mini con la misma lana y aguja
          </label>
          {miniEnabled ? (
            <div className="mt-3 max-w-[160px]">
              <NumField
                label="Escala (% del tamaño real)"
                value={miniScalePct}
                onChange={setMiniScalePct}
              />
            </div>
          ) : null}
          <p className="mt-2 text-xs text-charcoal/50">
            Útil para probar el diseño y las técnicas antes de tejer la prenda real, o como
            regalito a juego.
          </p>
        </section>
      </div>

      <div className="space-y-5">
        {!results ? (
          <div className="rounded-yakana border border-dashed border-linen bg-offwhite p-6 text-center text-sm text-charcoal/60">
            Completá la muestra y al menos el contorno de pecho, cuello y profundidad del
            canesú para ver los resultados.
          </div>
        ) : (
          <>
            <section className="rounded-yakana border border-linen bg-offwhite p-4">
              <h2 className="mb-3 font-heading text-lg italic text-navy">Resumen</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Stat label="Montado de cuello" value={`${results.neckCastOn} p.`} />
                <Stat label="Puntos en la axila" value={`${results.underarmStitches} p.`} />
                <Stat
                  label="Aumentos del canesú"
                  value={`${results.increaseRounds} veces, cada ${results.increaseEveryNRows} vueltas`}
                />
                <Stat label="Vueltas del canesú" value={`${results.yokeRows}`} />
                <Stat label="Vueltas del cuerpo" value={`${results.bodyRows}`} />
                <Stat
                  label="Manga: inicio → puño"
                  value={`${results.sleeveInitialStitches} → ${results.cuffStitches} p.`}
                />
                <Stat
                  label="Lana estimada (aprox.)"
                  value={`${Math.round(yarnMeters)} m`}
                />
              </div>
            </section>

            <section className="rounded-yakana border border-linen bg-offwhite p-4">
              <button
                type="button"
                onClick={handleReview}
                disabled={reviewLoading}
                className="flex w-full items-center justify-center gap-1.5 rounded-yakana border border-navy/30 bg-white py-1.5 text-xs font-medium text-navy hover:bg-linen disabled:opacity-50"
              >
                <Sparkles size={13} />
                {reviewLoading ? "Revisando…" : "Revisar con la Biblioteca"}
              </button>
              {review ? (
                <>
                  <p className="mt-2 whitespace-pre-line text-xs text-charcoal/80">{review}</p>
                  <p className="mt-2 text-xs text-charcoal/50">
                    Es una revisión automática, no reemplaza tu propio criterio — se apoya en las
                    notas de tu Biblioteca (si tenés) y en conocimiento general de tejido.
                  </p>
                </>
              ) : null}
              {reviewError ? <p className="mt-2 text-xs text-terracotta">{reviewError}</p> : null}
            </section>

            <section className="rounded-yakana border border-linen bg-offwhite p-4">
              <h2 className="mb-3 font-heading text-lg italic text-navy">Boceto de la prenda</h2>
              <div className="flex justify-center">
                <GarmentSketch
                  chestCm={measurements.chestCm + oversizeEaseCm}
                  bodyLengthCm={measurements.bodyLengthCm}
                  yokeDepthCm={measurements.yokeDepthCm}
                  neckCm={measurements.neckCm}
                  sleeveLengthCm={measurements.sleeveLengthCm}
                  sleeveCircumferenceCm={measurements.sleeveCircumferenceCm}
                  cuffCircumferenceCm={measurements.cuffCircumferenceCm}
                  highlightZone={highlightZone}
                  neckStyle={neckStyle}
                  bodyFit={bodyFit}
                  closureType={closureType}
                />
              </div>
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                {(Object.keys(GARMENT_ZONE_LABELS) as GarmentZone[]).map((zone) => (
                  <button
                    key={zone}
                    type="button"
                    onClick={() => setHighlightZone(highlightZone === zone ? null : zone)}
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      highlightZone === zone
                        ? "bg-terracotta text-offwhite"
                        : "border border-linen bg-white text-navy"
                    }`}
                  >
                    {GARMENT_ZONE_LABELS[zone]}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-center text-xs text-charcoal/50">
                Dibujado a proporción según tus medidas — hecho la mitad del contorno (frente o
                espalda), como una prenda tendida y estirada plana.
              </p>
            </section>

            <section className="rounded-yakana border border-linen bg-offwhite p-4">
              <h2 className="mb-3 font-heading text-lg italic text-navy">
                Instrucciones vuelta por vuelta
              </h2>
              <ol className="list-inside list-decimal space-y-2 text-sm text-charcoal/80">
                {instructions.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ol>
            </section>

            {miniResults ? (
              <section className="rounded-yakana border-2 border-dashed border-olive bg-olive/5 p-4">
                <h2 className="mb-3 font-heading text-lg italic text-navy">
                  🧸 Versión miniatura ({miniScalePct}%)
                </h2>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Stat label="Montado de cuello" value={`${miniResults.neckCastOn} p.`} />
                  <Stat label="Puntos en la axila" value={`${miniResults.underarmStitches} p.`} />
                  <Stat label="Vueltas del canesú" value={`${miniResults.yokeRows}`} />
                  <Stat label="Vueltas del cuerpo" value={`${miniResults.bodyRows}`} />
                  <Stat
                    label="Manga: inicio → puño"
                    value={`${miniResults.sleeveInitialStitches} → ${miniResults.cuffStitches} p.`}
                  />
                  <Stat label="Lana estimada" value={`${Math.round(miniYarnMeters)} m`} />
                </div>

                <div className="mt-4 flex justify-center">
                  <GarmentSketch
                    chestCm={miniMeasurements.chestCm}
                    bodyLengthCm={miniMeasurements.bodyLengthCm}
                    yokeDepthCm={miniMeasurements.yokeDepthCm}
                    neckCm={miniMeasurements.neckCm}
                    sleeveLengthCm={miniMeasurements.sleeveLengthCm}
                    sleeveCircumferenceCm={miniMeasurements.sleeveCircumferenceCm}
                    cuffCircumferenceCm={miniMeasurements.cuffCircumferenceCm}
                    neckStyle={neckStyle}
                    bodyFit={bodyFit}
                    closureType={closureType}
                  />
                </div>

                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-medium text-navy">
                    Instrucciones de la versión mini
                  </summary>
                  <ol className="mt-2 list-inside list-decimal space-y-2 text-sm text-charcoal/80">
                    {miniInstructions.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ol>
                </details>
              </section>
            ) : null}

            {projects.length > 0 ? (
              <section className="rounded-yakana border border-linen bg-offwhite p-4">
                <h2 className="mb-3 font-heading text-lg italic text-navy">
                  Guardar en un proyecto
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
                  >
                    <option value="">Elegí un proyecto</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleSaveToProject}
                    disabled={!projectId}
                    className="rounded-yakana bg-terracotta px-4 py-2 text-sm font-medium text-offwhite hover:bg-terracotta-dark disabled:opacity-50"
                  >
                    Guardar cálculo
                  </button>
                  <span className="text-xs text-olive">{saveMessage}</span>
                </div>
                {miniResults ? (
                  <label className="mt-2 flex items-center gap-2 text-xs text-navy">
                    <input
                      type="checkbox"
                      checked={saveMiniToo}
                      onChange={(e) => setSaveMiniToo(e.target.checked)}
                    />
                    Guardar también la versión miniatura como cálculo aparte
                  </label>
                ) : null}
                <p className="mt-2 text-xs text-charcoal/50">
                  También actualiza la muestra y la aguja del proyecto elegido.
                </p>
              </section>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-navy">{label}</label>
      <input
        type="number"
        step={step}
        value={value || ""}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-charcoal/50">{label}</p>
      <p className="font-medium text-navy">{value}</p>
    </div>
  );
}
