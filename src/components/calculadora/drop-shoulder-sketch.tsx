const NECK_WIDTH_FACTOR: Record<string, number> = {
  crew: 0.45,
  scoop: 0.55,
  boat: 0.65,
  v_neck: 0.45,
  turtleneck: 0.45,
};

export function DropShoulderSketch({
  chestCm,
  bodyLengthCm,
  armholeDepthCm,
  neckCm,
  sleeveLengthCm,
  sleeveCircumferenceCm,
  cuffCircumferenceCm,
  neckStyle = "crew",
  closureType = "pullover",
}: {
  chestCm: number;
  bodyLengthCm: number;
  armholeDepthCm: number;
  neckCm: number;
  sleeveLengthCm: number;
  sleeveCircumferenceCm: number;
  cuffCircumferenceCm: number;
  neckStyle?: string;
  closureType?: string;
}) {
  const scale = 3;
  const pad = 28;
  const ribbingCm = 3;
  const cuffRibbingCm = 3;
  const isOpenFront = closureType !== "pullover";

  const halfChest = (chestCm / 2) * scale;
  const halfNeck = (neckCm / 2) * scale * (NECK_WIDTH_FACTOR[neckStyle] ?? 0.45);
  const bodyLength = bodyLengthCm * scale;
  const armholeDepth = armholeDepthCm * scale;
  const ribbing = ribbingCm * scale;
  const sleeveLength = Math.max(1, sleeveLengthCm - cuffRibbingCm) * scale;
  const cuffRibbing = cuffRibbingCm * scale;
  const halfSleeveCirc = (sleeveCircumferenceCm / 2) * scale;
  const halfCuff = (cuffCircumferenceCm / 2) * scale;

  const svgWidth = 2 * (halfChest + sleeveLength + cuffRibbing) + pad * 2;
  const svgHeight = bodyLength + armholeDepth + ribbing + pad * 2;
  const centerX = svgWidth / 2;
  const topY = pad;
  const underarmY = topY + armholeDepth;
  const hemY = underarmY + bodyLength;

  const fill = "var(--yakana-offwhite, #faf7f2)";
  const stroke = "#1a2744";

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full max-w-md" style={{ fontFamily: "sans-serif" }}>
      {/* Right sleeve — a straight rectangle, set in with a straight seam */}
      <polygon
        points={`
          ${centerX + halfChest},${topY}
          ${centerX + halfChest + sleeveLength},${topY + (halfSleeveCirc - halfCuff)}
          ${centerX + halfChest + sleeveLength},${topY + (halfSleeveCirc - halfCuff) + halfCuff * 2}
          ${centerX + halfChest},${underarmY}
        `}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.5}
      />
      <rect
        x={centerX + halfChest + sleeveLength}
        y={topY + (halfSleeveCirc - halfCuff)}
        width={cuffRibbing}
        height={halfCuff * 2}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.5}
      />

      {/* Left sleeve (mirrored) */}
      <polygon
        points={`
          ${centerX - halfChest},${topY}
          ${centerX - halfChest - sleeveLength},${topY + (halfSleeveCirc - halfCuff)}
          ${centerX - halfChest - sleeveLength},${topY + (halfSleeveCirc - halfCuff) + halfCuff * 2}
          ${centerX - halfChest},${underarmY}
        `}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.5}
      />
      <rect
        x={centerX - halfChest - sleeveLength - cuffRibbing}
        y={topY + (halfSleeveCirc - halfCuff)}
        width={cuffRibbing}
        height={halfCuff * 2}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.5}
      />

      {/* Body — one straight piece from shoulder to hem, no yoke shaping */}
      <polygon
        points={`
          ${centerX - halfChest},${topY}
          ${centerX + halfChest},${topY}
          ${centerX + halfChest},${hemY}
          ${centerX - halfChest},${hemY}
        `}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.5}
      />

      {/* Neckline notch cut into the shoulder line */}
      {neckStyle === "v_neck" ? (
        <polygon
          points={`${centerX - halfNeck},${topY} ${centerX},${topY + armholeDepth * 0.5} ${centerX + halfNeck},${topY}`}
          fill="var(--yakana-cream, #f5f0e8)"
          stroke={stroke}
          strokeWidth={1.5}
        />
      ) : (
        <path
          d={`M ${centerX - halfNeck} ${topY} Q ${centerX} ${topY + 12} ${centerX + halfNeck} ${topY}`}
          fill="none"
          stroke={stroke}
          strokeWidth={2}
        />
      )}

      {/* Ribbing */}
      <rect
        x={centerX - halfChest}
        y={hemY}
        width={halfChest * 2}
        height={ribbing}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.5}
      />

      {isOpenFront ? (
        <line
          x1={centerX}
          y1={topY}
          x2={centerX}
          y2={hemY + ribbing}
          stroke={stroke}
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />
      ) : null}

      {/* Dashed line marking the straight-seam armhole (the "dropped" part) */}
      <line
        x1={centerX - halfChest}
        y1={underarmY}
        x2={centerX + halfChest}
        y2={underarmY}
        stroke={stroke}
        strokeWidth={1}
        strokeDasharray="3 3"
        opacity={0.5}
      />

      <text x={centerX} y={(topY + underarmY) / 2} textAnchor="middle" fontSize={8} fill={stroke}>
        Sisa recta
      </text>
      <text x={centerX} y={(underarmY + hemY) / 2} textAnchor="middle" fontSize={9} fill={stroke}>
        Cuerpo
      </text>
      <text
        x={centerX + halfChest + sleeveLength / 2}
        y={topY + halfSleeveCirc + 14}
        textAnchor="middle"
        fontSize={8}
        fill={stroke}
      >
        Manga
      </text>
      <text
        x={centerX - halfChest - sleeveLength / 2}
        y={topY + halfSleeveCirc + 14}
        textAnchor="middle"
        fontSize={8}
        fill={stroke}
      >
        Manga
      </text>
    </svg>
  );
}
