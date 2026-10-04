create extension if not exists pgcrypto;

create or replace function public.random_code() returns text
language sql volatile as $$
  select string_agg(substr('abcdefghjkmnpqrstuvwxyz23456789', 1 + floor(random() * 31)::int, 1), '')
  from generate_series(1, 8)
$$;

create table public.settings (
  id int primary key default 1 check (id = 1),
  season_start date not null default date '2026-10-01',
  tier_count int not null default 11 check (tier_count between 1 and 11),
  leaderboard_public boolean not null default true
);
insert into public.settings (id) values (1);

create table public.activities (
  key text primary key,
  name text not null,
  points int not null check (points >= 0),
  stat text not null check (stat in ('CHA', 'SSA', 'PRA', 'RIB', 'BEH')),
  sort int not null default 0
);
insert into public.activities (key, name, points, stat, sort) values
  ('odas', 'Odas', 150, 'CHA', 1),
  ('fasl', 'Fasl', 100, 'SSA', 2),
  ('nota', 'Nota Ro7eya', 100, 'PRA', 3),
  ('tasbeha', 'Tasbe7a', 50, 'PRA', 4),
  ('dars', 'Dars Ketab', 50, 'RIB', 5),
  ('discipline', 'Discipline', 200, 'BEH', 6);

create table public.kids (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  public_code text not null unique default public.random_code(),
  photo_url text,
  flag text not null default 'EG',
  club text not null default 'st-timothy',
  ssk int check (ssk between 0 and 99),
  joined_on date not null default current_date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  kid_id uuid not null references public.kids(id) on delete cascade,
  activity_key text not null references public.activities(key) on update cascade,
  date date not null,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (kid_id, activity_key, date)
);

create table public.adjustments (
  id uuid primary key default gen_random_uuid(),
  kid_id uuid not null references public.kids(id) on delete cascade,
  points int not null check (points <> 0),
  reason text not null check (length(trim(reason)) > 0),
  date date not null,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.teachers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null default 'teacher' check (role in ('teacher', 'admin'))
);

create or replace function public.is_teacher() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.teachers where user_id = auth.uid())
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.teachers where user_id = auth.uid() and role = 'admin')
$$;

alter table public.settings enable row level security;
alter table public.activities enable row level security;
alter table public.kids enable row level security;
alter table public.entries enable row level security;
alter table public.adjustments enable row level security;
alter table public.teachers enable row level security;

-- No anon policies: public pages read through the server-side service-role client.
create policy "teachers read settings" on public.settings for select to authenticated using (public.is_teacher());
create policy "admins update settings" on public.settings for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "teachers read activities" on public.activities for select to authenticated using (public.is_teacher());
create policy "admins update activities" on public.activities for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "teachers manage kids" on public.kids for all to authenticated using (public.is_teacher()) with check (public.is_teacher());
create policy "teachers read entries" on public.entries for select to authenticated using (public.is_teacher());
create policy "teachers add entries" on public.entries for insert to authenticated with check (public.is_teacher());
create policy "teachers delete entries" on public.entries for delete to authenticated using (public.is_teacher());
create policy "teachers read adjustments" on public.adjustments for select to authenticated using (public.is_teacher());
create policy "teachers add adjustments" on public.adjustments for insert to authenticated with check (public.is_teacher());
create policy "teachers delete adjustments" on public.adjustments for delete to authenticated using (public.is_teacher());
create policy "teachers read teachers" on public.teachers for select to authenticated using (public.is_teacher());

insert into storage.buckets (id, name, public) values ('photos', 'photos', true) on conflict (id) do nothing;
create policy "teachers upload photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and public.is_teacher());
