'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import type { FacetOption } from '@/lib/catalog';

interface Props {
  initial: Record<string, string>;
  manufacturers: FacetOption[];
  colors: FacetOption[];
  bodies: FacetOption[];
}

const FUELS: [string, string][] = [
  ['petrol', 'Бензин'], ['diesel', 'Дизель'], ['hybrid', 'Гибрид'], ['lpg', 'Газ (LPG)'], ['electric', 'Электро'], ['hydrogen', 'Водород'],
];

const YEARS = Array.from({ length: 25 }, (_, i) => new Date().getFullYear() - i);

async function loadOptions(brand: string, model?: string): Promise<FacetOption[]> {
  const sp = new URLSearchParams({ brand });
  if (model) sp.set('model', model);
  const r = await fetch(`/api/facets?${sp}`);
  return r.ok ? ((await r.json()) as { options: FacetOption[] }).options : [];
}

export function Filters({ initial, manufacturers, colors, bodies }: Props) {
  const router = useRouter();
  const [v, setV] = useState<Record<string, string>>(initial);
  const [groups, setGroups] = useState<FacetOption[]>([]);
  const [models, setModels] = useState<FacetOption[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => { setV(initial); }, [initial]);
  useEffect(() => {
    if (v.brand) void loadOptions(v.brand).then(setGroups); else setGroups([]);
  }, [v.brand]);
  useEffect(() => {
    if (v.brand && v.model) void loadOptions(v.brand, v.model).then(setModels); else setModels([]);
  }, [v.brand, v.model]);

  const set = (k: string, val: string) => setV((prev) => {
    const next = { ...prev, [k]: val };
    if (k === 'brand') { next.model = ''; next.gen = ''; }
    if (k === 'model') next.gen = '';
    return next;
  });
  const fuels = new Set((v.fuel ?? '').split(',').filter(Boolean));
  const toggleFuel = (f: string) => {
    const next = new Set(fuels);
    if (next.has(f)) next.delete(f); else next.add(f);
    set('fuel', [...next].join(','));
  };
  const check = (k: string) => v[k] === '1';
  const toggle = (k: string) => set(k, check(k) ? '' : '1');

  function submit(e?: FormEvent) {
    e?.preventDefault();
    const sp = new URLSearchParams();
    for (const [k, val] of Object.entries(v)) if (val && k !== 'page') sp.set(k, val);
    router.push(`/catalog${sp.size ? `?${sp}` : ''}`);
    setOpen(false);
  }

  function reset() {
    setV({});
    router.push('/catalog');
    setOpen(false);
  }

  const range = (label: string, a: string, b: string, step?: string) => (
    <div>
      <span className="label">{label}</span>
      <div className="grid grid-cols-2 gap-2">
        <input className="input" inputMode="numeric" placeholder="от" value={v[a] ?? ''} onChange={(e) => set(a, e.target.value.replace(/[^\d]/g, ''))} step={step} />
        <input className="input" inputMode="numeric" placeholder="до" value={v[b] ?? ''} onChange={(e) => set(b, e.target.value.replace(/[^\d]/g, ''))} step={step} />
      </div>
    </div>
  );
  const box = (k: string, text: string) => (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm">
      <input type="checkbox" className="h-4 w-4 accent-lime-700" checked={check(k)} onChange={() => toggle(k)} />
      {text}
    </label>
  );

  const form = (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <span className="label">Марка</span>
        <select className="input" value={v.brand ?? ''} onChange={(e) => set('brand', e.target.value)}>
          <option value="">Все марки</option>
          {manufacturers.map((m) => <option key={m.value} value={m.value}>{m.value} ({m.count.toLocaleString('ru-RU')})</option>)}
        </select>
      </div>
      <div>
        <span className="label">Модель</span>
        <select className="input" value={v.model ?? ''} onChange={(e) => set('model', e.target.value)} disabled={!v.brand}>
          <option value="">Все модели</option>
          {groups.map((m) => <option key={m.value} value={m.value}>{m.value} ({m.count})</option>)}
        </select>
      </div>
      <div>
        <span className="label">Поколение</span>
        <select className="input" value={v.gen ?? ''} onChange={(e) => set('gen', e.target.value)} disabled={!v.model}>
          <option value="">Все поколения</option>
          {models.map((m) => <option key={m.value} value={m.value}>{m.value} ({m.count})</option>)}
        </select>
      </div>
      {range('Цена под ключ, ₽', 'price_min', 'price_max')}
      <div>
        <span className="label">Год выпуска</span>
        <div className="grid grid-cols-2 gap-2">
          <select className="input" value={v.year_min ?? ''} onChange={(e) => set('year_min', e.target.value)}>
            <option value="">от</option>{YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="input" value={v.year_max ?? ''} onChange={(e) => set('year_max', e.target.value)}>
            <option value="">до</option>{YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>
      {range('Пробег, км', 'km_min', 'km_max')}
      <div>
        <span className="label">Топливо</span>
        <div className="flex flex-wrap gap-1.5">
          {FUELS.map(([k, label]) => (
            <button type="button" key={k} onClick={() => toggleFuel(k)} className={`chip border px-3 py-1.5 ${fuels.has(k) ? 'border-ink bg-ink text-lime' : 'border-ink/15 bg-white text-ink/70'}`}>{label}</button>
          ))}
        </div>
      </div>
      {range('Мощность, л.с.', 'hp_min', 'hp_max')}
      {range('Объём двигателя, см³', 'cc_min', 'cc_max')}
      <div className="space-y-2.5">
        {box('low_util', 'Льготный утильсбор (до 160 л.с.)')}
        {box('passable', 'Проходные (3–5 лет)')}
        {box('awd', 'Только полный привод')}
      </div>
      <div className="space-y-2.5 border-t border-ink/10 pt-4">
        <span className="label">История</span>
        {box('no_acc', 'Без страховых случаев')}
        {box('no_dmg', 'Без замен и окрасов кузова')}
        <div>
          <span className="label">Страховые выплаты до, ₩</span>
          <input className="input" inputMode="numeric" placeholder="например, 1000000" value={v.ins_max ?? ''} onChange={(e) => set('ins_max', e.target.value.replace(/[^\d]/g, ''))} />
        </div>
      </div>
      <div>
        <span className="label">Кузов</span>
        <select className="input" value={v.body ?? ''} onChange={(e) => set('body', e.target.value)}>
          <option value="">Любой</option>
          {bodies.map((m) => <option key={m.value} value={m.value}>{m.value}</option>)}
        </select>
      </div>
      <div>
        <span className="label">Цвет</span>
        <select className="input" value={v.color ?? ''} onChange={(e) => set('color', e.target.value)}>
          <option value="">Любой</option>
          {colors.map((m) => <option key={m.value} value={m.value}>{m.value}</option>)}
        </select>
      </div>
      <div className="sticky bottom-0 -mx-1 flex gap-2 bg-inherit px-1 pb-1 pt-2">
        <button type="submit" className="btn-dark flex-1">Показать</button>
        <button type="button" onClick={reset} className="btn-ghost">Сбросить</button>
      </div>
    </form>
  );

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-dark w-full lg:hidden">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M7 12h10M10 18h4" /></svg>
        Фильтры
      </button>
      <aside className="card hidden p-5 lg:block">{form}</aside>
      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-ink/60" onClick={() => setOpen(false)} />
          <div className="relative ml-auto h-full w-full max-w-sm overflow-y-auto bg-paper p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-lg font-bold">Фильтры</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Закрыть" className="p-1">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
            {form}
          </div>
        </div>
      )}
    </>
  );
}
