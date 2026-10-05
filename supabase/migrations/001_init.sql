-- study app: initial schema, rls, storage
create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- profiles + settings -------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'system' check (theme in ('system','light','dark')),
  daily_goal int not null default 20 check (daily_goal > 0),
  session_minutes int not null default 25 check (session_minutes > 0),
  card_style jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create trigger user_settings_updated before update on public.user_settings
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.user_settings (user_id) values (new.id);
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- subjects + notes ----------------------------------------------------
create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default 'blue',
  created_at timestamptz not null default now()
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null default 'Untitled',
  status text not null default 'draft' check (status in ('draft','saved')),
  content_md text not null default '',      -- simplified notes (editable)
  original_text text,                       -- raw transcription
  expires_at timestamptz default (now() + interval '48 hours'), -- drafts only; set null on save
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index notes_user_status_idx on public.notes (user_id, status);
create trigger notes_updated before update on public.notes
  for each row execute function public.set_updated_at();

create table public.note_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  note_id uuid references public.notes(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint,
  status text not null default 'uploaded'
    check (status in ('uploaded','processing','ready','failed')),
  error text,
  created_at timestamptz not null default now()
);

create table public.highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  note_id uuid not null references public.notes(id) on delete cascade,
  block_id text not null,
  start_offset int not null,
  end_offset int not null,
  quote text not null,
  color text not null default 'yellow',
  created_at timestamptz not null default now()
);
create index highlights_note_idx on public.highlights (note_id);

create table public.note_chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  note_id uuid not null references public.notes(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
create index note_chats_note_idx on public.note_chats (note_id, created_at);

-- cards + spaced repetition -------------------------------------------
create table public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  note_id uuid not null references public.notes(id) on delete cascade,
  front text not null,
  back text not null,
  source text not null default 'ai' check (source in ('ai','manual')),
  created_at timestamptz not null default now()
);
create index cards_user_note_idx on public.cards (user_id, note_id);

create table public.card_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  ease numeric not null default 2.5,
  interval_days int not null default 0,
  repetitions int not null default 0,
  lapses int not null default 0,
  due_at timestamptz not null default now(),
  last_reviewed_at timestamptz,
  primary key (user_id, card_id)
);
create index card_progress_due_idx on public.card_progress (user_id, due_at);

-- exams ---------------------------------------------------------------
create table public.exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null,
  question_types text[] not null
    default array['multiple_choice','true_false','identification','short_answer'],
  time_limit_minutes int,
  created_at timestamptz not null default now()
);

create table public.exam_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exam_id uuid not null references public.exams(id) on delete cascade,
  note_id uuid references public.notes(id) on delete set null,
  type text not null
    check (type in ('multiple_choice','true_false','identification','short_answer')),
  prompt text not null,
  options jsonb,
  answer text not null,
  explanation text,
  position int not null default 0
);
create index exam_questions_exam_idx on public.exam_questions (exam_id, position);

create table public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exam_id uuid not null references public.exams(id) on delete cascade,
  score numeric,
  total int,
  answers jsonb not null default '[]'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

-- sessions + planner --------------------------------------------------
create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('flashcards','type_answer','exam')),
  subject_id uuid references public.subjects(id) on delete set null,
  note_id uuid references public.notes(id) on delete set null,
  cards_reviewed int not null default 0,
  correct int not null default 0,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);
create index study_sessions_user_idx on public.study_sessions (user_id, started_at desc);

create table public.study_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null,
  exam_date date not null,
  note_ids uuid[] not null default '{}',
  status text not null default 'active' check (status in ('active','done')),
  created_at timestamptz not null default now()
);

-- rls -----------------------------------------------------------------
alter table public.profiles enable row level security;
create policy "own profile" on public.profiles for all to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

do $$
declare t text;
begin
  foreach t in array array[
    'user_settings','subjects','notes','note_sources','highlights','note_chats',
    'cards','card_progress','exams','exam_questions','exam_attempts',
    'study_sessions','study_plans'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "own rows" on public.%I for all to authenticated
         using (user_id = (select auth.uid()))
         with check (user_id = (select auth.uid()))', t);
  end loop;
end $$;

-- storage: private bucket, files under <user_id>/... ------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('note-files', 'note-files', false, 10485760)
on conflict (id) do nothing;

create policy "note files select" on storage.objects for select to authenticated
  using (bucket_id = 'note-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "note files insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'note-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "note files update" on storage.objects for update to authenticated
  using (bucket_id = 'note-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "note files delete" on storage.objects for delete to authenticated
  using (bucket_id = 'note-files' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- draft cleanup (schedule later with pg_cron; storage objects need separate cleanup)
create or replace function public.delete_expired_drafts()
returns void language sql security definer set search_path = '' as $$
  delete from public.notes where status = 'draft' and expires_at < now();
$$;
revoke all on function public.delete_expired_drafts() from public, anon, authenticated;
