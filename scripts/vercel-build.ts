// Runs on Vercel before `next build`: applies migrations (and optional demo seed) when DATABASE_URL is set.
import { execSync } from 'child_process';
const run = (c: string) => execSync(c, { stdio: 'inherit' });
const { DATABASE_POOL_URL: _pool, ...dbEnv } = process.env; // migrations/seeds use the direct/session URL, never the transaction pooler
const runDb = (c: string) => execSync(c, { stdio: 'inherit', env: dbEnv });
if (process.env.DATABASE_URL) {
  runDb('npx tsx scripts/migrate.ts');
  runDb('npx tsx scripts/create-admin.ts');
  if (process.env.SEED_DEMO === '1') { runDb('npx tsx scripts/seed.ts'); runDb('npx tsx scripts/seed-records.ts'); }
} else console.warn('⚠ DATABASE_URL not set — skipping migrations. Add it in Vercel → Settings → Environment Variables and redeploy.');
run('npx next build');
