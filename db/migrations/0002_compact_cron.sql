-- Компактное хранение (бесплатная база Supabase — 500 МБ): тяжёлые детали авто
-- больше не храним, страница авто берёт их с Encar вживую. Состояние фоновых задач — в sync_state.
alter table cars add column age_group text, add column months_to_next integer;
update cars set age_group = price_calc->>'ageGroup', months_to_next = (price_calc->>'monthsToNextGroup')::int where price_calc is not null;
update cars set detail = null, options = null, price_calc = null, photos = '[]'::jsonb;
create index cars_age_idx on cars (active, age_group);

create table sync_state (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- В Supabase таблицы схемы public видны через Data API: закрываем, доступ только с сервера сайта.
alter table settings enable row level security;
alter table rates enable row level security;
alter table specs enable row level security;
alter table cars enable row level security;
alter table users enable row level security;
alter table leads enable row level security;
alter table sync_log enable row level security;
alter table encar_names enable row level security;
alter table sync_state enable row level security;
alter table schema_migrations enable row level security;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on all tables in schema public from anon, authenticated;
  end if;
end $$;
