-- Echo 考研英语（二）AI 学习平台 · Supabase 表结构
-- 直接点 Run（或按 Ctrl+Enter），等待显示 Success

create table if not exists public.users (
  id uuid primary key,
  email text not null unique,
  name text not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.attempts (
  id uuid primary key,
  user_id uuid not null references public.users (id) on delete cascade,
  kind text not null,
  paper_year integer,
  item_key text not null,
  score numeric,
  max_score numeric,
  correct integer,
  total integer,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.wrong_items (
  id uuid primary key,
  user_id uuid not null references public.users (id) on delete cascade,
  kind text not null,
  paper_year integer not null,
  item_key text not null,
  question_no integer not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wrong_items_unique unique (user_id, kind, paper_year, item_key, question_no)
);

create table if not exists public.favorites (
  id uuid primary key,
  user_id uuid not null references public.users (id) on delete cascade,
  kind text not null,
  paper_year integer not null,
  item_key text not null,
  question_no integer,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint favorites_unique unique (user_id, kind, paper_year, item_key)
);

create index if not exists attempts_user_created_idx
  on public.attempts (user_id, created_at desc);

create index if not exists wrong_items_user_updated_idx
  on public.wrong_items (user_id, updated_at desc);

create index if not exists favorites_user_created_idx
  on public.favorites (user_id, created_at desc);

alter table public.users enable row level security;
alter table public.attempts enable row level security;
alter table public.wrong_items enable row level security;
alter table public.favorites enable row level security;
