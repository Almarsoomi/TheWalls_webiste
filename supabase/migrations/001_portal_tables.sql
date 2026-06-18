-- ============================================================
-- Client Project Tracker Portal — database schema
-- ============================================================

-- Projects
create table if not exists public.projects (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  client_name         text not null,
  client_email        text not null,
  status              text not null default 'active' check (status in ('active','completed','on-hold')),
  start_date          date,
  expected_completion date,
  created_at          timestamptz not null default now()
);

-- Milestones
create table if not exists public.milestones (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  title       text not null,
  status      text not null default 'pending' check (status in ('pending','active','done')),
  position    integer not null default 0,
  updated_at  timestamptz not null default now()
);

-- Team updates / messages
create table if not exists public.project_updates (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  message     text not null,
  created_at  timestamptz not null default now()
);

-- Site progress photos
create table if not exists public.project_photos (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  storage_path  text not null,
  caption       text,
  created_at    timestamptz not null default now()
);

-- Project documents
create table if not exists public.project_documents (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  name          text not null,
  storage_path  text not null,
  created_at    timestamptz not null default now()
);

-- ── RLS ──────────────────────────────────────────────────────

alter table public.projects          enable row level security;
alter table public.milestones        enable row level security;
alter table public.project_updates   enable row level security;
alter table public.project_photos    enable row level security;
alter table public.project_documents enable row level security;

-- Clients can read their own projects
create policy "client_read_own_project"
  on public.projects for select
  using (client_email = (auth.jwt() ->> 'email'));

-- Clients can read milestones for their projects
create policy "client_read_milestones"
  on public.milestones for select
  using (project_id in (
    select id from public.projects where client_email = (auth.jwt() ->> 'email')
  ));

-- Clients can read updates for their projects
create policy "client_read_updates"
  on public.project_updates for select
  using (project_id in (
    select id from public.projects where client_email = (auth.jwt() ->> 'email')
  ));

-- Clients can read photos for their projects
create policy "client_read_photos"
  on public.project_photos for select
  using (project_id in (
    select id from public.projects where client_email = (auth.jwt() ->> 'email')
  ));

-- Clients can read documents for their projects
create policy "client_read_documents"
  on public.project_documents for select
  using (project_id in (
    select id from public.projects where client_email = (auth.jwt() ->> 'email')
  ));
