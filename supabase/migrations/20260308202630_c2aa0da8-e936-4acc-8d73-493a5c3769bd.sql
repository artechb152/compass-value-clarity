
ALTER TABLE public.scenarios ADD COLUMN IF NOT EXISTS escalation_he text;
ALTER TABLE public.scenarios ADD COLUMN IF NOT EXISTS choices2_json jsonb;

ALTER TABLE public.responses ADD COLUMN IF NOT EXISTS choice2 integer;
