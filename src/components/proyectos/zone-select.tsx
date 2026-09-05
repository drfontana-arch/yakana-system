"use client";

import { useTransition } from "react";
import { setPatternGarmentZone } from "@/lib/actions/patterns";
import { GARMENT_ZONE_LABELS, type GarmentZone } from "@/components/calculadora/garment-sketch";

export function ZoneSelect({
  projectId,
  patternId,
  zone,
}: {
  projectId: string;
  patternId: string;
  zone: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const setZoneWithId = setPatternGarmentZone.bind(null, projectId);

  return (
    <form
      action={(formData) => startTransition(() => setZoneWithId(formData))}
      className="flex items-center gap-2"
    >
      <input type="hidden" name="pattern_id" value={patternId} />
      <label className="text-xs font-medium text-navy">Zona en la prenda</label>
      <select
        name="garment_zone"
        defaultValue={zone ?? ""}
        disabled={isPending}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-yakana border border-linen bg-white px-2 py-1 text-xs outline-none focus:border-terracotta disabled:opacity-60"
      >
        <option value="">Sin definir</option>
        {(Object.keys(GARMENT_ZONE_LABELS) as GarmentZone[]).map((z) => (
          <option key={z} value={z}>
            {GARMENT_ZONE_LABELS[z]}
          </option>
        ))}
      </select>
    </form>
  );
}
