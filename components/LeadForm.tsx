'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';

export function LeadForm({ carId, title = 'Оставить заявку', compact = false }: { carId?: number; title?: string; compact?: boolean }) {
  const [method, setMethod] = useState<'telegram' | 'whatsapp' | 'phone'>('telegram');
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState('');

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setState('sending');
    setError('');
    const res = await fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: f.get('name'), contact: f.get('contact'), method, comment: f.get('comment') ?? '',
        carId, consent: f.get('consent') === 'on',
      }),
    });
    if (res.ok) { setState('done'); return; }
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setError(data.error ?? 'Не удалось отправить. Напишите нам в Telegram.');
    setState('idle');
  }

  if (state === 'done') {
    return (
      <div className="rounded-2xl bg-lime/20 p-5 text-sm">
        <div className="text-base font-bold">Заявка отправлена</div>
        <p className="mt-1 text-ink/70">Ответим в течение дня. Мы пишем только с официальных контактов, указанных на сайте.</p>
      </div>
    );
  }

  const placeholder = method === 'telegram' ? '@username или телефон' : '+7 900 000-00-00';
  return (
    <form onSubmit={submit} className="space-y-3">
      {!compact && <div className="text-lg font-bold">{title}</div>}
      <input name="name" className="input" placeholder="Как к вам обращаться" maxLength={100} />
      <div className="grid grid-cols-3 gap-1.5">
        {([['telegram', 'Telegram'], ['whatsapp', 'WhatsApp'], ['phone', 'Звонок']] as const).map(([k, label]) => (
          <button key={k} type="button" onClick={() => setMethod(k)} className={`rounded-xl border px-2 py-2 text-xs font-semibold ${method === k ? 'border-ink bg-ink text-lime' : 'border-ink/15 bg-white'}`}>{label}</button>
        ))}
      </div>
      <input name="contact" required className="input" placeholder={placeholder} maxLength={100} />
      {!compact && <textarea name="comment" className="input min-h-20" placeholder="Бюджет, модель, пожелания" maxLength={1000} />}
      <label className="flex items-start gap-2 text-xs text-ink/60">
        <input type="checkbox" name="consent" required className="mt-0.5 h-4 w-4 accent-lime-700" />
        <span>Согласен на обработку персональных данных по <Link href="/privacy" className="underline">политике конфиденциальности</Link></span>
      </label>
      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
      <button type="submit" disabled={state === 'sending'} className="btn-lime w-full">{state === 'sending' ? 'Отправляем…' : 'Отправить'}</button>
    </form>
  );
}
