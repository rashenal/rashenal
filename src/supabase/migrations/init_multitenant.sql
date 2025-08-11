
-- init_multitenant.sql

-- Tenants table
create table tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamp with time zone default timezone('utc', now())
);

-- Profiles table
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid references tenants(id) on delete cascade,
  full_name text,
  email text,
  created_at timestamp with time zone default timezone('utc', now())
);

-- Tasks table
create table tasks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  status text check (status in ('todo', 'in_progress', 'done', 'completed')) default 'todo',
  due_date date,
  created_at timestamp with time zone default timezone('utc', now()),
  updated_at timestamp with time zone default timezone('utc', now())
);

-- Emails table (Outlook)
create table emails (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  from_email text,
  subject text,
  body text,
  received_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc', now())
);

-- Enable RLS
alter table profiles enable row level security;
alter table tasks enable row level security;
alter table emails enable row level security;

-- RLS policies
create policy "Profiles: tenant only" on profiles for select using (auth.uid() = id);
create policy "Tasks: tenant access" on tasks for all using (auth.uid() = user_id);
create policy "Emails: tenant access" on emails for all using (auth.uid() = user_id);
