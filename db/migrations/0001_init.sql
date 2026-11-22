-- Настройки, которые меняются из админки (суммы в вонах/рублях — целые числа).
create table settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into settings (key, value) values
  ('korea_costs_krw', '2000000'),      -- расходы по Корее и доставка до Владивостока, ₩
  ('broker_rub', '100000'),            -- брокер, СВХ, СБКТС, ЭПТС, порт, лаборатория, ₽
  ('deposit_krw', 'null'),             -- залог, ₩ (null — не показывать сумму)
  ('inspection_cost_krw', '150000'),   -- стоимость одного осмотра при отказе, ₩
  ('free_inspections', '5'),           -- бесплатных осмотров при покупке
  ('rub_krw_override', 'null'),        -- ручной курс ₩ за 1 ₽ (null — брать с Naver)
  ('phone', '"+821023435838"'),
  ('telegram_username', '"maximbyak"'),
  ('whatsapp', '"821023435838"');

-- Курсы валют. value — сколько единиц quote за 1 единицу base.
create table rates (
  code text primary key,               -- RUB_KRW_REMIT (₩ за 1 ₽, Naver 송금받을때), EUR_RUB, USD_RUB, KRW_RUB (ЦБ)
  value numeric(18, 8) not null,
  source text not null,
  fetched_at timestamptz not null default now()
);

-- Мощность по комплектации из базы Naver: ключ = производитель|модель|год|объём|топливо|привод.
create table specs (
  key text primary key,
  hp integer,
  hp_min integer,
  hp_max integer,
  status text not null default 'pending', -- pending | ok | ambiguous | not_found | manual
  naver_model text,
  naver_grade text,
  source_url text,
  checked_at timestamptz,
  cars_count integer not null default 0
);

create table cars (
  id bigint primary key,               -- id объявления Encar
  vehicle_id bigint,
  domestic boolean not null default true,
  manufacturer_ko text not null,
  model_group_ko text,
  model_ko text not null,
  badge_ko text,
  badge_detail_ko text,
  manufacturer text not null,          -- латиница/русский для показа
  model_group text,
  model text not null,
  badge text,
  fuel text not null,                  -- petrol | diesel | lpg | hybrid | plugin | electric | hydrogen | other
  transmission text,
  year_month integer not null,         -- 202306 — месяц выпуска/регистрации
  form_year integer,
  mileage integer not null,
  price_krw bigint not null,           -- цена на Encar, ₩
  photo_path text,
  photos jsonb not null default '[]',
  sell_type text,
  city text,
  -- детали (догружаются отдельно)
  displacement integer,
  color text,
  body text,
  seats integer,
  awd boolean not null default false,
  vin text,
  vehicle_no text,
  accident_cnt integer,
  insurance_krw bigint,
  owner_changes integer,
  damaged_parts integer,
  options jsonb,
  detail jsonb,
  detail_fetched_at timestamptz,
  -- мощность и цена
  spec_key text references specs(key) on delete set null,
  hp_manual integer,
  price_rub bigint,                    -- под ключ до Владивостока, ₽
  price_calc jsonb,
  price_calc_at timestamptz,
  -- служебное
  modified_at timestamptz,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  active boolean not null default true
);

create index cars_active_idx on cars (active, modified_at desc);
create index cars_filter_idx on cars (active, manufacturer, model_group, model);
create index cars_price_idx on cars (active, price_rub);
create index cars_year_idx on cars (active, year_month);
create index cars_mileage_idx on cars (active, mileage);
create index cars_detail_queue_idx on cars (detail_fetched_at nulls first) where active;
create index cars_spec_idx on cars (spec_key);

create table users (
  id bigserial primary key,
  telegram_id bigint unique not null,
  username text,
  first_name text,
  last_name text,
  photo_url text,
  created_at timestamptz not null default now(),
  last_login_at timestamptz not null default now()
);

create table leads (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  name text,
  contact text not null,
  contact_method text not null,       -- telegram | whatsapp | phone
  car_id bigint,
  comment text,
  user_id bigint references users(id) on delete set null,
  delivered boolean not null default false
);

create table sync_log (
  id bigserial primary key,
  job text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  ok boolean,
  info jsonb
);

-- Переводы корейских названий моделей (из фасетов Encar: ModelGroup → EngName).
create table encar_names (
  ko text primary key,
  en text not null,
  kind text not null,                 -- manufacturer | model_group
  updated_at timestamptz not null default now()
);
