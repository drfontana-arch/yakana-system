-- Yakana Studio — link a library entry back to the Estudio pattern it was
-- published from (null for imported reference patterns).
alter table pattern_library add column if not exists pattern_id uuid references patterns(id) on delete set null;
