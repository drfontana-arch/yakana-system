-- Yakana Studio — editable standard size chart used by the Calculadora
create table if not exists standard_sizes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references user_profiles not null,
  category text not null, -- baby/toddler/child/adult
  size_label text not null,
  sort_order integer not null default 0,
  chest_cm decimal(6,2),
  body_length_cm decimal(6,2),
  yoke_depth_cm decimal(6,2),
  neck_cm decimal(6,2),
  shoulder_width_cm decimal(6,2),
  sleeve_length_cm decimal(6,2),
  sleeve_circumference_cm decimal(6,2),
  cuff_circumference_cm decimal(6,2),
  created_at timestamptz default now()
);

create index if not exists idx_standard_sizes_user_id on standard_sizes(user_id);

alter table standard_sizes enable row level security;

create policy "own_standard_sizes" on standard_sizes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
