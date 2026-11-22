// Фоновый процесс: держит каталог, курсы и цены в актуальном состоянии.
// Запуск: npm run worker (постоянно) или npm run sync:once (один проход, для проверки).
import { closePool } from '../lib/db';
import { migrate } from '../scripts/migrate';
import { refreshRates } from '../lib/rates';
import { logJob, syncNames, syncList, syncFull, syncDetails, syncSpecs, repriceAll, retranslateAll } from './sync';

const MIN = 60_000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Job { name: string; every: number; run: () => Promise<unknown>; last: number }

const jobs: Job[] = [
  { name: 'rates', every: 60 * MIN, last: 0, run: async () => { await refreshRates(); return repriceAll(false); } },
  { name: 'names', every: 24 * 60 * MIN, last: 0, run: async () => ({ ...(await syncNames()), ...(await retranslateAll()) }) },
  { name: 'list_full', every: 3 * 60 * MIN, last: 0, run: () => syncFull() },
  { name: 'list_new', every: 10 * MIN, last: 0, run: () => syncList() },
  { name: 'details', every: 0, last: 0, run: () => syncDetails(300) },
  { name: 'specs', every: 0, last: 0, run: () => syncSpecs(20) },
  { name: 'reprice', every: 2 * MIN, last: 0, run: () => repriceAll(true) },
];

async function runJob(j: Job): Promise<void> {
  try {
    const info = await logJob(j.name, j.run);
    console.log(new Date().toISOString(), j.name, JSON.stringify(info));
  } catch (e) {
    console.error(new Date().toISOString(), j.name, 'ошибка:', e);
  }
  j.last = Date.now();
}

async function main(): Promise<void> {
  await migrate();
  if (process.argv.includes('--once')) {
    for (const name of ['rates', 'names', 'list_new', 'details', 'specs', 'reprice']) {
      const j = jobs.find((x) => x.name === name)!;
      await runJob(j);
    }
    return;
  }
  // Первым делом — курсы и названия, без них цены и переводы не посчитать.
  for (const name of ['rates', 'names']) await runJob(jobs.find((x) => x.name === name)!);
  for (;;) {
    let ran = false;
    for (const j of jobs) {
      if (j.every > 0 && Date.now() - j.last < j.every) continue;
      await runJob(j);
      ran = true;
    }
    if (!ran) await sleep(5000);
  }
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => closePool());
