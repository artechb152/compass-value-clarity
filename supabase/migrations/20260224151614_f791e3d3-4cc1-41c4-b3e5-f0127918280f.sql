
ALTER TABLE public.values ADD COLUMN IF NOT EXISTS what_it_means_in_practice_he text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS mini_feedback_json jsonb;
