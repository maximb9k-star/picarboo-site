'use client';
import { useRouter, useSearchParams } from 'next/navigation';

export function SortSelect({ value, options }: { value: string; options: { key: string; label: string }[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  return (
    <select
      aria-label="Сортировка"
      className="input !w-auto"
      value={value}
      onChange={(e) => {
        const next = new URLSearchParams(sp.toString());
        if (e.target.value === 'new') next.delete('sort'); else next.set('sort', e.target.value);
        next.delete('page');
        router.push(`/catalog${next.size ? `?${next}` : ''}`);
      }}
    >
      {options.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
    </select>
  );
}
