-- Sessions are weekly, Friday to Thursday: one entry per kid per activity per week.
alter table public.entries
  add column week_start date generated always as (date - ((extract(isodow from date)::int + 2) % 7)) stored;

-- Keep only the earliest entry if an activity was logged twice in the same week.
delete from public.entries e
using public.entries older
where e.kid_id = older.kid_id
  and e.activity_key = older.activity_key
  and e.week_start = older.week_start
  and (older.date, older.created_at, older.id) < (e.date, e.created_at, e.id);

alter table public.entries drop constraint entries_kid_id_activity_key_date_key;
alter table public.entries add constraint entries_one_per_week unique (kid_id, activity_key, week_start);

-- The system's first week started on Friday 2 October 2026.
alter table public.settings alter column season_start set default date '2026-10-02';
update public.settings set season_start = date '2026-10-02' where season_start = date '2026-10-01';
update public.kids set joined_on = date '2026-10-02' where joined_on = date '2026-10-01';
