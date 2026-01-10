-- Ensure profiles table exists
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  full_name text,
  avatar_url text,
  department text,
  position text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Ensure RLS on profiles
alter table public.profiles enable row level security;

-- Ensure positions table exists (was missing)
create table if not exists public.positions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  department text not null,
  level int not null,
  requirements jsonb default '{}'::jsonb,
  created_at timestamp with time zone not null default now()
);

-- Enable RLS on positions
alter table public.positions enable row level security;

-- Policies for positions
drop policy if exists "Everyone can read positions" on public.positions;
create policy "Everyone can read positions" on public.positions
  for select using (true);

-- Seed Positions if empty
insert into public.positions (title, department, level, requirements)
select 'Desarrollador Junior', 'Tecnología', 1, '{"git": "basic", "sql": "basic"}'::jsonb
where not exists (select 1 from public.positions where title = 'Desarrollador Junior');

insert into public.positions (title, department, level, requirements)
select 'Desarrollador Mid-Level', 'Tecnología', 2, '{"git": "flow", "sql": "intermediate", "patterns": "basic"}'::jsonb
where not exists (select 1 from public.positions where title = 'Desarrollador Mid-Level');

insert into public.positions (title, department, level, requirements)
select 'Desarrollador Senior', 'Tecnología', 3, '{"git": "advanced", "sql": "advanced", "patterns": "advanced", "architecture": "intermediate"}'::jsonb
where not exists (select 1 from public.positions where title = 'Desarrollador Senior');
