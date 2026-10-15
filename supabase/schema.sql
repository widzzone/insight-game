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


-- InsightLive V2.2 – Quiz Battle
-- Jalankan sekali di Supabase SQL Editor setelah V2.1.
-- Kolom baru tidak menghapus jawaban/sesi yang sudah tersimpan.

alter table public.responses
  add column if not exists score_points integer not null default 0,
  add column if not exists is_correct boolean,
  add column if not exists answer_duration_ms integer;

alter table public.responses
  drop constraint if exists il_score_points_range;
alter table public.responses
  add constraint il_score_points_range check (score_points between 0 and 1500);

-- Tanggapan kuis lama dihitung ulang hanya sebagai 1.000 poin benar,
-- tanpa bonus waktu karena tidak tersedia data timestamp timer yang andal.
update public.responses as r
set is_correct = (r.value->>'choice')::integer = (q.config->>'correct')::integer,
    score_points = case when (r.value->>'choice')::integer = (q.config->>'correct')::integer then 1000 else 0 end,
    answer_duration_ms = null
from public.questions as q
where r.question_id=q.id and q.type='quiz'
  and r.is_correct is null
  and (r.value->>'choice') ~ '^[0-9]+$'
  and (q.config->>'correct') ~ '^[0-9]+$';

-- Kalkulasi skor dan pemeriksaan batas waktu dilakukan secara atomik di DB.
-- Aplikasi (termasuk browser yang dimodifikasi) tidak dapat menentukan poin sendiri.
create or replace function public.il_score_and_guard_response()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  q public.questions%rowtype;
  current_status text;
  stamped_at timestamptz := clock_timestamp();
  remaining_ms numeric;
  duration_ms numeric;
  chosen int;
begin
  select * into q from public.questions
  where id=new.question_id and room_code=new.room_code
  for share;
  if not found then
    raise exception 'QUESTION_NOT_FOUND' using errcode='P0001';
  end if;
  select status into current_status from public.rooms where code=new.room_code for share;
  if coalesce(current_status,'') <> 'open' then
    raise exception 'ROOM_CLOSED' using errcode='P0001';
  end if;
  -- Tolak submit ke pertanyaan tidak aktif.
  if not exists (select 1 from public.rooms where code=new.room_code and active_question_id=q.id) then
    raise exception 'QUESTION_NOT_ACTIVE' using errcode='P0001';
  end if;
  if q.timer_seconds>0 and (q.timer_ends_at is null or q.timer_ends_at <= stamped_at) then
    raise exception 'TIMER_EXPIRED_OR_PAUSED' using errcode='P0001';
  end if;

  new.score_points := 0;
  new.is_correct := null;
  new.answer_duration_ms := null;
  if q.type='quiz' then
    if q.revealed then
      raise exception 'QUIZ_ALREADY_REVEALED' using errcode='P0001';
    end if;
    if coalesce(trim(new.display_name),'')='' or lower(trim(new.display_name))='anonim' then
      raise exception 'QUIZ_NAME_REQUIRED' using errcode='P0001';
    end if;
    if coalesce(new.value->>'choice','') !~ '^[0-9]+$' then
      raise exception 'QUIZ_INVALID_CHOICE' using errcode='P0001';
    end if;
    chosen:=(new.value->>'choice')::integer;
    if chosen<0 or chosen >= jsonb_array_length(q.options) then
      raise exception 'QUIZ_INVALID_CHOICE' using errcode='P0001';
    end if;
    new.is_correct := chosen = (q.config->>'correct')::integer;
    if q.timer_seconds > 0 then
      duration_ms := q.timer_seconds * 1000.0;
      remaining_ms := least(duration_ms, greatest(0, extract(epoch from (q.timer_ends_at-stamped_at))*1000));
      new.answer_duration_ms := round(duration_ms-remaining_ms)::integer;
    end if;
    if new.is_correct then
      new.score_points := 1000;
      if q.timer_seconds > 0 then
        new.score_points := 1000 + round(500*remaining_ms/duration_ms)::integer;
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists il_score_and_guard_response_trigger on public.responses;
create trigger il_score_and_guard_response_trigger
before insert on public.responses
for each row execute function public.il_score_and_guard_response();

-- Leaderboard agregat (tanpa membocorkan pilihan/kunci jawaban).
-- Mode publik HANYA menghitung pertanyaan kuis yang sudah ditampilkan.
create or replace function public.il_quiz_leaderboard(
  p_room_code text,
  p_public boolean default true
)
returns table (
  visitor_id text,
  display_name text,
  total_points bigint,
  correct_count bigint,
  answered_count bigint,
  avg_answer_ms numeric,
  place bigint
)
language sql
stable
security definer
set search_path=public
as $$
with attempts as (
  select r.visitor_id, r.display_name, r.score_points, r.is_correct,
         r.answer_duration_ms, r.created_at
  from public.responses r
  join public.questions q on q.id=r.question_id and q.room_code=r.room_code
  where r.room_code=p_room_code and q.type='quiz'
    and (not p_public or q.revealed=true)
), sums as (
  select a.visitor_id,
    (array_agg(a.display_name order by a.created_at desc))[1] as display_name,
    sum(a.score_points)::bigint as total_points,
    count(*) filter (where a.is_correct)::bigint as correct_count,
    count(*)::bigint as answered_count,
    round(avg(a.answer_duration_ms)::numeric) as avg_answer_ms,
    min(a.created_at) as first_answer_at
  from attempts a
  group by a.visitor_id
)
select s.visitor_id, s.display_name, s.total_points, s.correct_count,
       s.answered_count, s.avg_answer_ms,
       row_number() over (
         order by s.total_points desc, s.correct_count desc,
         s.avg_answer_ms asc nulls last, s.first_answer_at asc, s.visitor_id asc
       )::bigint as place
from sums s
order by place
limit 50;
$$;

revoke all on function public.il_quiz_leaderboard(text,boolean) from public, anon, authenticated;
grant execute on function public.il_quiz_leaderboard(text,boolean) to service_role;
revoke all on function public.il_score_and_guard_response() from public, anon, authenticated;
-- Trigger runs automatically; direct access from public API is disallowed.
