do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'sources' and column_name = 'external_key'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'sources' and column_name = 'site_id'
  ) then
    alter table public.sources rename column external_key to site_id;
  end if;
end $$;

alter table public.sources drop constraint if exists sources_external_key_key;
alter table public.sources drop constraint if exists sources_site_id_key;
alter table public.sources drop constraint if exists sources_source_type_site_id_key;
alter table public.sources add constraint sources_source_type_site_id_key unique (source_type, site_id);
