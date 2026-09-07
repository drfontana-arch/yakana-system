export type StandardSize = {
  id: string;
  user_id: string;
  category: string;
  size_label: string;
  sort_order: number;
  chest_cm: number | null;
  body_length_cm: number | null;
  yoke_depth_cm: number | null;
  armhole_depth_cm: number | null;
  neck_cm: number | null;
  shoulder_width_cm: number | null;
  sleeve_length_cm: number | null;
  sleeve_circumference_cm: number | null;
  cuff_circumference_cm: number | null;
};

export const SIZE_CATEGORIES = [
  { value: "baby", label: "Bebé" },
  { value: "toddler", label: "Niño pequeño" },
  { value: "child", label: "Niño" },
  { value: "adult", label: "Adulto" },
] as const;

type DefaultSize = Omit<StandardSize, "id" | "user_id">;

// Starting reference measurements (cm) — every one of these is editable per
// user from the Calculadora, so precision here matters less than giving a
// sensible, internally-consistent starting point.
export const DEFAULT_SIZES: DefaultSize[] = [
  { category: "baby", size_label: "0-6m", sort_order: 1, chest_cm: 41, body_length_cm: 20, yoke_depth_cm: 10, armhole_depth_cm: 11, neck_cm: 24, shoulder_width_cm: 18, sleeve_length_cm: 15, sleeve_circumference_cm: 16, cuff_circumference_cm: 13 },
  { category: "baby", size_label: "6-12m", sort_order: 2, chest_cm: 44, body_length_cm: 23, yoke_depth_cm: 11, armhole_depth_cm: 12, neck_cm: 25, shoulder_width_cm: 19, sleeve_length_cm: 18, sleeve_circumference_cm: 17, cuff_circumference_cm: 13 },
  { category: "baby", size_label: "12-18m", sort_order: 3, chest_cm: 47, body_length_cm: 25, yoke_depth_cm: 12, armhole_depth_cm: 13, neck_cm: 26, shoulder_width_cm: 20, sleeve_length_cm: 20, sleeve_circumference_cm: 18, cuff_circumference_cm: 14 },
  { category: "baby", size_label: "18-24m", sort_order: 4, chest_cm: 49, body_length_cm: 27, yoke_depth_cm: 12.5, armhole_depth_cm: 13.5, neck_cm: 27, shoulder_width_cm: 21, sleeve_length_cm: 22, sleeve_circumference_cm: 19, cuff_circumference_cm: 14 },

  { category: "toddler", size_label: "2 años", sort_order: 1, chest_cm: 53, body_length_cm: 30, yoke_depth_cm: 14, armhole_depth_cm: 15.5, neck_cm: 28, shoulder_width_cm: 23, sleeve_length_cm: 25, sleeve_circumference_cm: 20, cuff_circumference_cm: 15 },
  { category: "toddler", size_label: "4 años", sort_order: 2, chest_cm: 56, body_length_cm: 33, yoke_depth_cm: 15, armhole_depth_cm: 16.5, neck_cm: 29, shoulder_width_cm: 25, sleeve_length_cm: 29, sleeve_circumference_cm: 21, cuff_circumference_cm: 15 },

  { category: "child", size_label: "6 años", sort_order: 1, chest_cm: 61, body_length_cm: 36, yoke_depth_cm: 16, armhole_depth_cm: 17.5, neck_cm: 30, shoulder_width_cm: 27, sleeve_length_cm: 32, sleeve_circumference_cm: 23, cuff_circumference_cm: 16 },
  { category: "child", size_label: "8 años", sort_order: 2, chest_cm: 66, body_length_cm: 40, yoke_depth_cm: 17, armhole_depth_cm: 18.5, neck_cm: 31, shoulder_width_cm: 29, sleeve_length_cm: 35, sleeve_circumference_cm: 25, cuff_circumference_cm: 16 },
  { category: "child", size_label: "10 años", sort_order: 3, chest_cm: 71, body_length_cm: 43, yoke_depth_cm: 18, armhole_depth_cm: 19.5, neck_cm: 32, shoulder_width_cm: 31, sleeve_length_cm: 38, sleeve_circumference_cm: 27, cuff_circumference_cm: 17 },
  { category: "child", size_label: "12 años", sort_order: 4, chest_cm: 76, body_length_cm: 46, yoke_depth_cm: 19, armhole_depth_cm: 20.5, neck_cm: 33, shoulder_width_cm: 33, sleeve_length_cm: 40, sleeve_circumference_cm: 29, cuff_circumference_cm: 17 },

  { category: "adult", size_label: "XS", sort_order: 1, chest_cm: 81, body_length_cm: 55, yoke_depth_cm: 19, armhole_depth_cm: 21, neck_cm: 36, shoulder_width_cm: 37, sleeve_length_cm: 43, sleeve_circumference_cm: 27, cuff_circumference_cm: 18 },
  { category: "adult", size_label: "S", sort_order: 2, chest_cm: 89, body_length_cm: 57, yoke_depth_cm: 20, armhole_depth_cm: 22, neck_cm: 37, shoulder_width_cm: 39, sleeve_length_cm: 43, sleeve_circumference_cm: 29, cuff_circumference_cm: 19 },
  { category: "adult", size_label: "M", sort_order: 3, chest_cm: 99, body_length_cm: 59, yoke_depth_cm: 21, armhole_depth_cm: 23, neck_cm: 38, shoulder_width_cm: 41, sleeve_length_cm: 44, sleeve_circumference_cm: 32, cuff_circumference_cm: 20 },
  { category: "adult", size_label: "L", sort_order: 4, chest_cm: 109, body_length_cm: 61, yoke_depth_cm: 22, armhole_depth_cm: 24, neck_cm: 39, shoulder_width_cm: 43, sleeve_length_cm: 44, sleeve_circumference_cm: 35, cuff_circumference_cm: 21 },
  { category: "adult", size_label: "XL", sort_order: 5, chest_cm: 119, body_length_cm: 63, yoke_depth_cm: 23, armhole_depth_cm: 25, neck_cm: 40, shoulder_width_cm: 45, sleeve_length_cm: 45, sleeve_circumference_cm: 38, cuff_circumference_cm: 22 },
  { category: "adult", size_label: "2XL", sort_order: 6, chest_cm: 129, body_length_cm: 65, yoke_depth_cm: 24, armhole_depth_cm: 26, neck_cm: 41, shoulder_width_cm: 47, sleeve_length_cm: 45, sleeve_circumference_cm: 41, cuff_circumference_cm: 23 },
  { category: "adult", size_label: "3XL", sort_order: 7, chest_cm: 139, body_length_cm: 67, yoke_depth_cm: 25, armhole_depth_cm: 27, neck_cm: 42, shoulder_width_cm: 49, sleeve_length_cm: 46, sleeve_circumference_cm: 44, cuff_circumference_cm: 24 },
  { category: "adult", size_label: "4XL", sort_order: 8, chest_cm: 149, body_length_cm: 69, yoke_depth_cm: 26, armhole_depth_cm: 28, neck_cm: 43, shoulder_width_cm: 51, sleeve_length_cm: 46, sleeve_circumference_cm: 47, cuff_circumference_cm: 25 },
];
