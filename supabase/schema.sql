create extension if not exists pgcrypto;
create table if not exists jobs (
 id uuid primary key default gen_random_uuid(), source_job_id text, title text not null, company text not null,
 location text, city text, experience_min int, experience_max int, description text, skills text[] default '{}',
 job_type text, source_name text not null, source_url text, apply_url text not null, posted_date timestamptz,
 expiry_date timestamptz, status text default 'active', slug text unique not null, is_remote boolean default false,
 description_hash text, created_at timestamptz default now(), updated_at timestamptz default now()
);
create unique index if not exists jobs_source_job_unique on jobs(source_name,source_job_id) where source_job_id is not null;
create index if not exists jobs_status_created_idx on jobs(status,created_at desc);
create index if not exists jobs_city_idx on jobs(city);
create table if not exists outbound_clicks (id bigint generated always as identity primary key, job_id uuid references jobs(id) on delete cascade, referrer text, created_at timestamptz default now());
create table if not exists sources (id bigint generated always as identity primary key, name text unique not null, enabled boolean default true, source_type text, endpoint text, last_run_at timestamptz, created_at timestamptz default now());
