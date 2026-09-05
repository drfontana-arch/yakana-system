-- Yakana Studio — add physical storage location to existing yarns
alter table yarns add column if not exists location text;
