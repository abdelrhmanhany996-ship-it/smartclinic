import './env';
import fs from 'fs';
import path from 'path';
import { pool } from '../lib/db';

async function main() {
  if (process.argv.includes('--reset')) {
    await pool.query('drop schema public cascade; create schema public;');
    console.log('schema reset');
  }
  await pool.query('create table if not exists _migrations(name text primary key, applied_at timestamptz default now())');
  const dir = path.join(process.cwd(), 'db/migrations');
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.sql')).sort()) {
    const done = await pool.query('select 1 from _migrations where name=$1', [f]);
    if (done.rowCount) continue;
    const c = await pool.connect();
    try {
      await c.query('begin'); await c.query(fs.readFileSync(path.join(dir, f), 'utf8'));
      await c.query('insert into _migrations(name) values($1)', [f]); await c.query('commit');
      console.log('applied', f);
    } catch (e) { await c.query('rollback'); throw e; } finally { c.release(); }
  }
  await pool.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
