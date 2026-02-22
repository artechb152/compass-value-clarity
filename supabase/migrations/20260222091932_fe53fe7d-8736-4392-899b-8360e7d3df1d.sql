
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles: users can read their own, admins can read all
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- values table
CREATE TABLE public.values (
  id text PRIMARY KEY,
  title_he text NOT NULL,
  official_definition_he text,
  source_url text,
  youth_microcopy_he text,
  quick_exercise_question_he text,
  example_safe_he text
);
ALTER TABLE public.values ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Values are publicly readable" ON public.values FOR SELECT USING (true);
CREATE POLICY "Admins can manage values" ON public.values FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- orders table
CREATE TABLE public.orders (
  id text PRIMARY KEY,
  type text NOT NULL,
  title_he text NOT NULL,
  official_definition_he text,
  source_url text,
  red_flags_json jsonb,
  what_to_do_steps_json jsonb,
  mini_scenario_he text,
  mini_choices_json jsonb
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Orders are publicly readable" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Admins can manage orders" ON public.orders FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- scenarios table
CREATE TABLE public.scenarios (
  id text PRIMARY KEY,
  title_he text NOT NULL,
  story_he text,
  choices_json jsonb,
  feedback_json jsonb,
  value_conflicts_json jsonb,
  reflection_question_he text,
  tags_json jsonb
);
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Scenarios are publicly readable" ON public.scenarios FOR SELECT USING (true);
CREATE POLICY "Admins can manage scenarios" ON public.scenarios FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- responses table
CREATE TABLE public.responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  scenario_id text REFERENCES public.scenarios(id),
  choice int,
  selected_values_json jsonb,
  tension_mission_human int,
  tension_discipline_responsibility int,
  reflection_text text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own responses" ON public.responses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own responses" ON public.responses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can read all responses" ON public.responses FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- progress table
CREATE TABLE public.progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  module_key text NOT NULL,
  status text NOT NULL DEFAULT 'not_started',
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, module_key)
);
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own progress" ON public.progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can upsert own progress" ON public.progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.progress FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- journal_entries table
CREATE TABLE public.journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title_he text,
  body_he text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own journal" ON public.journal_entries FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own journal" ON public.journal_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own journal" ON public.journal_entries FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own journal" ON public.journal_entries FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- weekly_polls table
CREATE TABLE public.weekly_polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_key text UNIQUE NOT NULL,
  question_he text NOT NULL,
  options_json jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.weekly_polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Polls are publicly readable" ON public.weekly_polls FOR SELECT USING (true);
CREATE POLICY "Admins can manage polls" ON public.weekly_polls FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- weekly_votes table
CREATE TABLE public.weekly_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  poll_id uuid REFERENCES public.weekly_polls(id) ON DELETE CASCADE NOT NULL,
  option_index int NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, poll_id)
);
ALTER TABLE public.weekly_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own vote" ON public.weekly_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own vote" ON public.weekly_votes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all votes" ON public.weekly_votes FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- user_meta table
CREATE TABLE public.user_meta (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  intro_video_completed boolean DEFAULT false
);
ALTER TABLE public.user_meta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own meta" ON public.user_meta FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own meta" ON public.user_meta FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meta" ON public.user_meta FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- user_dilemmas table
CREATE TABLE public.user_dilemmas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title_he text NOT NULL,
  story_he text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.user_dilemmas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own dilemmas" ON public.user_dilemmas FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own dilemmas" ON public.user_dilemmas FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can read approved dilemmas" ON public.user_dilemmas FOR SELECT USING (status = 'approved');
CREATE POLICY "Admins can manage all dilemmas" ON public.user_dilemmas FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Function to get aggregated poll results (no user-level exposure)
CREATE OR REPLACE FUNCTION public.get_poll_results(p_poll_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    jsonb_agg(jsonb_build_object('option_index', option_index, 'count', cnt)),
    '[]'::jsonb
  )
  FROM (
    SELECT option_index, COUNT(*) as cnt
    FROM public.weekly_votes
    WHERE poll_id = p_poll_id
    GROUP BY option_index
    ORDER BY option_index
  ) sub
$$;
