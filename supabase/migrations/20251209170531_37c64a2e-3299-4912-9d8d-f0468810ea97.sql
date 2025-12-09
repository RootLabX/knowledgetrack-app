-- Create achievements table for gamification
CREATE TABLE public.achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT 'award',
  category text NOT NULL DEFAULT 'general',
  points integer NOT NULL DEFAULT 10,
  criteria_type text NOT NULL, -- 'courses_completed', 'assessment_score', 'streak', 'first_course', etc.
  criteria_value integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user_achievements table to track earned achievements
CREATE TABLE public.user_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Create user_objectives table for personal goals
CREATE TABLE public.user_objectives (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  target_value integer NOT NULL DEFAULT 1,
  current_value integer NOT NULL DEFAULT 0,
  objective_type text NOT NULL, -- 'courses', 'assessment_score', 'daily_streak'
  status text NOT NULL DEFAULT 'active',
  due_date timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_objectives ENABLE ROW LEVEL SECURITY;

-- Achievements policies (everyone can view)
CREATE POLICY "Everyone can view achievements" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "Admins can manage achievements" ON public.achievements FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- User achievements policies
CREATE POLICY "Users can view own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "System can insert achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User objectives policies
CREATE POLICY "Users can view own objectives" ON public.user_objectives FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can manage own objectives" ON public.user_objectives FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own objectives" ON public.user_objectives FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own objectives" ON public.user_objectives FOR DELETE USING (auth.uid() = user_id);

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, category, points, criteria_type, criteria_value) VALUES
('Primer Paso', 'Completa tu primera evaluación técnica', 'rocket', 'assessment', 50, 'first_assessment', 1),
('Estudiante Dedicado', 'Completa tu primer curso', 'book-open', 'courses', 25, 'first_course', 1),
('Aprendiz Constante', 'Completa 3 cursos', 'graduation-cap', 'courses', 75, 'courses_completed', 3),
('Maestro del Código', 'Completa 5 cursos', 'code', 'courses', 150, 'courses_completed', 5),
('Genio Técnico', 'Obtén 90% o más en la evaluación', 'brain', 'assessment', 200, 'assessment_score', 90),
('Buen Rendimiento', 'Obtén 75% o más en la evaluación', 'target', 'assessment', 100, 'assessment_score', 75),
('Git Master', 'Obtén 100% en la sección de Git', 'git-branch', 'skills', 50, 'section_perfect', 1),
('SQL Expert', 'Obtén 100% en la sección de SQL', 'database', 'skills', 50, 'section_perfect', 1),
('Arquitecto', 'Obtén 100% en Patrones de Diseño', 'layers', 'skills', 50, 'section_perfect', 1),
('Colaborador', 'Completa la sección de Trabajo en Equipo con 80%+', 'users', 'skills', 40, 'section_score', 80);