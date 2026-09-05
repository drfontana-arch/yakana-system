export type Yarn = {
  id: string;
  user_id: string;
  name: string;
  brand: string | null;
  colorway_name: string | null;
  dye_lot_code: string | null;
  color_code: string | null;
  fiber_content: string | null;
  weight_category: string | null;
  skein_weight_grams: number | null;
  skein_yardage_meters: number | null;
  recommended_needle_mm: number | null;
  quantity_skeins: number | null;
  quantity_grams: number | null;
  cost_per_skein: number | null;
  color_hex: string | null;
  photo_url: string | null;
  location: string | null;
  notes: string | null;
  tags: string[] | null;
  created_at: string;
};

export const WEIGHT_CATEGORIES = [
  { value: "lace", label: "Encaje (lace)" },
  { value: "fingering", label: "Hilo (fingering)" },
  { value: "sport", label: "Sport" },
  { value: "dk", label: "DK" },
  { value: "worsted", label: "Worsted" },
  { value: "aran", label: "Aran" },
  { value: "bulky", label: "Grueso (bulky)" },
] as const;
