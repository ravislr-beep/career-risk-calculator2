-- Phase-2 schema with LLM outputs retention

create table if not exists app_users (
  id uuid primary key,
  email text,
  full_name text,
  avatar_url text,
  is_admin boolean default false,
  created_at timestamptz default now()
);

create table if not exists profiles (
  id uuid primary key,
  user_id uuid references app_users(id) on delete set null,
  full_name text,
  email text,
  date_of_birth date,
  gender text,
  employment_status text,
  total_experience numeric,
  skill_proficiency_avg numeric,
  training_hours_12mo integer,
  performance_rating numeric,
  linkedin_network_size text,
  willing_to_relocate text,
  preferred_work_model text,
  notice_period_days integer,
  risk_score integer,
  risk_details jsonb,
  llm_explain text,
  llm_recommendations jsonb,
  created_at timestamptz default now()
);

create table if not exists weights (
  id serial primary key,
  weights jsonb,
  updated_at timestamptz default now()
);

create table if not exists llm_outputs (
  id uuid primary key,
  profile_id uuid references profiles(id) on delete cascade,
  provider text,
  model text,
  prompt text,
  response jsonb,
  created_at timestamptz default now()
);

-- Insert default weights if none exist
insert into weights (weights) select jsonb_build_object(
  'skills', 0.28,
  'performance', 0.22,
  'network', 0.18,
  'mobility', 0.12,
  'notice', 0.12,
  'plateau', 0.08
) where not exists (select 1 from weights);
