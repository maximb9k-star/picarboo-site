-- Повторные объявления одной машины на Encar: показываем только одно (см. dedupeCars в worker/sync.ts).
alter table cars add column if not exists is_dup boolean not null default false;
create index if not exists cars_vehicle_idx on cars (vehicle_id) where active;
