-- Align existing databases with the current importer upsert key.
-- Fresh installs already get this constraint from supabase/schema.sql.

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.jobs'::regclass
      and conname = 'jobs_source_source_job_id_key'
  ) then
    alter table public.jobs
      add constraint jobs_source_source_job_id_key unique (source, source_job_id);
  end if;
end $$;
