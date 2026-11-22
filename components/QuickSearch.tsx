'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { FacetOption } from '@/lib/catalog';

const BUDGETS = [1_500_000, 2_000_000, 3_000_000, 4_000_000, 5_000_000, 7_000_000, 10_000_000];

export function QuickSearch({ brands }: { brands: FacetOption[] }) {
  const router = useRouter();
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [budget, setBudget] = useState('');
  const [models, setModels] = useState<FacetOption[]>([]);
  useEffect(() => {
    setModel('');
    if (!brand) { setModels([]); return; }
    void fetch(`/api/facets?brand=${encodeURIComponent(brand)}`).then((r) => r.json()).then((d: { options: FacetOption[] }) => setModels(d.options));
  }, [brand]);

  function go() {
    const sp = new URLSearchParams();
    if (brand) sp.set('brand', brand);
    if (model) sp.set('model', model);
    if (budget) sp.set('price_max', budget);
    router.push(`/catalog${sp.size ? `?${sp}` : ''}`);
  }

  return (
    <div className="rounded-3xl bg-white p-5 text-ink shadow-2xl sm:p-6">
      <div className="text-lg font-extrabold">Быстрый подбор</div>
      <p className="mt-1 text-sm text-ink/55">Цены уже с растаможкой и доставкой до Владивостока</p>
      <div className="mt-5 space-y-3">
        <select className="input" value={brand} onChange={(e) => setBrand(e.target.value)} aria-label="Марка">
          <option value="">Любая марка</option>
          {brands.map((b) => <option key={b.value} value={b.value}>{b.value}</option>)}
        </select>
        <select className="input" value={model} onChange={(e) => setModel(e.target.value)} disabled={!brand} aria-label="Модель">
          <option value="">Любая модель</option>
          {models.map((m) => <option key={m.value} value={m.value}>{m.value} ({m.count})</option>)}
        </select>
        <select className="input" value={budget} onChange={(e) => setBudget(e.target.value)} aria-label="Бюджет">
          <option value="">Любой бюджет</option>
          {BUDGETS.map((b) => <option key={b} value={b}>до {b.toLocaleString('ru-RU')} ₽</option>)}
        </select>
        <button onClick={go} className="btn-dark w-full py-3.5 text-base">Найти автомобили</button>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {[['Проходные 3–5 лет', 'passable=1'], ['До 160 л.с.', 'low_util=1'], ['Без ДТП', 'no_acc=1&no_dmg=1'], ['Полный привод', 'awd=1']].map(([label, q]) => (
          <a key={label} href={`/catalog?${q}`} className="chip border border-ink/10 bg-paper px-3 py-1.5 text-ink/70 hover:border-ink/30">{label}</a>
        ))}
      </div>
    </div>
  );
}
