-- Электромобили и водородные: до подтверждения 30-минутной мощности считаем 45% пиковой (как таможня с февраля 2026).
update specs set hp = round(coalesce(hp_max, hp) * 0.45)
where split_part(key, '|', 5) in ('electric', 'hydrogen') and status in ('ok', 'ambiguous') and coalesce(hp_max, hp) is not null;
update cars set price_calc_at = null
where spec_key in (select key from specs where split_part(key, '|', 5) in ('electric', 'hydrogen'));
