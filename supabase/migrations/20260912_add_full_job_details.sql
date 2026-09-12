alter table jobs add column if not exists description text not null default '';
alter table jobs add column if not exists sections jsonb not null default '[]'::jsonb;
alter table jobs add column if not exists salary_description text not null default '';
