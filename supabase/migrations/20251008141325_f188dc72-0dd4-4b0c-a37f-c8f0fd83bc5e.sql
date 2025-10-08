-- Clear all data from the database in the correct order to respect foreign keys

-- Delete generated content
DELETE FROM public.generated_content;

-- Delete sermon transcripts
DELETE FROM public.sermon_transcripts;

-- Delete style guides
DELETE FROM public.style_guides;

-- Delete user roles
DELETE FROM public.user_roles;

-- Delete churches
DELETE FROM public.churches;

-- Delete all users (this will cascade to any remaining references)
DELETE FROM auth.users;

-- Clear storage buckets
DELETE FROM storage.objects WHERE bucket_id IN ('sermons', 'transcripts');