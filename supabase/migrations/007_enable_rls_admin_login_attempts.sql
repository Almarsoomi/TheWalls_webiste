-- Enable Row Level Security on admin_login_attempts.
-- This table was publicly exposed (rls_disabled_in_public) — anyone with the
-- anon key could read/edit/delete login-attempt records.
-- No policies are added intentionally: the table is only accessed by edge
-- functions using the service-role key, which bypasses RLS. Enabling RLS with
-- no policies blocks all anon/public access while keeping backend access intact.
alter table public.admin_login_attempts enable row level security;
