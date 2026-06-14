-- Creates the public help-videos storage bucket for hosting how-to MP4s and poster stills.
-- The bucket is intentionally public — these are product tutorial videos, not user data.

insert into storage.buckets (id, name, public)
  values ('help-videos', 'help-videos', true)
  on conflict (id) do nothing;

-- Allow anyone (authenticated or anon) to read objects in this bucket.
-- No INSERT/UPDATE/DELETE policy is added here: uploads are done server-side
-- via the service role key (which bypasses RLS), not by end users.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename  = 'objects'
      and policyname = 'Public read for help-videos'
  ) then
    execute $policy$
      create policy "Public read for help-videos"
        on storage.objects for select
        using ( bucket_id = 'help-videos' )
    $policy$;
  end if;
end
$$;
