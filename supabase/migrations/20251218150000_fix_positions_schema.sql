-- Create table for Position Levels/Requirements
-- This allows us to extend the existing public.positions table without modifying it
create table if not exists mapper.position_requirements (
  id uuid default gen_random_uuid() primary key,
  position_id uuid references public.positions(id) on delete cascade not null,
  level int not null check (level between 1 and 3), -- 1=Junior, 2=Mid, 3=Senior
  requirements jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  unique(position_id) -- One set of requirements per position
);

-- Enable RLS
alter table mapper.position_requirements enable row level security;

-- Policies
create policy "Everyone can read position requirements"
  on mapper.position_requirements for select
  using ( true );

create policy "Admins can manage position requirements"
  on mapper.position_requirements for all
  using ( public.has_role(auth.uid(), 'admin') );


-- SEED DATA script using specific names provided by the user
DO $$
DECLARE
  junior_id uuid;
  mid_id uuid;
  senior_id uuid;
BEGIN
  -- 1. Find the specific IDs based on the names provided by the user
  -- Note: We use LIKE/ILIKE to be robust against minor spacing variations
  
  -- Junior (Entry-Level) -> Level 1
  SELECT id INTO junior_id FROM public.positions 
  WHERE name ILIKE '%Junior (Entry-Level)%' LIMIT 1;

  -- Mid-Level / Semi-Senior -> Level 2
  SELECT id INTO mid_id FROM public.positions 
  WHERE name ILIKE '%Mid-Level%' LIMIT 1;

  -- Senior -> Level 3
  SELECT id INTO senior_id FROM public.positions 
  WHERE name ILIKE 'Desarrollador(a) Senior%' LIMIT 1;

  -- 2. Insert Requirements linked to these IDs
  -- Validating we found them to avoid errors
  
  IF junior_id IS NOT NULL THEN
    INSERT INTO mapper.position_requirements (position_id, level, requirements) 
    VALUES (junior_id, 1, '{"git": "basic", "sql": "basic"}')
    ON CONFLICT (position_id) DO UPDATE SET requirements = EXCLUDED.requirements;
  END IF;

  IF mid_id IS NOT NULL THEN
    INSERT INTO mapper.position_requirements (position_id, level, requirements) 
    VALUES (mid_id, 2, '{"git": "flow", "sql": "intermediate", "patterns": "basic"}')
    ON CONFLICT (position_id) DO UPDATE SET requirements = EXCLUDED.requirements;
  END IF;

  IF senior_id IS NOT NULL THEN
    INSERT INTO mapper.position_requirements (position_id, level, requirements) 
    VALUES (senior_id, 3, '{"git": "advanced", "sql": "advanced", "patterns": "advanced", "architecture": "intermediate"}')
    ON CONFLICT (position_id) DO UPDATE SET requirements = EXCLUDED.requirements;
  END IF;

END $$;
