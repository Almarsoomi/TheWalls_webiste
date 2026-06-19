-- Quote requests table (merged quote + booking)
CREATE TABLE IF NOT EXISTS public.quote_requests (
  id                   uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at           timestamptz DEFAULT now(),
  name                 text        NOT NULL,
  phone                text        NOT NULL,
  email                text        NOT NULL,
  project_types        text,
  space_type           text,
  area_sqm             integer,
  area_display         text,
  budget_range         text,
  description          text,
  preferred_date       date,
  preferred_time       text,
  consultation_format  text,
  file_paths           text[]      DEFAULT '{}'
);

ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

-- Storage bucket for uploaded files (private — no public read)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'quote-uploads',
  'quote-uploads',
  false,
  20971520,
  ARRAY['image/jpeg','image/png','application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Allow anonymous users to upload files to this bucket
CREATE POLICY "anon can upload quote files"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'quote-uploads');
