'use client';
import { useState } from 'react';
import type { PriceBreakdown } from '@/lib/pricing/price';
import { rub, krw } from '@/lib/format';

export function PriceBox({ calc, priceKrw, hpPending }: { calc: PriceBreakdown | null; priceKrw: number; hpPending: boolean }) {
  const [open, setOpen] = useState(false);
  if (!calc) {
    return (
      <div className="card p-5">
        <div className="text-sm text-ink/60">Цена на Encar</div>
        <div className="text-2xl font-extrabold">{krw(priceKrw)}</div>
        <p className="mt-2 text-sm text-ink/60">Готовим расчёт под ключ — данные об автомобиле ещё загружаются.</p>
      </div>
    );
  }
  const c = calc.customs;
  const shares = [
    { label: 'Автомобиль', value: calc.carRub, color: '#b5e04b' },
    { label: 'Корея и доставка', value: calc.koreaCostsRub, color: '#7da12a' },
    { label: 'Брокер и оформление', value: calc.brokerRub, color: '#454b52' },
    { label: 'Таможня', value: c.total, color: '#0c0d0f' },
  ];
  const total = shares.reduce((a, s) => a + s.value, 0);
  const showTotal = !c.needsHp && !hpPending;
  return (
    <div className="card overflow-hidden">
      <div className="bg-ink p-5 text-white">
        {showTotal ? (
          <>
            <div className="text-3xl font-extrabold tracking-tight text-lime">{rub(calc.totalRub)}</div>
            <div className="mt-1 text-sm text-white/60">под ключ до Владивостока</div>
          </>
        ) : (
          <>
            <div className="text-2xl font-extrabold">Цена уточняется</div>
            <div className="mt-1 text-sm text-white/60">Уточняем мощность двигателя — от неё зависит утильсбор. Без него: {rub(calc.totalRub)}</div>
          </>
        )}
        <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-white/10">
          {shares.map((s) => <div key={s.label} style={{ width: `${(s.value / total) * 100}%`, background: s.color === '#0c0d0f' ? '#ffffff' : s.color }} />)}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-white/60">
          {shares.map((s) => (
            <span key={s.label} className="flex items-center gap-1.5">
              <i className="h-2 w-2 rounded-full" style={{ background: s.color === '#0c0d0f' ? '#ffffff' : s.color }} />
              {s.label} {Math.round((s.value / total) * 100)}%
            </span>
          ))}
        </div>
      </div>
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-5 py-3.5 text-sm font-semibold hover:bg-ink/[.03]">
        {open ? 'Скрыть расчёт' : 'Показать расчёт цены'}
        <svg viewBox="0 0 24 24" className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {open && (
        <div className="space-y-4 border-t border-ink/10 px-5 py-4 text-sm">
          <Group title="В Корее">
            <Row label="Цена на Encar" value={`${krw(priceKrw)} = ${rub(calc.carRub)}`} />
            <Row label="Расходы по Корее и доставка до Владивостока" value={rub(calc.koreaCostsRub)} />
          </Group>
          <Group title="Во Владивостоке">
            <Row label="Брокер, СВХ, СБКТС, ЭПТС, лаборатория, порт" value={rub(calc.brokerRub)} />
          </Group>
          <Group title="Таможенные платежи">
            <Row label="Таможенное оформление" value={rub(c.clearanceFee)} />
            <Row label={`Пошлина (${c.dutyNote})`} value={rub(c.duty)} />
            {c.excise > 0 && <Row label="Акциз" value={rub(c.excise)} />}
            {c.vat > 0 && <Row label="НДС 22%" value={rub(c.vat)} />}
            <Row label={c.utilCoef != null ? `Утилизационный сбор (20 000 ₽ × ${c.utilCoef})` : 'Утилизационный сбор'} value={c.utilCoef != null ? rub(c.util) : 'уточняется'} />
            <Row label="Итого таможня" value={rub(c.total)} strong />
          </Group>
          <div className="rounded-xl bg-paper p-3 text-xs leading-relaxed text-ink/60">
            Стоимость авто и расходы по Корее — по курсу компании: 1 ₽ = {calc.rates.rubKrwRemit.toLocaleString('ru-RU')} ₩. Таможня и утильсбор — по курсу ЦБ РФ: 1 € = {calc.rates.eurRub.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽, 1000 ₩ = {(calc.rates.krwRub * 1000).toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽.
            Возраст авто для таможни: {Math.floor(calc.ageMonths / 12)} г. {calc.ageMonths % 12} мес. Итоговую сумму пошлин определяет таможня по курсу на дату оформления.
          </div>
        </div>
      )}
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-ink/40">{title}</div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? 'border-t border-ink/10 pt-1.5 font-bold' : ''}`}>
      <span className="text-ink/70">{label}</span>
      <span className="shrink-0 text-right font-semibold">{value}</span>
    </div>
  );
}
