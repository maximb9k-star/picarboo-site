import { closePool } from '../lib/db';
import { refreshRates } from '../lib/rates';
import { syncNames, upsertList, loadNames, syncDetails, syncSpecs, repriceAll, retranslateAll } from '../worker/sync';
import { fetchList, BASE_QUERY } from '../lib/encar/client';
import { mapListItem, type CarListRow } from '../lib/encar/map';

const step = process.argv[2];
(async () => {
  if (step === 'rates') console.log(await refreshRates());
  if (step === 'names') console.log(await syncNames());
  if (step === 'list') {
    const names = await loadNames();
    const pages = Number(process.argv[3] ?? 3);
    for (let p = 0; p < pages; p++) {
      const r = await fetchList(BASE_QUERY, p * 200, 200);
      const rows = r.SearchResults.map((x) => mapListItem(x, names)).filter((x): x is CarListRow => !!x);
      await upsertList(rows);
      console.log('page', p, rows.length, 'of', r.Count);
    }
  }
  if (step === 'details') console.log(await syncDetails(Number(process.argv[3] ?? 50)));
  if (step === 'specs') console.log(await syncSpecs(Number(process.argv[3] ?? 10)));
  if (step === 'retranslate') console.log(await retranslateAll());
  if (step === 'reprice') console.log(await repriceAll(false));
})().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => closePool());
