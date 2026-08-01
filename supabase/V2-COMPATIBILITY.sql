-- INDIE BILLBOARD V2 ADDITIVE COMPATIBILITY CHECK
-- Supabase Dashboard → SQL Editor → New Query → Paste → Run

alter table public.profiles add column if not exists submissions_disabled boolean not null default false;
alter table public.profiles add column if not exists banned_at timestamptz;
alter table public.profiles add column if not exists ban_reason text;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

alter table public.artist_profiles add column if not exists primary_social_platform text;
alter table public.artist_profiles add column if not exists primary_social_url text;
alter table public.artist_profiles add column if not exists is_verified boolean not null default false;
alter table public.artist_profiles add column if not exists updated_at timestamptz not null default now();

alter table public.track_submissions add column if not exists social_platform text;
alter table public.track_submissions add column if not exists social_url text;
alter table public.track_submissions add column if not exists reviewed_by uuid;
alter table public.track_submissions add column if not exists reviewed_at timestamptz;

alter table public.track_plays add column if not exists listener_hash text;
alter table public.track_plays add column if not exists listened_seconds integer not null default 0;
alter table public.track_plays add column if not exists completion_percent numeric(5,2) not null default 0;
alter table public.track_plays add column if not exists qualified boolean not null default false;
alter table public.track_plays add column if not exists invalidated boolean not null default false;
alter table public.track_plays add column if not exists created_at timestamptz not null default now();

select routine_schema, routine_name
from information_schema.routines
where routine_schema='public' and routine_name='recalculate_weekly_chart';

select id, public, file_size_limit, allowed_mime_types
from storage.buckets
where id in (
  'artist-images','track-artwork','pending-track-artwork',
  'pending-track-audio','approved-track-audio','verification-documents'
)
order by id;
