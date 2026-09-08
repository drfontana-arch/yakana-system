"use client";

import { useState } from "react";
import {
  calculateDropShoulder,
  buildDropShoulderInstructions,
  calculateDropShoulderYarnMeters,
  type DropShoulderInputs,
  type WorkingMethod,
} from "@/lib/calculators/drop-shoulder";
import { NECK_STYLES, CLOSURE_TYPES, BODY_FITS, type ClosureType, type BodyFit } from "@/lib/calculators/raglan-options";
import { DropShoulderSketch } from "@/components/calculadora/drop-shoulder-sketch";
import { SIZE_CATEGORIES, type StandardSize } from "@/lib/types/size";

type Measurements = {
  chestCm: number;
  bodyLengthCm: number;
  armholeDepthCm: number;
  neckCm: number;
  sleeveLengthCm: number;
  sleeveCircumferenceCm: number;
  cuffCircumferenceCm: number;
};

const EMPTY_MEASUREMENTS: Measurements = {
  chestCm: 0,
  bodyLengthCm: 0,
  armholeDepthCm: 0,
  neckCm: 0,
  sleeveLengthCm: 0,
  sleeveCircumferenceCm: 0,
  cuffCircumferenceCm: 0,
};

function fromStandardSize(size: StandardSize): Measurements {
  return {
    chestCm: size.chest_cm ?? 0,
    bodyLengthCm: size.body_length_cm ?? 0,
    // Older saved sizes may not have this field yet — estimate from the
    // raglan yoke depth rather than leaving it at zero.
    armholeDepthCm: size.armhole_depth_cm ?? (size.yoke_depth_cm ?? 0) + 2,
    neckCm: size.neck_cm ?? 0,
    sleeveLengthCm: size.sleeve_length_cm ?? 0,
    sleeveCircumferenceCm: size.sleeve_circumference_cm ?? 0,
    cuffCircumferenceCm: size.cuff_circumference_cm ?? 0,
  };
}

