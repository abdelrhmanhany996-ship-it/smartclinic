// Creates the first super admin from ADMIN_EMAIL / ADMIN_PASSWORD (never overwrites an existing account).
import './env';
import { pool, q1 } from '../lib/db';
import { hash } from '../lib/auth';
(async () => {
  const email = process.env.ADMIN_EMAIL, pw = process.env.ADMIN_PASSWORD;
  if (!email || !pw) return console.log('create-admin: ADMIN_EMAIL/ADMIN_PASSWORD not set, skipping');
  if (await q1('select 1 from users where lower(email)=lower($1)', [email])) console.log('create-admin: account already exists, left unchanged');
  else { await pool.query(`insert into users(role,email,password_hash,name) values('super_admin',$1,$2,$3)`, [email, hash(pw), process.env.ADMIN_NAME || 'Platform Owner']); console.log('create-admin: super admin created for', email); }
  await pool.end();
})().catch((e) => { console.error(e); process.exit(1); });
