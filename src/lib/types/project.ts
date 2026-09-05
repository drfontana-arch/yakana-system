import type { Yarn } from "@/lib/types/yarn";

export type Project = {
  id: string;
  user_id: string;
  name: string;
  type: string | null;
  status: string;
  construction_direction: string | null;
  size_label: string | null;
  recipient: string | null;
  gauge_stitches_per_10cm: number | null;
  gauge_rows_per_10cm: number | null;
  needle_size_mm: number | null;
  hourly_rate: number | null;
  total_time_minutes: number;
  start_date: string | null;
  completion_date: string | null;
  notes: string | null;
  tiendanube_product_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectYarn = {
  id: string;
  project_id: string;
  yarn_id: string;
  color_role: string | null;
  estimated_meters: number | null;
  actual_meters_used: number | null;
  estimated_skeins: number | null;
  actual_skeins_used: number | null;
  yarns: Yarn | null;
};

export type WorkSession = {
  id: string;
  project_id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  notes: string | null;
};

export type ProjectNote = {
  id: string;
  project_id: string;
  type: string;
  content: string;
  created_at: string;
};

export type ProjectMedia = {
  id: string;
  project_id: string;
  type: string;
  file_url: string;
  caption: string | null;
  created_at: string;
};

export const PROJECT_TYPES = [
  { value: "sweater", label: "Sweater" },
  { value: "hat", label: "Gorro" },
  { value: "shawl", label: "Chal" },
  { value: "gloves", label: "Guantes" },
  { value: "blanket", label: "Manta" },
  { value: "other", label: "Otro" },
] as const;

export const PROJECT_STATUSES = [
  { value: "idea", label: "Idea" },
  { value: "in_progress", label: "En curso" },
  { value: "paused", label: "Pausado" },
  { value: "completed", label: "Terminado" },
  { value: "frogged", label: "Destejido" },
] as const;

export const CONSTRUCTION_DIRECTIONS = [
  { value: "top_down", label: "De arriba hacia abajo" },
  { value: "bottom_up", label: "De abajo hacia arriba" },
] as const;

export const NOTE_TYPES = [
  { value: "note", label: "Nota", icon: "📝" },
  { value: "correction", label: "Corrección", icon: "🔧" },
  { value: "milestone", label: "Hito", icon: "📊" },
  { value: "transcription", label: "Transcripción", icon: "🎤" },
] as const;
