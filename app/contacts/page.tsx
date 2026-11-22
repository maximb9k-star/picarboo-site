import type { Metadata } from 'next';
import { contacts } from '@/lib/contacts';
import { LeadForm } from '@/components/LeadForm';

export const metadata: Metadata = { title: 'Контакты', description: 'Связаться с PICARBOO: Telegram, WhatsApp, телефон.' };

export default function ContactsPage() {
  const c = contacts();
  const items = [
    { label: 'Telegram', value: c.telegram, href: c.telegramUrl },
    { label: 'WhatsApp', value: c.phone, href: c.whatsappUrl },
    { label: 'Телефон (Корея)', value: c.phone, href: c.phoneHref },
    { label: 'Instagram', value: '@picarboo', href: c.instagramUrl },
  ];
  return (
    <div className="container-x py-10">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Контакты</h1>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          {items.map((i) => (
            <a key={i.label} href={i.href} target={i.href.startsWith('http') ? '_blank' : undefined} rel="noopener" className="card flex items-center justify-between p-5 transition hover:shadow-lg">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-ink/45">{i.label}</div>
                <div className="mt-0.5 text-lg font-bold">{i.value}</div>
              </div>
              <span className="text-xl text-lime-700">→</span>
            </a>
          ))}
          <div className="rounded-2xl bg-ink p-5 text-sm text-white/75">
            <div className="font-bold text-lime">Осторожно, мошенники</div>
            <p className="mt-1">Мы не пишем первыми и не просим оплату на карты частных лиц. Наши контакты — только те, что указаны на этой странице.</p>
          </div>
        </div>
        <div className="card p-6"><LeadForm title="Напишите нам" /></div>
      </div>
    </div>
  );
}
