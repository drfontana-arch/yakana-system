import type { ProjectYarn, WorkSession } from "@/lib/types/project";

export type ProjectCost = {
  materialLines: { name: string; quantity: number; unitCost: number; subtotal: number }[];
  materialsTotal: number;
  totalMinutes: number;
  totalHours: number;
  laborTotal: number;
  totalCost: number;
  markupFactor: number;
  suggestedPrice: number;
  profit: number;
  margin: number;
};

export function computeProjectCost(
  projectYarns: ProjectYarn[],
  sessions: WorkSession[],
  hourlyRate: number,
  markupFactor: number,
): ProjectCost {
  const materialLines = projectYarns.map((py) => {
    const quantity = py.actual_skeins_used ?? py.estimated_skeins ?? 0;
    const unitCost = py.yarns?.cost_per_skein ?? 0;
    return {
      name: py.yarns?.name ?? "Lana eliminada",
      quantity,
      unitCost,
      subtotal: quantity * unitCost,
    };
  });
  const materialsTotal = materialLines.reduce((sum, l) => sum + l.subtotal, 0);

  const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0);
  const totalHours = totalMinutes / 60;
  const laborTotal = totalHours * hourlyRate;

  const totalCost = materialsTotal + laborTotal;
  const suggestedPrice = totalCost * markupFactor;
  const profit = suggestedPrice - totalCost;
  const margin = suggestedPrice > 0 ? (profit / suggestedPrice) * 100 : 0;

  return {
    materialLines,
    materialsTotal,
    totalMinutes,
    totalHours,
    laborTotal,
    totalCost,
    markupFactor,
    suggestedPrice,
    profit,
    margin,
  };
}
