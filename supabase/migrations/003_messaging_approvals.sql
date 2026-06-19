-- ============================================================
-- Client messaging + milestone approvals
-- ============================================================

-- Client messages (client → team)
create table if not exists public.client_messages (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects(id) on delete cascade,
  message      text not null,
  author_email text not null,
  created_at   timestamptz not null default now()
);

alter table public.client_messages enable row level security;

create policy "client_read_own_messages"
  on public.client_messages for select
  using (project_id in (
    select id from public.projects where client_email = (auth.jwt() ->> 'email')
  ));

create policy "client_insert_own_message"
  on public.client_messages for insert
  with check (
    project_id in (
      select id from public.projects where client_email = (auth.jwt() ->> 'email')
    )
    and author_email = (auth.jwt() ->> 'email')
  );

-- Milestone approval columns
alter table public.milestones
  add column if not exists client_approved boolean,
  add column if not exists client_comment  text,
  add column if not exists approved_at     timestamptz;

-- Allow clients to update the approval columns on their milestones
create policy "client_update_milestone_approval"
  on public.milestones for update
  using (project_id in (
    select id from public.projects where client_email = (auth.jwt() ->> 'email')
  ))
  with check (project_id in (
    select id from public.projects where client_email = (auth.jwt() ->> 'email')
  ));
