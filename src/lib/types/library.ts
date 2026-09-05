export type LibraryEntry = {
  id: string;
  user_id: string;
  title: string;
  author: string | null;
  source_url: string | null;
  copyright_note: string | null;
  file_url: string | null;
  tags: string[] | null;
  notes: string | null;
  pattern_id: string | null;
  created_at: string;
};

export function isPdfUrl(url: string) {
  return url.toLowerCase().split("?")[0].endsWith(".pdf");
}
