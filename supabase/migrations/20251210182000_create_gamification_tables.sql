-- Create schema if not exists
CREATE SCHEMA IF NOT EXISTS mapper;

-- Create achievements table in mapper schema
CREATE TABLE IF NOT EXISTS mapper.achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  points integer NOT NULL DEFAULT 10,
  criteria_type text NOT NULL, -- 'manual', 'courses_completed', 'score_achieved'
  criteria_value integer NOT NULL DEFAULT 1,
  category text NOT NULL DEFAULT 'milestone', -- 'milestone', 'course', 'participation', 'streak'
  icon text NOT NULL DEFAULT 'award', -- 'award', 'star', etc
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user_achievements table in mapper schema
CREATE TABLE IF NOT EXISTS mapper.user_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  achievement_id uuid NOT NULL REFERENCES mapper.achievements(id),
  earned_at timestamp with time zone NOT NULL DEFAULT now(),
  assignment_note text,
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE mapper.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE mapper.user_achievements ENABLE ROW LEVEL SECURITY;

-- Policies for achievements
CREATE POLICY "Everyone can view achievements" 
ON mapper.achievements FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create achievements" 
ON mapper.achievements FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Policies for user_achievements
CREATE POLICY "Users can view own achievements" 
ON mapper.user_achievements FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert user achievements" 
ON mapper.user_achievements FOR INSERT 
WITH CHECK (auth.uid() = user_id);
