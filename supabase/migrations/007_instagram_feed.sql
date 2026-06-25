-- Instagram feed: single-row store for the long-lived access token + cached Reels.
-- The `instagram-feed` Edge Function reads/writes this; the browser never touches it.
CREATE TABLE IF NOT EXISTS public.ig_feed (
  id                 int         PRIMARY KEY DEFAULT 1,
  access_token       text        NOT NULL,                   -- long-lived (~60d) IG token, auto-refreshed
  token_refreshed_at timestamptz NOT NULL DEFAULT now(),     -- last successful token refresh
  media              jsonb,                                  -- cached [{ id, caption, media_url, thumbnail_url, permalink, timestamp }]
  media_fetched_at   timestamptz,                            -- last successful media fetch
  CONSTRAINT ig_feed_singleton CHECK (id = 1)
);

ALTER TABLE public.ig_feed ENABLE ROW LEVEL SECURITY;
-- No public policies: only the service role (Edge Function) reads/writes the token.
