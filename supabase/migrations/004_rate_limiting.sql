-- Track failed admin login attempts per IP for brute-force protection
create table if not exists public.admin_login_attempts (
  ip            text primary key,
  attempts      int not null default 0,
  blocked_until timestamptz,
  last_attempt  timestamptz not null default now()
);
-- No RLS — only ever touched by the service role key inside Edge Functions
