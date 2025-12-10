-- Create Schema
create schema if not exists mapper;

-- Create assessments table to store user assessment results
CREATE TABLE mapper.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  total_questions INTEGER NOT NULL DEFAULT 75,
  correct_answers INTEGER DEFAULT 0,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  results JSONB DEFAULT '{}'::jsonb
);

-- Create assessment_responses table for individual answers
CREATE TABLE mapper.assessment_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES mapper.assessments(id) ON DELETE CASCADE NOT NULL,
  section TEXT NOT NULL,
  question_index INTEGER NOT NULL,
  selected_answer INTEGER,
  is_correct BOOLEAN,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (assessment_id, section, question_index)
);

-- Enable RLS
ALTER TABLE mapper.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mapper.assessment_responses ENABLE ROW LEVEL SECURITY;

-- Assessments policies
CREATE POLICY "Users can view own assessments" ON mapper.assessments
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create own assessments" ON mapper.assessments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assessments" ON mapper.assessments
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Assessment responses policies
CREATE POLICY "Users can view own responses" ON mapper.assessment_responses
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM mapper.assessments a WHERE a.id = assessment_id AND (a.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
  );

CREATE POLICY "Users can insert own responses" ON mapper.assessment_responses
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM mapper.assessments a WHERE a.id = assessment_id AND a.user_id = auth.uid())
  );

CREATE POLICY "Users can update own responses" ON mapper.assessment_responses
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM mapper.assessments a WHERE a.id = assessment_id AND a.user_id = auth.uid())
  );