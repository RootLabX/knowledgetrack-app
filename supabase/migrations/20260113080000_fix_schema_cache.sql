-- Ensure department_id exists in courses
ALTER TABLE mapper.courses 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

-- Reload Supabase Schema Cache
NOTIFY pgrst, 'reload schema';
