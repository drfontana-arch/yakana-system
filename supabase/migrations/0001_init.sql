-- Yakana Studio — initial schema, RLS policies, and storage buckets
create extension if not exists pgcrypto;

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists user_profiles (
  id uuid references auth.users primary key,
  name text,
  brand_name text default 'Yakana',
  default_hourly_rate decimal(10,2),
  preferred_language text default 'es',
  markup_factor decimal(4,2) default 3.0,
  waste_allowance_pct decimal(4,2) default 10.0,
  watermark_position text default 'bottom-right',
  watermark_opacity decimal(3,2) default 0.3,
  tiendanube_store_id text,
  tiendanube_access_token text,
  created_at timestamptz default now()
);

create table if not exists yarns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references user_profiles not null,
  name text not null,
  brand text,
  colorway_name text,
  dye_lot_code text,
  color_code text,
  fiber_content text,
  weight_category text,
  skein_weight_grams decimal(8,2),
  skein_yardage_meters decimal(10,2),
  recommended_needle_mm decimal(4,2),
  quantity_skeins decimal(6,2),
  quantity_grams decimal(8,2),
  cost_per_skein decimal(10,2),
  color_hex text,
  photo_url text,
  notes text,
  tags text[],
  created_at timestamptz default now()
);

create table if not exists palettes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references user_profiles not null,
  name text not null,
  colors jsonb not null,
  is_global boolean default false,
  created_at timestamptz default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references user_profiles not null,
  name text not null,
  type text,
  status text default 'in_progress',
  construction_direction text,
  size_label text,
  recipient text,
  gauge_stitches_per_10cm decimal(6,2),
  gauge_rows_per_10cm decimal(6,2),
  needle_size_mm decimal(4,2),
  hourly_rate decimal(10,2),
  total_time_minutes integer default 0,
  start_date date,
  completion_date date,
  notes text,
  tiendanube_product_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists project_yarns (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects not null,
  yarn_id uuid references yarns not null,
  color_role text,
  estimated_meters decimal(10,2),
  actual_meters_used decimal(10,2),
  estimated_skeins decimal(6,2),
  actual_skeins_used decimal(6,2)
);

create table if not exists work_sessions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_minutes integer,
  notes text
);

create table if not exists project_notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects not null,
  type text not null,
  content text not null,
  created_at timestamptz default now()
);

create table if not exists project_media (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects not null,
  type text not null,
  file_url text not null,
  caption text,
  created_at timestamptz default now()
);

create table if not exists patterns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references user_profiles not null,
  project_id uuid references projects,
  name text not null,
  width_stitches integer not null,
  height_rows integer not null,
  display_mode text default 'color',
  grid_data jsonb not null,
  palette_id uuid references palettes,
  repeat_region jsonb,
  source_type text,
  source_reference text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists pattern_versions (
  id uuid primary key default gen_random_uuid(),
  pattern_id uuid references patterns not null,
  version_label text,
  grid_data jsonb not null,
  created_at timestamptz default now()
);

create table if not exists raglan_calculations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects not null,
  size_label text,
  measurements jsonb,
  results jsonb,
  row_by_row_instructions jsonb,
  created_at timestamptz default now()
);

create table if not exists social_content (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects not null,
  platform text not null,
  format text not null,
  media_urls text[],
  caption_es text,
  caption_en text,
  hashtags text[],
  hook_text text,
  status text default 'draft',
  scheduled_date date,
  created_at timestamptz default now()
);

create table if not exists pattern_library (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references user_profiles not null,
  title text not null,
  author text,
  source_url text,
  copyright_note text,
  file_url text,
  tags text[],
  notes text,
  created_at timestamptz default now()
);

-- Indexes on every user_id column, for RLS performance
create index if not exists idx_yarns_user_id on yarns(user_id);
create index if not exists idx_palettes_user_id on palettes(user_id);
create index if not exists idx_projects_user_id on projects(user_id);
create index if not exists idx_patterns_user_id on patterns(user_id);
create index if not exists idx_pattern_library_user_id on pattern_library(user_id);
create index if not exists idx_project_yarns_project_id on project_yarns(project_id);
create index if not exists idx_work_sessions_project_id on work_sessions(project_id);
create index if not exists idx_project_notes_project_id on project_notes(project_id);
create index if not exists idx_project_media_project_id on project_media(project_id);
create index if not exists idx_pattern_versions_pattern_id on pattern_versions(pattern_id);
create index if not exists idx_raglan_calculations_project_id on raglan_calculations(project_id);
create index if not exists idx_social_content_project_id on social_content(project_id);

