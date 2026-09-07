-- Yakana Studio — stores the OAuth connection to the user's TiendaNube store.
alter table user_profiles add column if not exists tiendanube_store_id text;
alter table user_profiles add column if not exists tiendanube_access_token text;
