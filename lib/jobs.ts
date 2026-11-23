// Один «тик» фоновых задач, ограниченный по времени. Вызывается по расписанию (/api/cron)
// или в цикле фоновым процессом (npm run worker). Всё состояние — в базе, тики можно прерывать.
import { query } from './db';
import { refreshRates } from './rates';
import { syncNames, retranslateAll, syncList, syncFullStep, syncDetails, syncSpecs, repriceAll, getState, setState } from '../worker/sync';

const MIN = 60_000;

async function due(key: string, everyMs: number): Promise<boolean> {
  const st = await getState<{ at: string }>(`last:${key}`);
  return !st || Date.now() - new Date(st.at).getTime() >= everyMs;
}

async function mark(key: string): Promise<void> {
  await setState(`last:${key}`, { at: new Date().toISOString() });
}

export async function tick(budgetMs = 50_000): Promise<Record<string, unknown>> {
  const started = Date.now();
  const deadline = started + budgetMs;
  const left = () => deadline - Date.now();
  const out: Record<string, unknown> = {};
  const step = async (name: string, fn: () => Promise<unknown>) => {
    try {
      out[name] = await fn();
    } catch (e) {
      out[name] = { error: String(e).slice(0, 300) };
    }
  };

  if (await due('rates', 60 * MIN)) {
    await step('rates', async () => {
      const r = await refreshRates();
      await query('update cars set price_calc_at = null where active and detail_fetched_at is not null');
      await mark('rates');
      return { rubKrw: r.rubKrwRemit, eurRub: r.eurRub };
    });
  }
  if (await due('names', 24 * 60 * MIN)) {
    await step('names', async () => {
      const r = { ...(await syncNames()), ...(await retranslateAll()) };
      await mark('names');
      return r;
    });
  }
  if (left() > 30_000) await step('list_new', () => syncList());

  // Полный проход: раз в сутки (и сразу, если база пустая), продолжается из тика в тик.
  const scanning = (await getState('full_scan')) != null;
  if (scanning || (await due('full_scan', 24 * 60 * MIN))) {
    if (!scanning) await mark('full_scan');
    if (left() > 20_000) await step('list_full', () => syncFullStep(deadline - 12_000));
  }
  if (left() > 10_000) await step('details', () => syncDetails(deadline - 8_000));
  if (left() > 12_000) await step('specs', () => syncSpecs(deadline - 4_000));
  if (left() > 3_000) await step('reprice', () => repriceAll(true, deadline - 1_500));

  out.ms = Date.now() - started;
  await query(`insert into sync_log (job, started_at, finished_at, ok, info) values ('tick', $1, now(), true, $2)`, [new Date(started), JSON.stringify(out)]);
  await query("delete from sync_log where started_at < now() - interval '3 days'");
  return out;
}
