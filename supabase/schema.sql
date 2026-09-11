create extension if not exists pgcrypto;

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  source_job_id text,
  slug text unique not null,
  title text not null,
  company text not null,
  location text not null default '',
  experience text not null default '',
  job_type text not null default 'Full time',
  skills text[] not null default '{}',
  summary text not null default '',
  apply_url text not null,
  source text not null,
  source_url text,
  posted_at timestamptz not null default now(),
  expires_at timestamptz,
  remote boolean not null default false,
  country_code text not null default '',
  country text not null default '',
  state text not null default '',
  city text not null default '',
  work_mode text not null default '',
  category text not null default '',
  salary_min numeric,
  salary_max numeric,
  salary_currency text not null default 'USD',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists jobs_source_job_unique
  on jobs(source, source_job_id)
  where source_job_id is not null;
create index if not exists jobs_status_posted_idx on jobs(status, posted_at desc);
create index if not exists jobs_country_idx on jobs(country_code);
create index if not exists jobs_state_idx on jobs(state);
create index if not exists jobs_city_idx on jobs(city);
create index if not exists jobs_category_idx on jobs(category);

create table if not exists outbound_clicks (
  id bigint generated always as identity primary key,
  job_id uuid references jobs(id) on delete cascade,
  referrer text,
  created_at timestamptz not null default now()
);

create table if not exists import_runs (
  id bigint generated always as identity primary key,
  source text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  imported_count int not null default 0,
  error text
);

alter table jobs enable row level security;

drop policy if exists "Public can read active jobs" on jobs;
create policy "Public can read active jobs"
on jobs for select
to anon, authenticated
using (status = 'active' and (expires_at is null or expires_at >= now()));

alter table outbound_clicks enable row level security;
alter table import_runs enable row level security;

-- Writes should be performed only by server-side code using the service-role key.
