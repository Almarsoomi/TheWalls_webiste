-- Shop orders table (Stripe online payment + Cash on Delivery)
CREATE TABLE IF NOT EXISTS public.orders (
  id                 uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at         timestamptz DEFAULT now(),
  payment_method     text        NOT NULL,                  -- 'stripe' | 'cod'
  status             text        NOT NULL DEFAULT 'pending', -- pending | paid | cancelled
  customer_name      text        NOT NULL,
  phone              text        NOT NULL,
  email              text        NOT NULL,
  address            text,                                  -- COD only
  emirate            text,                                  -- COD only
  items              jsonb       NOT NULL,                  -- [{ id, qty, name_en, price_aed }]
  total_aed          numeric,                               -- server-computed (authoritative)
  stripe_session_id  text,
  notes              text
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- No public policies: only the service role (Edge Functions) reads/writes.
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS orders_stripe_session_idx ON public.orders (stripe_session_id);
