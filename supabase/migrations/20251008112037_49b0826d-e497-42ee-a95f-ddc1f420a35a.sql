-- Create storage buckets for sermon documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('sermons', 'sermons', false, 10485760, ARRAY['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('transcripts', 'transcripts', false, 10485760, ARRAY['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']);

-- Storage policies for sermons bucket
CREATE POLICY "Users can upload sermon documents for their churches"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'sermons' AND
    (storage.foldername(name))[1]::uuid IN (
      SELECT church_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view sermon documents for their churches"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'sermons' AND
    (storage.foldername(name))[1]::uuid IN (
      SELECT church_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and owners can delete sermon documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'sermons' AND
    (
      public.has_role(auth.uid(), (storage.foldername(name))[1]::uuid, 'owner') OR
      public.has_role(auth.uid(), (storage.foldername(name))[1]::uuid, 'admin')
    )
  );

-- Storage policies for transcripts bucket
CREATE POLICY "Users can upload transcripts for their churches"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'transcripts' AND
    (storage.foldername(name))[1]::uuid IN (
      SELECT church_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view transcripts for their churches"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'transcripts' AND
    (storage.foldername(name))[1]::uuid IN (
      SELECT church_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and owners can delete transcripts"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'transcripts' AND
    (
      public.has_role(auth.uid(), (storage.foldername(name))[1]::uuid, 'owner') OR
      public.has_role(auth.uid(), (storage.foldername(name))[1]::uuid, 'admin')
    )
  );