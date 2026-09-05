export type ContentPlatform = "instagram" | "tiktok" | "pinterest";
export type ContentFormat = "square" | "portrait" | "story" | "pin";
export type ContentTone = "educational" | "inspirational" | "commercial";
export type ContentStatus = "draft" | "scheduled" | "published";

export const PLATFORMS: { value: ContentPlatform; label: string }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "pinterest", label: "Pinterest" },
];

export const FORMATS: {
  value: ContentFormat;
  label: string;
  width: number;
  height: number;
}[] = [
  { value: "square", label: "Cuadrado (1:1)", width: 1080, height: 1080 },
  { value: "portrait", label: "Retrato (4:5)", width: 1080, height: 1350 },
  { value: "story", label: "Historia / Reel (9:16)", width: 1080, height: 1920 },
  { value: "pin", label: "Pin (2:3)", width: 1000, height: 1500 },
];

export const TONES: { value: ContentTone; label: string }[] = [
  { value: "educational", label: "Educativo" },
  { value: "inspirational", label: "Inspiracional" },
  { value: "commercial", label: "Comercial" },
];

export const CONTENT_STATUSES: { value: ContentStatus; label: string }[] = [
  { value: "draft", label: "Borrador" },
  { value: "scheduled", label: "Programado" },
  { value: "published", label: "Publicado" },
];

export function formatSpec(format: string) {
  return FORMATS.find((f) => f.value === format) ?? FORMATS[0];
}

export function platformLabel(platform: string) {
  return PLATFORMS.find((p) => p.value === platform)?.label ?? platform;
}

export function statusLabel(status: string) {
  return CONTENT_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export type SocialContent = {
  id: string;
  project_id: string;
  platform: ContentPlatform;
  format: ContentFormat;
  media_urls: string[] | null;
  caption_es: string | null;
  caption_en: string | null;
  hashtags: string[] | null;
  hook_text: string | null;
  status: ContentStatus;
  scheduled_date: string | null;
  created_at: string;
  projects?: { name: string } | null;
};
