// Runs on Vercel before `next build`: applies migrations (and optional demo seed) when DATABASE_URL is set.
import { execSync } from 'child_process';
const run = (c: string) => execSync(c, { stdio: 'inherit' });
if (process.env.DATABASE_URL) {
  run('npx tsx scripts/migrate.ts');
  run('npx tsx scripts/create-admin.ts');
  if (process.env.SEED_DEMO === '1') run('npx tsx scripts/seed.ts');
} else console.warn('⚠ DATABASE_URL not set — skipping migrations. Add it in Vercel → Settings → Environment Variables and redeploy.');
run('npx next build');
