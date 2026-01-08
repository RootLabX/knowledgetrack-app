-- ============================================================
-- SCRIPT DE MIGRACIÓN COMPLETO - TechSkills Platform
-- Proyecto destino: hlcfzrkqcyfynfnbkezo
-- ============================================================

-- ============================================================
-- 1. ENUM TYPES
-- ============================================================

CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- ============================================================
-- 2. TABLES
-- ============================================================

-- Profiles table
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  full_name text,
  avatar_url text,
  department text,
  position text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- User roles table
CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  role app_role NOT NULL DEFAULT 'user'::app_role,
  UNIQUE (user_id, role)
);

-- Achievements table
CREATE TABLE public.achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  points integer NOT NULL DEFAULT 10,
  criteria_type text NOT NULL,
  criteria_value integer NOT NULL DEFAULT 1,
  category text NOT NULL DEFAULT 'general'::text,
  icon text NOT NULL DEFAULT 'award'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- User achievements table
CREATE TABLE public.user_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  achievement_id uuid NOT NULL,
  earned_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Courses table
CREATE TABLE public.courses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  category text NOT NULL,
  difficulty text,
  duration_hours integer DEFAULT 0,
  objectives text[],
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- User courses table
CREATE TABLE public.user_courses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  status text DEFAULT 'assigned'::text,
  progress integer DEFAULT 0,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  started_at timestamp with time zone,
  completed_at timestamp with time zone
);

-- Assessments table
CREATE TABLE public.assessments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  status text DEFAULT 'in_progress'::text,
  total_questions integer NOT NULL DEFAULT 75,
  correct_answers integer DEFAULT 0,
  results jsonb DEFAULT '{}'::jsonb,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone
);

-- Assessment responses table
CREATE TABLE public.assessment_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id uuid NOT NULL,
  section text NOT NULL,
  question_index integer NOT NULL,
  selected_answer integer,
  is_correct boolean,
  answered_at timestamp with time zone DEFAULT now()
);

-- User objectives table
CREATE TABLE public.user_objectives (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  objective_type text NOT NULL,
  target_value integer NOT NULL DEFAULT 1,
  current_value integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active'::text,
  due_date timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone
);

-- ============================================================
-- 2.1 FOREIGN KEYS (después de crear todas las tablas)
-- ============================================================

ALTER TABLE public.user_achievements 
  ADD CONSTRAINT user_achievements_achievement_id_fkey 
  FOREIGN KEY (achievement_id) REFERENCES public.achievements(id);

ALTER TABLE public.user_courses 
  ADD CONSTRAINT user_courses_course_id_fkey 
  FOREIGN KEY (course_id) REFERENCES public.courses(id);

ALTER TABLE public.assessment_responses 
  ADD CONSTRAINT assessment_responses_assessment_id_fkey 
  FOREIGN KEY (assessment_id) REFERENCES public.assessments(id);

-- ============================================================
-- 3. FUNCTIONS
-- ============================================================

-- Function to check user roles (Security Definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  
  -- First user becomes admin
  IF (SELECT COUNT(*) FROM public.user_roles) = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- 4. TRIGGERS
-- ============================================================

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for updating updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updating updated_at on courses
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_objectives ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. RLS POLICIES - PROFILES
-- ============================================================

CREATE POLICY "Users can view all profiles" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

-- ============================================================
-- 7. RLS POLICIES - USER_ROLES
-- ============================================================

CREATE POLICY "Users can view own roles" 
ON public.user_roles FOR SELECT 
USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert roles" 
ON public.user_roles FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update roles" 
ON public.user_roles FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete roles" 
ON public.user_roles FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- 8. RLS POLICIES - ACHIEVEMENTS
-- ============================================================

CREATE POLICY "Everyone can view achievements" 
ON public.achievements FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage achievements" 
ON public.achievements FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- 9. RLS POLICIES - USER_ACHIEVEMENTS
-- ============================================================

CREATE POLICY "Users can view own achievements" 
ON public.user_achievements FOR SELECT 
USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert achievements" 
ON public.user_achievements FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 10. RLS POLICIES - COURSES
-- ============================================================

CREATE POLICY "Everyone can view active courses" 
ON public.courses FOR SELECT 
USING ((is_active = true) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert courses" 
ON public.courses FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update courses" 
ON public.courses FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete courses" 
ON public.courses FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- 11. RLS POLICIES - USER_COURSES
-- ============================================================

CREATE POLICY "Users can view own assignments" 
ON public.user_courses FOR SELECT 
USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can assign courses" 
ON public.user_courses FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update own progress" 
ON public.user_courses FOR UPDATE 
USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete assignments" 
ON public.user_courses FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- 12. RLS POLICIES - ASSESSMENTS
-- ============================================================

CREATE POLICY "Users can view own assessments" 
ON public.assessments FOR SELECT 
USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create own assessments" 
ON public.assessments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assessments" 
ON public.assessments FOR UPDATE 
USING (auth.uid() = user_id);

-- ============================================================
-- 13. RLS POLICIES - ASSESSMENT_RESPONSES
-- ============================================================

CREATE POLICY "Users can view own responses" 
ON public.assessment_responses FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM assessments a
  WHERE a.id = assessment_responses.assessment_id 
  AND (a.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
));

CREATE POLICY "Users can insert own responses" 
ON public.assessment_responses FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM assessments a
  WHERE a.id = assessment_responses.assessment_id AND a.user_id = auth.uid()
));

CREATE POLICY "Users can update own responses" 
ON public.assessment_responses FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM assessments a
  WHERE a.id = assessment_responses.assessment_id AND a.user_id = auth.uid()
));

-- ============================================================
-- 14. RLS POLICIES - USER_OBJECTIVES
-- ============================================================

CREATE POLICY "Users can view own objectives" 
ON public.user_objectives FOR SELECT 
USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can manage own objectives" 
ON public.user_objectives FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own objectives" 
ON public.user_objectives FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own objectives" 
ON public.user_objectives FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
-- NOTA: Después de ejecutar este script, deberás:
-- 1. Habilitar "Auto-confirm email" en Authentication > Settings
-- 2. Exportar e importar los datos de las tablas si necesitas migrarlos
-- 3. Actualizar las variables de entorno en tu aplicación con las nuevas credenciales
-- ============================================================
