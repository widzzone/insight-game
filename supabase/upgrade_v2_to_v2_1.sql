-- JALANKAN SEKALI pada Supabase > SQL Editor untuk project V2 yang SUDAH TERPASANG.
-- Aman untuk data existing: tidak menghapus room, pertanyaan, atau jawaban.
alter table public.questions
  add column if not exists timer_seconds integer not null default 0,
  add column if not exists timer_ends_at timestamptz,
  add column if not exists timer_remaining_seconds integer;

alter table public.questions
  drop constraint if exists questions_timer_seconds_range;
alter table public.questions
  add constraint questions_timer_seconds_range
    check (timer_seconds between 0 and 3600);
