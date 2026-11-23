import pg from 'pg';

// bigint (int8) возвращаем числом: суммы в рублях/вонах далеко от 2^53.
pg.types.setTypeParser(20, (v) => Number(v));
pg.types.setTypeParser(1700, (v) => Number(v));

const globalForPool = globalThis as unknown as { __pgPool?: pg.Pool };

export function getPool(): pg.Pool {
  if (!globalForPool.__pgPool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL не задан');
    // Supabase (пулер) требует TLS; на Vercel держим мало соединений на экземпляр функции.
    const ssl = process.env.DATABASE_SSL === '1' || /supabase\.(co|com)/.test(url) ? { rejectUnauthorized: false } : undefined;
    globalForPool.__pgPool = new pg.Pool({ connectionString: url, ssl, max: process.env.VERCEL ? 3 : 10, idleTimeoutMillis: 10_000 });
  }
  return globalForPool.__pgPool;
}

export async function query<T extends pg.QueryResultRow>(text: string, params: unknown[] = []): Promise<T[]> {
  const res = await getPool().query<T>(text, params);
  return res.rows;
}

export async function closePool(): Promise<void> {
  if (globalForPool.__pgPool) {
    await globalForPool.__pgPool.end();
    globalForPool.__pgPool = undefined;
  }
}
