-- Create Strategic Objectives Table (KPIs)
create table if not exists mapper.strategic_objectives (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  kpi_metric text not null, -- e.g. "Employee Coverage", "Satisfaction Score"
  kpi_target numeric not null default 100,
  kpi_current numeric not null default 0,
  kpi_unit text not null default '%', -- '%', 'Users', 'Hours', etc.
  deadline date,
  year int not null default extract(year from current_date),
  status text default 'pending' check (status in ('pending', 'in_progress', 'completed', 'archived')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table mapper.strategic_objectives enable row level security;

-- Policies
create policy "Authenticated users can view strategic objectives"
  on mapper.strategic_objectives for select
  using ( auth.role() = 'authenticated' );

create policy "Admins can manage strategic objectives"
  on mapper.strategic_objectives for all
  using ( public.has_role(auth.uid(), 'admin') );

-- Seed some example data
insert into mapper.strategic_objectives (title, description, kpi_metric, kpi_target, kpi_current, kpi_unit, deadline, status, year)
values 
('Cobertura de Capacitación de Seguridad', 'Lograr que el 100% del personal técnico complete el módulo de OWASP.', 'Staff Certified', 100, 45, '%', '2025-12-31', 'in_progress', 2025),
('Reducción de Deuda Técnica', 'Disminuir el número de issues críticos mediante capacitación en Clean Code.', 'Critical Issues', 50, 120, 'Issues', '2025-10-30', 'in_progress', 2025),
('Upskilling en IA', 'Formar a 5 desarrolladores en integración de LLMs.', 'Developers Trained', 5, 1, 'Devs', '2025-06-30', 'in_progress', 2025);
