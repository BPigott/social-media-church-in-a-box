-- Add posts_per_platform column and convert post columns to arrays
-- First, add a new column to track how many posts were requested
ALTER TABLE public.generated_content 
ADD COLUMN posts_per_platform integer DEFAULT 1;

-- Convert existing single post columns to arrays
-- We'll do this by creating new array columns, migrating data, then swapping

-- Facebook
ALTER TABLE public.generated_content 
ADD COLUMN facebook_posts text[];

UPDATE public.generated_content 
SET facebook_posts = ARRAY[facebook_post]
WHERE facebook_post IS NOT NULL;

ALTER TABLE public.generated_content 
DROP COLUMN facebook_post;

ALTER TABLE public.generated_content 
RENAME COLUMN facebook_posts TO facebook_post;

-- Instagram
ALTER TABLE public.generated_content 
ADD COLUMN instagram_posts text[];

UPDATE public.generated_content 
SET instagram_posts = ARRAY[instagram_post]
WHERE instagram_post IS NOT NULL;

ALTER TABLE public.generated_content 
DROP COLUMN instagram_post;

ALTER TABLE public.generated_content 
RENAME COLUMN instagram_posts TO instagram_post;

-- TikTok
ALTER TABLE public.generated_content 
ADD COLUMN tiktok_posts text[];

UPDATE public.generated_content 
SET tiktok_posts = ARRAY[tiktok_post]
WHERE tiktok_post IS NOT NULL;

ALTER TABLE public.generated_content 
DROP COLUMN tiktok_post;

ALTER TABLE public.generated_content 
RENAME COLUMN tiktok_posts TO tiktok_post;

-- Twitter
ALTER TABLE public.generated_content 
ADD COLUMN twitter_posts text[];

UPDATE public.generated_content 
SET twitter_posts = ARRAY[twitter_post]
WHERE twitter_post IS NOT NULL;

ALTER TABLE public.generated_content 
DROP COLUMN twitter_post;

ALTER TABLE public.generated_content 
RENAME COLUMN twitter_posts TO twitter_post;