ALTER TABLE public.scenarios
ADD COLUMN IF NOT EXISTS context_he text,
ADD COLUMN IF NOT EXISTS dilemma_question_he text,
ADD COLUMN IF NOT EXISTS choice_rationale_json jsonb,
ADD COLUMN IF NOT EXISTS closing_feedback_json jsonb;