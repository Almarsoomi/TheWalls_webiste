-- Add block_tier to track progressive lockout phases
alter table public.admin_login_attempts
  add column if not exists block_tier int not null default 0;
-- 0 = initial phase (5 attempts → 15 min)
-- 1 = post first block (2 attempts → 1 hour)
-- 2 = post second block (any wrong → 24 hours, repeating)