-- ============================================================
-- Auto-create a profile row whenever someone signs up
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.user_profiles (id, name)
  values (new.id, new.raw_user_meta_data ->> 'name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY — every table, own rows only
-- ============================================================

alter table user_profiles enable row level security;
alter table yarns enable row level security;
alter table palettes enable row level security;
alter table projects enable row level security;
alter table project_yarns enable row level security;
alter table work_sessions enable row level security;
alter table project_notes enable row level security;
alter table project_media enable row level security;
alter table patterns enable row level security;
alter table pattern_versions enable row level security;
alter table raglan_calculations enable row level security;
alter table social_content enable row level security;
alter table pattern_library enable row level security;

create policy "own_profile" on user_profiles for all
  using (auth.uid() = id) with check (auth.uid() = id);

create policy "own_yarns" on yarns for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_palettes" on palettes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_projects" on projects for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_patterns" on patterns for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_pattern_library" on pattern_library for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_project_yarns" on project_yarns for all
  using (exists (select 1 from projects p where p.id = project_yarns.project_id and p.user_id = auth.uid()))
  with check (exists (select 1 from projects p where p.id = project_yarns.project_id and p.user_id = auth.uid()));

create policy "own_work_sessions" on work_sessions for all
  using (exists (select 1 from projects p where p.id = work_sessions.project_id and p.user_id = auth.uid()))
  with check (exists (select 1 from projects p where p.id = work_sessions.project_id and p.user_id = auth.uid()));

create policy "own_project_notes" on project_notes for all
  using (exists (select 1 from projects p where p.id = project_notes.project_id and p.user_id = auth.uid()))
  with check (exists (select 1 from projects p where p.id = project_notes.project_id and p.user_id = auth.uid()));

create policy "own_project_media" on project_media for all
  using (exists (select 1 from projects p where p.id = project_media.project_id and p.user_id = auth.uid()))
  with check (exists (select 1 from projects p where p.id = project_media.project_id and p.user_id = auth.uid()));

create policy "own_pattern_versions" on pattern_versions for all
  using (exists (select 1 from patterns pt where pt.id = pattern_versions.pattern_id and pt.user_id = auth.uid()))
  with check (exists (select 1 from patterns pt where pt.id = pattern_versions.pattern_id and pt.user_id = auth.uid()));

create policy "own_raglan_calculations" on raglan_calculations for all
  using (exists (select 1 from projects p where p.id = raglan_calculations.project_id and p.user_id = auth.uid()))
  with check (exists (select 1 from projects p where p.id = raglan_calculations.project_id and p.user_id = auth.uid()));

create policy "own_social_content" on social_content for all
  using (exists (select 1 from projects p where p.id = social_content.project_id and p.user_id = auth.uid()))
  with check (exists (select 1 from projects p where p.id = social_content.project_id and p.user_id = auth.uid()));

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

insert into storage.buckets (id, name, public)
values
  ('project-photos', 'project-photos', true),
  ('project-sketches', 'project-sketches', false),
  ('yarn-photos', 'yarn-photos', true),
  ('pattern-exports', 'pattern-exports', false),
  ('pattern-library', 'pattern-library', false),
  ('brand-assets', 'brand-assets', true)
on conflict (id) do nothing;

-- Public-read buckets: anyone can view files
create policy "public_read_project_photos" on storage.objects for select
  using (bucket_id = 'project-photos');
create policy "public_read_yarn_photos" on storage.objects for select
  using (bucket_id = 'yarn-photos');
create policy "public_read_brand_assets" on storage.objects for select
  using (bucket_id = 'brand-assets');

-- Auth-only buckets: only the owner can view their own files
create policy "own_read_project_sketches" on storage.objects for select
  using (bucket_id = 'project-sketches' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own_read_pattern_exports" on storage.objects for select
  using (bucket_id = 'pattern-exports' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own_read_pattern_library" on storage.objects for select
  using (bucket_id = 'pattern-library' and (storage.foldername(name))[1] = auth.uid()::text);

-- Writes: only an authenticated user can write into their own folder
-- (files must be uploaded under a path like "<user_id>/filename.ext")
create policy "own_write_project_photos" on storage.objects for insert
  with check (bucket_id = 'project-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own_update_project_photos" on storage.objects for update
  using (bucket_id = 'project-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own_delete_project_photos" on storage.objects for delete
  using (bucket_id = 'project-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "own_write_yarn_photos" on storage.objects for insert
  with check (bucket_id = 'yarn-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own_update_yarn_photos" on storage.objects for update
  using (bucket_id = 'yarn-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own_delete_yarn_photos" on storage.objects for delete
  using (bucket_id = 'yarn-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "own_write_project_sketches" on storage.objects for insert
  with check (bucket_id = 'project-sketches' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own_update_project_sketches" on storage.objects for update
  using (bucket_id = 'project-sketches' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own_delete_project_sketches" on storage.objects for delete
  using (bucket_id = 'project-sketches' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "own_write_pattern_exports" on storage.objects for insert
  with check (bucket_id = 'pattern-exports' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own_update_pattern_exports" on storage.objects for update
  using (bucket_id = 'pattern-exports' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own_delete_pattern_exports" on storage.objects for delete
  using (bucket_id = 'pattern-exports' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "own_write_pattern_library" on storage.objects for insert
  with check (bucket_id = 'pattern-library' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own_update_pattern_library" on storage.objects for update
  using (bucket_id = 'pattern-library' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own_delete_pattern_library" on storage.objects for delete
  using (bucket_id = 'pattern-library' and (storage.foldername(name))[1] = auth.uid()::text);
