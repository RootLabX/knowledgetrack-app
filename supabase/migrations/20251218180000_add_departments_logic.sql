-- Add department_id to strategic_objectives
ALTER TABLE mapper.strategic_objectives 
ADD COLUMN department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

-- Enable RLS to filter by department if needed (optional, but good practice)
-- For now, relying on frontend filtering as requested filters "when user enters", 
-- but RLS is safer. Let's keep it open for now or add a policy if the user asks for strict security.
