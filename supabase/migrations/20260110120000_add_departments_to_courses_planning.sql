-- Add department_id to courses
ALTER TABLE mapper.courses 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

-- Add department_id to planning_objectives
ALTER TABLE mapper.planning_objectives 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;
