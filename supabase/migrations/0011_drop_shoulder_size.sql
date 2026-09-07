-- Yakana Studio — armhole depth (underarm to shoulder) for the drop-shoulder
-- construction, distinct from the raglan's yoke_depth_cm (neck to underarm).
-- Nullable: existing rows fall back to a computed estimate in the calculator
-- until the user fills in a real value.
alter table standard_sizes add column if not exists armhole_depth_cm numeric;