export function DropShoulderCalculator({
  sizes,
  defaultWastePct,
}: {
  sizes: StandardSize[];
  defaultWastePct: number;
}) {
  const [category, setCategory] = useState("adult");
  const [sizeId, setSizeId] = useState("");
  const [measurements, setMeasurements] = useState<Measurements>(EMPTY_MEASUREMENTS);

  const [stitchesPer10cm, setStitchesPer10cm] = useState(20);
  const [rowsPer10cm, setRowsPer10cm] = useState(28);
  const [needleMm, setNeedleMm] = useState(4);

  const [workingMethod, setWorkingMethod] = useState<WorkingMethod>("circular");
  const [neckStyle, setNeckStyle] = useState("crew");
  const [closureType, setClosureType] = useState<ClosureType>("pullover");
  const [bodyFit, setBodyFit] = useState<BodyFit>("straight");
  const [underarmEaseCm, setUnderarmEaseCm] = useState(4);
  const [wastePct, setWastePct] = useState(defaultWastePct);

  const sizesByCategory = sizes.filter((s) => s.category === category);

  function handlePickSize(id: string) {
    setSizeId(id);
    const size = sizes.find((s) => s.id === id);
    if (size) setMeasurements(fromStandardSize(size));
  }

  function updateMeasurement(key: keyof Measurements, value: number) {
    setMeasurements((m) => ({ ...m, [key]: value }));
  }

  const oversizeEaseCm = bodyFit === "oversize" ? 10 : 0;

  const inputs: DropShoulderInputs = {
    stitchesPer10cm,
    rowsPer10cm,
    chestCm: measurements.chestCm + oversizeEaseCm,
    bodyLengthCm: measurements.bodyLengthCm,
    armholeDepthCm: measurements.armholeDepthCm,
    neckCm: measurements.neckCm,
    sleeveLengthCm: measurements.sleeveLengthCm,
    sleeveCircumferenceCm: measurements.sleeveCircumferenceCm,
    cuffCircumferenceCm: measurements.cuffCircumferenceCm,
    underarmEaseCm,
    workingMethod,
  };

  const ready =
    stitchesPer10cm > 0 &&
    rowsPer10cm > 0 &&
    measurements.chestCm > 0 &&
    measurements.neckCm > 0 &&
    measurements.armholeDepthCm > 0;

  const results = ready ? calculateDropShoulder(inputs) : null;
  const instructions = results
    ? buildDropShoulderInstructions(results, neckStyle, closureType, bodyFit, workingMethod)
    : [];
  const yarnMeters = results ? calculateDropShoulderYarnMeters(results, stitchesPer10cm, wastePct) : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-5">
        <section className="rounded-yakana border border-linen bg-offwhite p-4">
          <h2 className="mb-3 font-heading text-lg italic text-navy">Muestra</h2>
          <div className="grid grid-cols-3 gap-3">
            <NumField label="Puntos / 10cm" value={stitchesPer10cm} onChange={setStitchesPer10cm} />
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
                  category === c.value ? "bg-terracotta text-offwhite" : "border border-linen bg-white text-navy"
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
              label="Largo del cuerpo (hasta la axila)"
              value={measurements.bodyLengthCm}
              onChange={(v) => updateMeasurement("bodyLengthCm", v)}
            />
            <NumField
              label="Profundidad de sisa (axila-hombro)"
              value={measurements.armholeDepthCm}
              onChange={(v) => updateMeasurement("armholeDepthCm", v)}
            />
            <NumField
              label="Contorno de cuello"
              value={measurements.neckCm}
              onChange={(v) => updateMeasurement("neckCm", v)}
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
          <p className="mt-2 text-xs text-charcoal/50">
            La profundidad de sisa es una estimación de partida si nunca la guardaste — ajustala
            con una prenda de referencia si podés, porque acá no hay un canesú que la calcule
            sola.
          </p>
        </section>

        <section className="rounded-yakana border border-linen bg-offwhite p-4">
          <h2 className="mb-3 font-heading text-lg italic text-navy">Construcción</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-navy">Agujas</label>
              <select
                value={workingMethod}
                onChange={(e) => setWorkingMethod(e.target.value as WorkingMethod)}
                disabled={closureType !== "pullover"}
                className="w-full rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta disabled:opacity-50"
              >
                <option value="circular">Circulares (en redondo)</option>
                <option value="flat">Rectas (tejido plano)</option>
              </select>
              {closureType !== "pullover" ? (
                <p className="mt-1 text-xs text-charcoal/50">
                  Con este cierre ya se teje plano siempre.
                </p>
              ) : null}
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
            <NumField label="Holgura (cm)" value={underarmEaseCm} onChange={setUnderarmEaseCm} />
            <NumField label="Merma de lana (%)" value={wastePct} onChange={setWastePct} />
          </div>
          {neckStyle !== "crew" ? (
            <p className="mt-2 text-xs text-charcoal/50">
              El cuello elegido necesita disminuciones o vueltas adicionales manuales que esta
              calculadora todavía no detalla automáticamente — usá el conteo de puntos como base.
            </p>
          ) : null}
          <p className="mt-2 text-xs text-charcoal/50">
            Esta calculadora es de abajo hacia arriba únicamente — el hombro caído de arriba hacia
            abajo queda para más adelante.
          </p>
        </section>
      </div>

      <div className="space-y-5">
        {!results ? (
          <div className="rounded-yakana border border-dashed border-linen bg-offwhite p-6 text-center text-sm text-charcoal/60">
            Completá la muestra y al menos el contorno de pecho, cuello y profundidad de sisa
            para ver los resultados.
          </div>
        ) : (
          <>
            <section className="rounded-yakana border border-linen bg-offwhite p-4">
              <h2 className="mb-3 font-heading text-lg italic text-navy">Resumen</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Stat label="Puntos del cuerpo" value={`${results.bodyStitches} p.`} />
                <Stat label="Vueltas hasta la axila" value={`${results.bodyRows}`} />
                <Stat label="Vueltas de sisa (recta)" value={`${results.armholeRows}`} />
                <Stat label="Puntos del cuello" value={`${results.neckStitches} p.`} />
                <Stat label="Puntos por hombro" value={`${results.shoulderStitchesEachSide} p.`} />
                <Stat
                  label="Manga: puño → arriba"
                  value={`${results.cuffStitches} → ${results.sleeveTargetStitches} p.`}
                />
                <Stat label="Lana estimada (aprox.)" value={`${Math.round(yarnMeters)} m`} />
              </div>
            </section>

            <section className="rounded-yakana border border-linen bg-offwhite p-4">
              <h2 className="mb-3 font-heading text-lg italic text-navy">Boceto de la prenda</h2>
              <div className="flex justify-center">
                <DropShoulderSketch
                  chestCm={measurements.chestCm + oversizeEaseCm}
                  bodyLengthCm={measurements.bodyLengthCm}
                  armholeDepthCm={measurements.armholeDepthCm}
                  neckCm={measurements.neckCm}
                  sleeveLengthCm={measurements.sleeveLengthCm}
                  sleeveCircumferenceCm={measurements.sleeveCircumferenceCm}
                  cuffCircumferenceCm={measurements.cuffCircumferenceCm}
                  neckStyle={neckStyle}
                  closureType={closureType}
                />
              </div>
              <p className="mt-2 text-center text-xs text-charcoal/50">
                La línea punteada marca la costura recta de la sisa — no hay ninguna curva de
                canesú, esa es la seña del hombro caído.
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

            <p className="rounded-yakana border border-dashed border-linen bg-offwhite p-3 text-xs text-charcoal/50">
              Por ahora esta calculadora no guarda el cálculo en un proyecto ni arma el
              &ldquo;Patrón completo&rdquo; — esa integración queda para una vuelta siguiente.
            </p>
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
