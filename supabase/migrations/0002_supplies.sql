-- Yakana Studio — needles, hooks, markers and accessories
create table if not exists supplies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references user_profiles not null,
  category text not null, -- needle/circular_needle/crochet_hook/marker/accessory/other
  name text not null,
  brand text,
  size_mm decimal(4,2),
  cable_length_cm decimal(6,2),
  material text,
  quantity decimal(6,2),
  cost decimal(10,2),
  color_hex text,
  photo_url text,
  location text,
  notes text,
  tags text[],
  created_at timestamptz default now()
);

create index if not exists idx_supplies_user_id on supplies(user_id);

alter table supplies enable row level security;

create policy "own_supplies" on supplies for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Storage bucket for photos of needles, hooks, markers and accessories
insert into storage.buckets (id, name, public)
values ('supply-photos', 'supply-photos', true)
on conflict (id) do nothing;

create policy "public_read_supply_photos" on storage.objects for select
  using (bucket_id = 'supply-photos');

create policy "own_write_supply_photos" on storage.objects for insert
  with check (bucket_id = 'supply-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own_update_supply_photos" on storage.objects for update
  using (bucket_id = 'supply-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own_delete_supply_photos" on storage.objects for delete
  using (bucket_id = 'supply-photos' and (storage.foldername(name))[1] = auth.uid()::text);
