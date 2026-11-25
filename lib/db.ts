import { Pool, PoolClient, QueryResultRow, types } from 'pg';

types.setTypeParser(1082, (v: string) => v); // keep DATE as 'YYYY-MM-DD' (no JS Date tz drift)

const g = globalThis as unknown as { __pool?: Pool };
export const pool: Pool =
  g.__pool ??
  (g.__pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSL === 'require' ? { rejectUnauthorized: false } : undefined,
    max: 10,
  }));

export async function q<T extends QueryResultRow = any>(sql: string, params: unknown[] = []): Promise<T[]> {
  return (await pool.query<T>(sql, params as any[])).rows;
}
export async function q1<T extends QueryResultRow = any>(sql: string, params: unknown[] = []): Promise<T | null> {
  return (await q<T>(sql, params))[0] ?? null;
}
export async function tx<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const c = await pool.connect();
  try {
    await c.query('begin');
    const r = await fn(c);
    await c.query('commit');
    return r;
  } catch (e) {
    await c.query('rollback').catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}
