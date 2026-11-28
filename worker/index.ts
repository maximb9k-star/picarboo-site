// Фоновый процесс для своего сервера (Docker): крутит тики без перерыва.
// На Vercel то же самое делает /api/cron по расписанию из Supabase (pg_cron).
import { closePool } from '../lib/db';
import { migrate } from '../scripts/migrate';
import { tick } from '../lib/jobs';
import { applyMildHybridRules } from './sync';

async function main(): Promise<void> {
  await migrate();
  console.log('mild hybrids:', JSON.stringify(await applyMildHybridRules()));
  const once = process.argv.includes('--once');
  for (;;) {
    const r = await tick(once ? 120_000 : 55_000);
    console.log(new Date().toISOString(), JSON.stringify(r));
    if (once) return;
    await new Promise((res) => setTimeout(res, 2000));
  }
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => closePool());
