-- Add is_assessment_enabled column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_assessment_enabled BOOLEAN DEFAULT false;

-- Add comment
COMMENT ON COLUMN public.profiles.is_assessment_enabled IS 'Controls if the user is allowed to take/retake the technical assessment';
