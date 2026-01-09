-- Grant usage on schema mapper (Crucial for 403 error)
GRANT USAGE ON SCHEMA mapper TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA mapper TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA mapper TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA mapper TO postgres, anon, authenticated, service_role;

-- Ensure future tables also get these privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA mapper GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA mapper GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA mapper GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;

-- Re-apply RLS policies for assessments to be 100% sure
DROP POLICY IF EXISTS "Users can create own assessments" ON mapper.assessments;
DROP POLICY IF EXISTS "Users can view own assessments" ON mapper.assessments;
DROP POLICY IF EXISTS "Users can update own assessments" ON mapper.assessments;

-- Simple, permissive policies for authenticated users
CREATE POLICY "Users can create own assessments" ON mapper.assessments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own assessments" ON mapper.assessments
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own assessments" ON mapper.assessments
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Also fix assessment_responses just in case
DROP POLICY IF EXISTS "Users can insert own responses" ON mapper.assessment_responses;
DROP POLICY IF EXISTS "Users can view own responses" ON mapper.assessment_responses;
DROP POLICY IF EXISTS "Users can update own responses" ON mapper.assessment_responses;

CREATE POLICY "Users can insert own responses" ON mapper.assessment_responses
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM mapper.assessments a WHERE a.id = assessment_id AND a.user_id = auth.uid())
  );

CREATE POLICY "Users can view own responses" ON mapper.assessment_responses
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM mapper.assessments a WHERE a.id = assessment_id AND (a.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
  );

CREATE POLICY "Users can update own responses" ON mapper.assessment_responses
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM mapper.assessments a WHERE a.id = assessment_id AND a.user_id = auth.uid())
  );
