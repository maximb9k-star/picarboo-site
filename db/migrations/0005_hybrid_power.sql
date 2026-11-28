-- Гибриды и мягкие гибриды: мощность для утильсбора = ДВС + 30-минутная мощность электромотора.
alter table specs add column if not exists ice_hp int;
alter table specs add column if not exists motor_hp int;     -- пиковая мощность электромотора, л.с.
alter table specs add column if not exists motor_source text; -- naver | table | default
-- Пересчитать уже найденные гибриды и MHEV по новым правилам (ручные значения не трогаем).
update specs set status = 'pending'
where status in ('ok', 'ambiguous')
  and (split_part(key, '|', 5) in ('hybrid', 'diesel_hybrid') or naver_grade ~* '(MHEV|마일드)');
