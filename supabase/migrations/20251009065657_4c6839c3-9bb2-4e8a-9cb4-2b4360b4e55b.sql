-- Add speaker_name column to sermon_transcripts table
ALTER TABLE public.sermon_transcripts 
ADD COLUMN speaker_name text;