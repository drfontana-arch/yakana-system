export type Supply = {
  id: string;
  user_id: string;
  category: string;
  name: string;
  brand: string | null;
  size_mm: number | null;
  cable_length_cm: number | null;
  material: string | null;
  quantity: number | null;
  cost: number | null;
  color_hex: string | null;
  photo_url: string | null;
  location: string | null;
  notes: string | null;
  tags: string[] | null;
  created_at: string;
};

export const SUPPLY_CATEGORIES = [
  { value: "needle", label: "Aguja recta" },
  { value: "circular_needle", label: "Aguja circular" },
  { value: "crochet_hook", label: "Ganchillo" },
  { value: "marker", label: "Marcador de puntos" },
  { value: "accessory", label: "Accesorio (tijera, aguja de coser, cinta métrica, etc.)" },
  { value: "packaging", label: "Packaging (etiquetas, bolsas, marcas, calcos, etc.)" },
  { value: "other", label: "Otro" },
] as const;
