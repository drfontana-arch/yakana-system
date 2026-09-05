-- Yakana Studio — distinguish the real-size calculation from its miniature
-- companion, so the project's garment sketch always uses the real one.
alter table raglan_calculations add column if not exists is_miniature boolean default false;
