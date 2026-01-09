-- Create Schema
create schema if not exists mapper;

-- Create Planning Objectives Table
create table if not exists mapper.planning_objectives (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  start_date date,
  end_date date,
  status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users(id)
);

-- Create Planning Tasks Table
create table if not exists mapper.planning_tasks (
  id uuid default gen_random_uuid() primary key,
  objective_id uuid references mapper.planning_objectives(id) on delete cascade,
  title text not null,
  assigned_to uuid references auth.users(id),
  start_date date,
  due_date date,
  progress integer default 0,
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Planning Sprints Table
create table if not exists mapper.planning_sprints (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  start_date date not null,
  end_date date not null,
  status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users(id)
);

-- Add sprint_id to Tasks
alter table mapper.planning_tasks add column if not exists sprint_id uuid references mapper.planning_sprints(id);

-- Enable RLS
alter table mapper.planning_objectives enable row level security;
alter table mapper.planning_tasks enable row level security;
alter table mapper.planning_sprints enable row level security;

-- Create policies
create policy "Enable read access for all authenticated users" on mapper.planning_objectives
  for select using (auth.role() = 'authenticated');

create policy "Enable insert for authenticated users" on mapper.planning_objectives
  for insert with check (auth.role() = 'authenticated');

create policy "Enable update for authenticated users" on mapper.planning_objectives
  for update using (auth.role() = 'authenticated');

create policy "Enable read access for all authenticated users" on mapper.planning_tasks
  for select using (auth.role() = 'authenticated');

create policy "Enable insert for authenticated users" on mapper.planning_tasks
  for insert with check (auth.role() = 'authenticated');

create policy "Enable update for authenticated users" on mapper.planning_tasks
  for update using (auth.role() = 'authenticated');

create policy "Enable read access for all authenticated users" on mapper.planning_sprints
  for select using (auth.role() = 'authenticated');

create policy "Enable insert for authenticated users" on mapper.planning_sprints
  for insert with check (auth.role() = 'authenticated');

create policy "Enable update for authenticated users" on mapper.planning_sprints
  for update using (auth.role() = 'authenticated');
