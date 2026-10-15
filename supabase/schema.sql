-- Jalankan sekali di Supabase > SQL Editor.
-- Akses database hanya melalui API server Next.js dengan SUPABASE_SECRET_KEY.
create extension if not exists pgcrypto;

create table if not exists public.rooms (
  code varchar(8) primary key,
  title varchar(100) not null,
  status varchar(10) not null default 'open' check (status in ('open','closed')),
  active_question_id uuid,
  theme varchar(24) not null default 'violet',
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  room_code varchar(8) not null references public.rooms(code) on delete cascade,
  text varchar(400) not null,
  type varchar(24) not null check (type in ('insight','wordcloud','poll','quiz','scale','open','ranking')),
  options jsonb not null default '[]'::jsonb,
  config jsonb not null default '{}'::jsonb,
  ord integer not null default 1,
  revealed boolean not null default false,
  analysis jsonb,
  analyzed_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_questions_room on public.questions (room_code, ord);

create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  room_code varchar(8) not null references public.rooms(code) on delete cascade,
  visitor_id varchar(100) not null,
  display_name varchar(60) not null default 'Anonim',
  value jsonb not null,
  created_at timestamptz not null default now(),
  unique (question_id, visitor_id)
);
create index if not exists idx_responses_question on public.responses(question_id, created_at);

alter table public.rooms enable row level security;
alter table public.questions enable row level security;
alter table public.responses enable row level security;

-- Tidak ada akses langsung dari browser/anon; semua query melalui server.
revoke all on public.rooms from anon, authenticated;
revoke all on public.questions from anon, authenticated;
revoke all on public.responses from anon, authenticated;
grant select, insert, update, delete on public.rooms to service_role;
grant select, insert, update, delete on public.questions to service_role;
grant select, insert, update, delete on public.responses to service_role;

-- Kolom timer V2.1 (juga aman jika schema ini dijalankan pada database lama)
alter table public.questions
  add column if not exists timer_seconds integer not null default 0,
  add column if not exists timer_ends_at timestamptz,
  add column if not exists timer_remaining_seconds integer;
