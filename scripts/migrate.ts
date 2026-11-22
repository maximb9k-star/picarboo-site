import fs from 'node:fs';
import path from 'node:path';
import { getPool, closePool } from '../lib/db';

export async function migrate(): Promise<string[]> {
  const pool = getPool();
  await pool.query('create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())');
  const dir = path.join(import.meta.dirname, '..', 'db', 'migrations');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  const applied = new Set((await pool.query<{ name: string }>('select name from schema_migrations')).rows.map((r) => r.name));
  const done: string[] = [];
  for (const f of files) {
    if (applied.has(f)) continue;
    const sql = fs.readFileSync(path.join(dir, f), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('begin');
      await client.query(sql);
      await client.query('insert into schema_migrations (name) values ($1)', [f]);
      await client.query('commit');
      done.push(f);
    } catch (e) {
      await client.query('rollback');
      throw e;
    } finally {
      client.release();
    }
  }
  return done;
}

if (process.argv[1] && import.meta.filename === path.resolve(process.argv[1])) {
  migrate()
    .then((d) => console.log(d.length ? `Применены миграции: ${d.join(', ')}` : 'Новых миграций нет'))
    .catch((e) => { console.error(e); process.exitCode = 1; })
    .finally(() => closePool());
}
