import { LayoutGrid } from "lucide-react";
import type { GridData } from "@/lib/types/pattern";

const MAX_CELLS_FOR_LIVE_PREVIEW = 3000;

export function PatternThumbnail({
  gridData,
  width,
  height,
  backgroundHex,
  size = 96,
  mode = "color",
}: {
  gridData: GridData;
  width: number;
  height: number;
  backgroundHex: string;
  size?: number;
  mode?: string;
}) {
  if (width * height > MAX_CELLS_FOR_LIVE_PREVIEW) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-yakana border border-linen bg-linen/40"
        style={{ width: size, height: size }}
      >
        <LayoutGrid className="text-charcoal/40" size={28} />
      </div>
    );
  }

  const isStitch = mode === "stitch";

  return (
    <div
      className="shrink-0 overflow-hidden rounded-yakana border border-linen"
      style={{
        width: size,
        height: size,
        display: "grid",
        gridTemplateColumns: `repeat(${width}, 1fr)`,
        gridTemplateRows: `repeat(${height}, 1fr)`,
        backgroundColor: isStitch ? "#faf7f2" : backgroundHex,
      }}
    >
      {Array.from({ length: width * height }).map((_, i) => {
        const col = i % width;
        const row = Math.floor(i / width);
        const value = gridData[`${col},${row}`];
        if (isStitch) {
          // Symbol codes aren't colors — just show marked vs. blank cells so
          // the overall texture/motif shape reads at a glance.
          return value ? <div key={i} style={{ backgroundColor: "#8a8168" }} /> : <div key={i} />;
        }
        return value ? <div key={i} style={{ backgroundColor: value }} /> : <div key={i} />;
      })}
    </div>
  );
}
