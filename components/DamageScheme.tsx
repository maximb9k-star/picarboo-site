import type { DamagePart } from '@/lib/encar/map';
import { DAMAGE_STATUS } from '@/lib/encar/map';

// Вид сверху: зоны кузова. Остальные детали (силовые элементы) — списком.
const ZONES: { key: string; match: RegExp; d: string }[] = [
  { key: 'hood', match: /Капот/, d: 'M70 30h60l6 60H64z' },
  { key: 'fl', match: /Переднее крыло \(лев/, d: 'M40 40h22l-2 50H34z' },
  { key: 'fr', match: /Переднее крыло \(прав/, d: 'M138 40h22l6 50h-26z' },
  { key: 'dfl', match: /Передняя дверь \(лев/, d: 'M34 96h26v62H34z' },
  { key: 'dfr', match: /Передняя дверь \(прав/, d: 'M140 96h26v62h-26z' },
  { key: 'drl', match: /Задняя дверь \(лев/, d: 'M34 162h26v58H34z' },
  { key: 'drr', match: /Задняя дверь \(прав/, d: 'M140 162h26v58h-26z' },
  { key: 'roof', match: /Крыша/, d: 'M66 110h68v100H66z' },
  { key: 'ql', match: /Заднее крыло \(лев/, d: 'M34 224h26l2 50H40z' },
  { key: 'qr', match: /Заднее крыло \(прав/, d: 'M140 224h26l-6 50h-22z' },
  { key: 'trunk', match: /Крышка багажника/, d: 'M66 236h68l-4 48H70z' },
];

const COLOR: Record<string, string> = { X: '#e5484d', W: '#f5a524', WC: '#f5a524', C: '#a16207', A: '#60a5fa', U: '#a78bfa', T: '#f97316' };

export function DamageScheme({ parts }: { parts: DamagePart[] }) {
  const zoneStatus = new Map<string, string>();
  for (const z of ZONES) {
    const p = parts.find((x) => z.match.test(x.name));
    if (p) zoneStatus.set(z.key, p.status[0]!);
  }
  return (
    <div className="grid items-start gap-5 sm:grid-cols-[200px_1fr]">
      <svg viewBox="0 0 200 310" className="mx-auto h-64 w-auto" role="img" aria-label="Схема кузова">
        <rect x="30" y="20" width="140" height="272" rx="40" fill="#f3f4f1" stroke="#c9ccc4" />
        {ZONES.map((z) => (
          <path key={z.key} d={z.d} fill={COLOR[zoneStatus.get(z.key) ?? ''] ?? '#ffffff'} stroke="#9aa093" strokeWidth="1.2" />
        ))}
        <path d="M66 92h68l-4 16H70z" fill="#d7dbd2" />
        <path d="M70 212h60l4 20H66z" fill="#d7dbd2" />
      </svg>
      <div>
        {parts.length === 0 ? (
          <p className="text-sm font-semibold text-lime-700">По данным осмотра замен и ремонта кузова нет.</p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {parts.map((p) => (
              <li key={p.code + p.name} className="flex items-center justify-between gap-3 border-b border-ink/5 pb-1.5">
                <span>{p.name}</span>
                <span className="flex shrink-0 gap-1">
                  {p.status.map((s) => (
                    <span key={s} className="chip text-white" style={{ background: COLOR[s] ?? '#454b52' }}>{DAMAGE_STATUS[s] ?? s}</span>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink/60">
          {['X', 'W', 'C', 'A', 'U', 'T'].map((s) => (
            <span key={s} className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: COLOR[s] }} />{DAMAGE_STATUS[s]}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
