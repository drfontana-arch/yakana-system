-- Yakana Studio — deleting a project should clean up everything that
-- belongs to it, instead of being blocked by a foreign key error.

alter table project_yarns drop constraint project_yarns_project_id_fkey;
alter table project_yarns add constraint project_yarns_project_id_fkey
  foreign key (project_id) references projects(id) on delete cascade;

alter table project_yarns drop constraint project_yarns_yarn_id_fkey;
alter table project_yarns add constraint project_yarns_yarn_id_fkey
  foreign key (yarn_id) references yarns(id) on delete cascade;

alter table work_sessions drop constraint work_sessions_project_id_fkey;
alter table work_sessions add constraint work_sessions_project_id_fkey
  foreign key (project_id) references projects(id) on delete cascade;

alter table project_notes drop constraint project_notes_project_id_fkey;
alter table project_notes add constraint project_notes_project_id_fkey
  foreign key (project_id) references projects(id) on delete cascade;

alter table project_media drop constraint project_media_project_id_fkey;
alter table project_media add constraint project_media_project_id_fkey
  foreign key (project_id) references projects(id) on delete cascade;

alter table raglan_calculations drop constraint raglan_calculations_project_id_fkey;
alter table raglan_calculations add constraint raglan_calculations_project_id_fkey
  foreign key (project_id) references projects(id) on delete cascade;

alter table social_content drop constraint social_content_project_id_fkey;
alter table social_content add constraint social_content_project_id_fkey
  foreign key (project_id) references projects(id) on delete cascade;

-- A pattern can outlive the project it was designed for, so unlink instead
-- of deleting it.
alter table patterns drop constraint patterns_project_id_fkey;
alter table patterns add constraint patterns_project_id_fkey
  foreign key (project_id) references projects(id) on delete set null;

alter table pattern_versions drop constraint pattern_versions_pattern_id_fkey;
alter table pattern_versions add constraint pattern_versions_pattern_id_fkey
  foreign key (pattern_id) references patterns(id) on delete cascade;
