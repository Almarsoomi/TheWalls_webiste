-- Remove the broad public SELECT/list policy on the project-photos bucket.
-- project-photos is a PUBLIC bucket, so images are served via the public
-- object URL (/storage/v1/object/public/project-photos/...), which does not
-- depend on any storage.objects policy. The frontend builds those URLs
-- directly and never lists the bucket; admin edge functions use the
-- service-role key (bypasses RLS).
-- This policy only enabled anonymous enumeration of every file in the bucket,
-- which no legitimate client needs (advisory: public_bucket_allows_listing).
drop policy if exists "public_read_project_photos" on storage.objects;
