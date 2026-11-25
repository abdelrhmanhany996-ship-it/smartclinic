// Idempotent demo medical records (run after seed when SEED_DEMO=1).
import './env';
import { pool, q1 } from '../lib/db';
(async () => {
  const p = await q1<any>(`select p.id, p.clinic_id from patients p join clinics c on c.id=p.clinic_id where c.slug='nile-care' and p.full_name='Ahmed Hassan'`);
  if (!p) return console.log('seed-records: demo patient not found, skipping');
  if (await q1('select 1 from prescriptions where patient_id=$1', [p.id])) return console.log('seed-records: already present');
  const doc = await q1<any>(`select id from doctors where clinic_id=$1 and code='A'`, [p.clinic_id]);
  await pool.query(`update patients set birth_date='1988-04-12', gender='male', allergies='Penicillin', chronic_conditions='Type 2 diabetes', blood_type='O+' where id=$1`, [p.id]);
  const ago = (d: number) => new Date(Date.now() - d * 86400000).toISOString();
  const fu = new Date(Date.now() + 9 * 86400000).toISOString().slice(0, 10);
  await pool.query(`insert into prescriptions(clinic_id,patient_id,doctor_id,diagnosis,items,advice,follow_up_date,sent_at,created_at) values
    ($1,$2,$3,'Acute sinusitis',$4,'Drink plenty of fluids. Avoid cold drinks. Return if fever persists beyond 3 days.',$5,$6,$6),
    ($1,$2,$3,'Type 2 diabetes — routine review',$7,'Fasting blood sugar and HbA1c before the next visit.',null,$8,$8)`,
    [p.clinic_id, p.id, doc.id,
     JSON.stringify([{ name: 'Augmentin 1g', dose: '1 tablet', frequency: 'Twice daily', duration: '7 days', notes: 'After meals' }, { name: 'Otrivin nasal spray', dose: '2 puffs', frequency: 'Three times daily', duration: '5 days', notes: '' }]), fu, ago(2),
     JSON.stringify([{ name: 'Metformin 500mg', dose: '1 tablet', frequency: 'Twice daily', duration: '30 days', notes: 'With meals' }]), ago(40)]);
  console.log('seed-records: demo prescriptions added'); await pool.end();
})().catch((e) => { console.error(e); process.exit(1); });
