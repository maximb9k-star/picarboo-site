import type { Metadata } from 'next';
import { isAdmin } from '@/lib/session';
import { loadSettings } from '@/lib/settings';
import { query } from '@/lib/db';
import { login, logout, saveSettings, setSpecHp } from './actions';

export const metadata: Metadata = { title: 'Админка', robots: { index: false } };
export const dynamic = 'force-dynamic';

type SP = Promise<Record<string, string | undefined>>;

export default async function AdminPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  if (!process.env.ADMIN_PASSWORD || !process.env.SESSION_SECRET) {
    return <Box><p>Задайте ADMIN_PASSWORD и SESSION_SECRET в файле .env на сервере.</p></Box>;
  }
  if (!(await isAdmin())) {
    return (
      <Box>
        <form action={login} className="space-y-3">
          <div className="text-lg font-bold">Вход в админку</div>
          <input name="password" type="password" className="input" placeholder="Пароль" autoFocus />
          {sp.error && <p className="text-sm text-red-600">Неверный пароль</p>}
          <button className="btn-dark w-full">Войти</button>
        </form>
      </Box>
    );
  }

  const [s, rates, stats, jobs, specs, leads] = await Promise.all([
    loadSettings(),
    query<{ code: string; value: number; source: string; fetched_at: Date }>('select * from rates order by code'),
    query<{ total: number; detailed: number; priced: number; pending_detail: number }>(
      `select count(*)::int as total, count(detail_fetched_at)::int as detailed, count(price_rub)::int as priced,
        count(*) filter (where detail_fetched_at is null)::int as pending_detail from cars where active`,
    ),
    query<{ job: string; started_at: Date; finished_at: Date | null; ok: boolean | null; info: unknown }>(
      `select distinct on (job) job, started_at, finished_at, ok, info from sync_log order by job, started_at desc`,
    ),
    query<{ key: string; status: string; hp: number | null; hp_min: number | null; hp_max: number | null; naver_grade: string | null; cars: number }>(
      `select s.key, s.status, s.hp, s.hp_min, s.hp_max, s.naver_grade, count(c.id)::int as cars
       from specs s join cars c on c.spec_key = s.key and c.active
       where s.status in ('ambiguous', 'not_found') group by s.key order by cars desc limit 60`,
    ),
    query<{ id: number; created_at: Date; name: string | null; contact: string; contact_method: string; car_id: number | null; comment: string | null; delivered: boolean }>(
      'select * from leads order by id desc limit 30',
    ),
  ]);
  const specCounts = await query<{ status: string; n: number }>('select status, count(*)::int as n from specs group by status');
  const st = stats[0]!;

  return (
    <div className="container-x space-y-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Админка</h1>
        <form action={logout}><button className="btn-ghost !py-2">Выйти</button></form>
      </div>
      {sp.saved && <div className="rounded-xl bg-lime/30 p-3 text-sm font-semibold">Сохранено. Цены пересчитаются в течение пары минут.</div>}

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Авто в базе" value={st.total} />
        <Stat label="С деталями" value={st.detailed} />
        <Stat label="С ценой" value={st.priced} />
        <Stat label="Ждут загрузки" value={st.pending_detail} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-4 text-lg font-bold">Расчёт цены</h2>
          <form action={saveSettings} className="grid gap-3 sm:grid-cols-2">
            <Field name="koreaCostsKrw" label="Расходы по Корее и доставка, ₩" value={s.koreaCostsKrw} />
            <Field name="brokerRub" label="Брокер, СВХ, СБКТС, ЭПТС, порт, ₽" value={s.brokerRub} />
            <Field name="depositKrw" label="Залог, ₩ (пусто — не показывать)" value={s.depositKrw ?? ''} />
            <Field name="inspectionCostKrw" label="Осмотр при отказе, ₩" value={s.inspectionCostKrw} />
            <Field name="freeInspections" label="Бесплатных осмотров" value={s.freeInspections} />
            <Field name="rubKrwOverride" label="Курс вручную, ₩ за 1 ₽ (пусто — Naver)" value={s.rubKrwOverride ?? ''} />
            <button className="btn-dark sm:col-span-2">Сохранить и пересчитать</button>
          </form>
        </section>
        <section className="card p-5">
          <h2 className="mb-4 text-lg font-bold">Курсы и синхронизация</h2>
          <table className="w-full text-sm">
            <tbody>
              {rates.map((r) => (
                <tr key={r.code} className="border-b border-ink/5"><td className="py-1.5">{r.code}</td><td className="font-semibold">{Number(r.value).toFixed(4)}</td><td className="text-xs text-ink/50">{r.source}, {fmt(r.fetched_at)}</td></tr>
              ))}
            </tbody>
          </table>
          <table className="mt-4 w-full text-sm">
            <tbody>
              {jobs.map((j) => (
                <tr key={j.job} className="border-b border-ink/5 align-top">
                  <td className="py-1.5 pr-2">{j.ok === false ? '❌' : j.finished_at ? '✅' : '⏳'} {j.job}</td>
                  <td className="text-xs text-ink/50">{fmt(j.started_at)}</td>
                  <td className="max-w-[220px] truncate text-xs text-ink/60">{JSON.stringify(j.info)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-ink/50">Мощности: {specCounts.map((c) => `${c.status} — ${c.n}`).join(', ')}</p>
        </section>
      </div>

      <section className="card p-5">
        <h2 className="text-lg font-bold">Мощность на проверку</h2>
        <p className="mb-4 mt-1 text-sm text-ink/60">Naver не нашёл комплектацию или вариантов несколько. Пока мощность не подтверждена, расчёт идёт по максимальной (неоднозначные) или цена скрыта (не найдено). Для электромобилей укажите 30‑минутную мощность.</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-xs uppercase text-ink/40"><tr><th>Модель (Encar)</th><th>Статус</th><th>Naver</th><th>Авто</th><th>Л.с.</th></tr></thead>
            <tbody>
              {specs.map((x) => (
                <tr key={x.key} className="border-t border-ink/5">
                  <td className="py-1.5 pr-2 font-mono text-xs">{x.key}</td>
                  <td>{x.status === 'ambiguous' ? `${x.hp_min}–${x.hp_max}` : 'не найдено'}</td>
                  <td className="text-xs">{x.naver_grade ?? '—'}</td>
                  <td>{x.cars}</td>
                  <td>
                    <form action={setSpecHp} className="flex gap-1">
                      <input type="hidden" name="key" value={x.key} />
                      <input name="hp" defaultValue={x.hp ?? ''} className="input !w-20 !py-1" inputMode="numeric" />
                      <button className="btn-dark !px-3 !py-1">OK</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-4 text-lg font-bold">Последние заявки</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-t border-ink/5 align-top">
                  <td className="py-1.5 pr-2">№{l.id}</td>
                  <td className="text-xs text-ink/50">{fmt(l.created_at)}</td>
                  <td>{l.name ?? '—'}</td>
                  <td className="font-semibold">{l.contact_method}: {l.contact}</td>
                  <td>{l.car_id ? <a className="underline" href={`/car/${l.car_id}`}>авто</a> : ''}</td>
                  <td className="max-w-xs text-xs">{l.comment}</td>
                  <td>{l.delivered ? '✓ в Telegram' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function fmt(d: Date): string {
  return new Date(d).toLocaleString('ru-RU', { timeZone: 'Asia/Seoul', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function Box({ children }: { children: React.ReactNode }) {
  return <div className="container-x py-16"><div className="card mx-auto max-w-sm p-6">{children}</div></div>;
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="card p-4"><div className="text-xs text-ink/50">{label}</div><div className="text-2xl font-extrabold">{value.toLocaleString('ru-RU')}</div></div>;
}

function Field({ name, label, value }: { name: string; label: string; value: string | number }) {
  return (
    <label className="block">
      <span className="label !normal-case !tracking-normal">{label}</span>
      <input name={name} defaultValue={String(value)} className="input" />
    </label>
  );
}
