-- Clear all data from tables (in correct order to respect foreign keys)
DELETE FROM public.generated_content;
DELETE FROM public.sermon_transcripts;
DELETE FROM public.style_guides;
DELETE FROM public.user_roles;
DELETE FROM public.churches;

-- Clear all files from storage buckets
DELETE FROM storage.objects WHERE bucket_id = 'transcripts';
DELETE FROM storage.objects WHERE bucket_id = 'sermons';