export type HSL = { h: number; s: number; l: number };

export function hexToHsl(hex: string): HSL {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
      break;
    case g:
      h = ((b - r) / d + 2) * 60;
      break;
    default:
      h = ((r - g) / d + 4) * 60;
  }

  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToHex({ h, s, l }: HSL): string {
  const hue = ((h % 360) + 360) % 360;
  const sat = Math.max(0, Math.min(100, s)) / 100;
  const light = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = light - c / 2;

  let [r, g, b] = [0, 0, 0];
  if (hue < 60) [r, g, b] = [c, x, 0];
  else if (hue < 120) [r, g, b] = [x, c, 0];
  else if (hue < 180) [r, g, b] = [0, c, x];
  else if (hue < 240) [r, g, b] = [0, x, c];
  else if (hue < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export type HarmonyType =
  | "complementary"
  | "split_complementary"
  | "triadic"
  | "tetradic"
  | "analogous"
  | "monochromatic";

export const HARMONY_LABELS: Record<HarmonyType, string> = {
  complementary: "Complementaria",
  split_complementary: "Complementaria dividida",
  triadic: "Tríada",
  tetradic: "Tétrada (cuadrado)",
  analogous: "Análogos",
  monochromatic: "Monocromática",
};

export function generateHarmony(baseHex: string, type: HarmonyType): string[] {
  const base = hexToHsl(baseHex);

  switch (type) {
    case "complementary":
      return [baseHex, hslToHex({ ...base, h: base.h + 180 })];
    case "split_complementary":
      return [
        baseHex,
        hslToHex({ ...base, h: base.h + 150 }),
        hslToHex({ ...base, h: base.h + 210 }),
      ];
    case "triadic":
      return [
        baseHex,
        hslToHex({ ...base, h: base.h + 120 }),
        hslToHex({ ...base, h: base.h + 240 }),
      ];
    case "tetradic":
      return [
        baseHex,
        hslToHex({ ...base, h: base.h + 90 }),
        hslToHex({ ...base, h: base.h + 180 }),
        hslToHex({ ...base, h: base.h + 270 }),
      ];
    case "analogous":
      return [
        hslToHex({ ...base, h: base.h - 30 }),
        baseHex,
        hslToHex({ ...base, h: base.h + 30 }),
      ];
    case "monochromatic":
      return [20, 35, 50, 65, 80].map((l) => hslToHex({ ...base, l }));
  }
}

export function colorTemperature(hex: string): "warm" | "cool" {
  const { h } = hexToHsl(hex);
  return h < 90 || h >= 270 ? "warm" : "cool";
}

export type Season = "spring" | "summer" | "autumn" | "winter";

export const SEASON_LABELS: Record<Season, string> = {
  spring: "Primavera (clara y cálida)",
  summer: "Verano (suave y fría)",
  autumn: "Otoño (cálida y terrosa)",
  winter: "Invierno (clara y fría / alto contraste)",
};

export function seasonalPalette(baseHex: string, season: Season): string[] {
  const base = hexToHsl(baseHex);

  const adjust = (dSat: number, dLight: number, dHue = 0) =>
    hslToHex({
      h: base.h + dHue,
      s: Math.max(10, Math.min(95, base.s + dSat)),
      l: Math.max(10, Math.min(90, base.l + dLight)),
    });

  switch (season) {
    case "spring":
      return [adjust(15, 15), adjust(20, 25, 20), adjust(10, 10, -20), adjust(25, 5, 40)];
    case "summer":
      return [adjust(-25, 5), adjust(-30, 15, -20), adjust(-20, -5, 20), adjust(-35, 10, 40)];
    case "autumn":
      return [adjust(-10, -15), adjust(0, -25, -20), adjust(-5, -10, 20), adjust(-15, -20, 40)];
    case "winter":
      return [adjust(20, -10), adjust(25, -25, -20), adjust(10, 20, 20), adjust(30, 0, 40)];
  }
}
