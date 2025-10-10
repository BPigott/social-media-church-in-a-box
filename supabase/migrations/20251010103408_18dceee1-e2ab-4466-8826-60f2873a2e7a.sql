-- Add website_last_crawled_at to style_guides table
ALTER TABLE style_guides 
ADD COLUMN website_last_crawled_at TIMESTAMPTZ;

COMMENT ON COLUMN style_guides.website_last_crawled_at IS 'Timestamp of the last website crawl for this church';

-- Clean up service_type from existing service_times JSONB data
UPDATE churches
SET service_times = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'day', elem->>'day',
      'time', elem->>'time'
    )
  )
  FROM jsonb_array_elements(service_times) AS elem
)
WHERE service_times IS NOT NULL 
  AND service_times != '[]'::jsonb;

COMMENT ON COLUMN churches.service_times IS 'Array of service times with day and time fields only';