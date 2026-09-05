-- Yakana Studio — remove accidental duplicate standard sizes and make the
-- seeding safe against being triggered twice at once.

-- Keep only the oldest row per (user, category, size)
delete from standard_sizes a
using standard_sizes b
where a.user_id = b.user_id
  and a.category = b.category
  and a.size_label = b.size_label
  and a.created_at > b.created_at;

alter table standard_sizes
  add constraint standard_sizes_user_category_label_key
  unique (user_id, category, size_label);
