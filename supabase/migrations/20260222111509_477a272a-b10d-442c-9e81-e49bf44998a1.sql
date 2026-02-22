
-- Add profile fields to user_meta
ALTER TABLE public.user_meta 
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS personal_number text UNIQUE,
ADD COLUMN IF NOT EXISTS course_name text;
