-- Create context for Analytics
-- This table stores business metrics to correlate with training data
-- related_skill links the KPI to a specific assessment section (e.g. 'security')

create table if not exists mapper.business_kpis (
  id uuid default gen_random_uuid() primary key,
  metric_name text not null, -- e.g. "Production Errors", "Sales Volume"
  value numeric not null,
  recorded_at date not null default current_date,
  related_skill text, -- optional link to a skill section
  created_at timestamptz default now()
);

-- Enable RLS
alter table mapper.business_kpis enable row level security;

-- Policies
-- Admins can view and edit
create policy "Admins can view all kpis"
  on mapper.business_kpis for select
  using ( public.has_role(auth.uid(), 'admin') );

create policy "Admins can insert kpis"
  on mapper.business_kpis for insert
  with check ( public.has_role(auth.uid(), 'admin') );

create policy "Admins can update kpis"
  on mapper.business_kpis for update
  using ( public.has_role(auth.uid(), 'admin') );

-- Seed Mock Data for ROI Demo (Production Errors vs Security)
insert into mapper.business_kpis (metric_name, value, recorded_at, related_skill) values
('Production Errors', 45, date '2025-02-01', 'security'),
('Production Errors', 42, date '2025-03-01', 'security'),
('Production Errors', 35, date '2025-04-01', 'security'), -- Training starts
('Production Errors', 28, date '2025-05-01', 'security'),
('Production Errors', 15, date '2025-06-01', 'security'), -- Significant drop
('Production Errors', 12, date '2025-07-01', 'security');

-- Seed Mock Data for 'Productivity' vs 'DevOps'
insert into mapper.business_kpis (metric_name, value, recorded_at, related_skill) values
('Deployments per Day', 2, date '2025-02-01', 'devops'),
('Deployments per Day', 3, date '2025-03-01', 'devops'),
('Deployments per Day', 5, date '2025-04-01', 'devops'),
('Deployments per Day', 8, date '2025-05-01', 'devops'),
('Deployments per Day', 12, date '2025-06-01', 'devops');
