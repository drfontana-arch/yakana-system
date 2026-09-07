"use client";

import { useState } from "react";
import { RaglanCalculator } from "@/components/calculadora/raglan-calculator";
import { DropShoulderCalculator } from "@/components/calculadora/drop-shoulder-calculator";
import type { StandardSize } from "@/lib/types/size";
import type { Project } from "@/lib/types/project";

type Construction = "raglan" | "drop_shoulder";

const OPTIONS: { value: Construction; label: string }[] = [
  { value: "raglan", label: "Raglán" },
  { value: "drop_shoulder", label: "Hombro caído" },
];

export function ConstructionSwitcher({
  sizes,
  defaultWastePct,
  projects,
}: {
  sizes: StandardSize[];
  defaultWastePct: number;
  projects: Project[];
}) {
  const [construction, setConstruction] = useState<Construction>("raglan");

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => setConstruction(o.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              construction === o.value
                ? "bg-navy text-offwhite"
                : "border border-linen bg-white text-navy hover:bg-linen"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {construction === "raglan" ? (
        <RaglanCalculator sizes={sizes} defaultWastePct={defaultWastePct} projects={projects} />
      ) : (
        <DropShoulderCalculator sizes={sizes} defaultWastePct={defaultWastePct} />
      )}
    </div>
  );
}
