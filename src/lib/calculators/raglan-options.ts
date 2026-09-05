export const NECK_STYLES = [
  { value: "crew", label: "Redondo" },
  { value: "v_neck", label: "En V" },
  { value: "turtleneck", label: "Alto (tortuga)" },
  { value: "boat", label: "Barco / bote" },
  { value: "scoop", label: "Base (escote amplio)" },
] as const;

export const CLOSURE_TYPES = [
  { value: "pullover", label: "Cerrado (pullover, sin apertura)" },
  { value: "button_placket", label: "Botonera con ojales" },
  { value: "zipper_full", label: "Cremallera completa" },
  { value: "zipper_half", label: "Cremallera hasta el pecho" },
  { value: "ties", label: "Lazos o cordones" },
  { value: "kimono", label: "Cruce tipo kimono" },
  { value: "open", label: "Abierto (sin cierre)" },
] as const;

export const BODY_FITS = [
  { value: "straight", label: "Recto" },
  { value: "fitted", label: "Entallado" },
  { value: "a_line", label: "Evasé en A" },
  { value: "oversize", label: "Oversize" },
] as const;

export type NeckStyle = (typeof NECK_STYLES)[number]["value"];
export type ClosureType = (typeof CLOSURE_TYPES)[number]["value"];
export type BodyFit = (typeof BODY_FITS)[number]["value"];

export function neckStyleLabel(value: string) {
  return NECK_STYLES.find((n) => n.value === value)?.label ?? value;
}

export function closureTypeLabel(value: string) {
  return CLOSURE_TYPES.find((c) => c.value === value)?.label ?? value;
}
