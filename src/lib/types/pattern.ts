export type PaletteColor = {
  hex: string;
  name: string;
  yarn_id: string | null;
};

export type Palette = {
  id: string;
  user_id: string;
  name: string;
  colors: PaletteColor[];
  is_global: boolean;
  created_at: string;
};

export type GridData = Record<string, string>; // "col,row" -> hex color

export type Pattern = {
  id: string;
  user_id: string;
  project_id: string | null;
  name: string;
  width_stitches: number;
  height_rows: number;
  display_mode: string;
  grid_data: GridData;
  palette_id: string | null;
  repeat_region: { x1: number; y1: number; x2: number; y2: number } | null;
  source_type: string | null;
  source_reference: string | null;
  garment_zone: string | null;
  created_at: string;
  updated_at: string;
  palettes?: Palette | null;
};

export type PatternVersion = {
  id: string;
  pattern_id: string;
  version_label: string | null;
  grid_data: GridData;
  created_at: string;
};

export const DEFAULT_PALETTE: PaletteColor[] = [
  { hex: "#faf7f2", name: "Fondo", yarn_id: null },
  { hex: "#8b3a2a", name: "Color 1", yarn_id: null },
];
