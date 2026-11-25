-- Medical record: richer patient profile + prescriptions (روشتة)
alter table patients
  add column birth_date date,
  add column gender text check (gender in ('male','female')),
  add column allergies text,
  add column chronic_conditions text,
  add column blood_type text;

create table prescriptions (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  doctor_id uuid not null references doctors(id) on delete cascade,
  appointment_id uuid references appointments(id) on delete set null,
  diagnosis text,
  items jsonb not null default '[]'::jsonb,      -- [{name,dose,frequency,duration,notes}]
  advice text,
  follow_up_date date,
  sent_at timestamptz,                            -- set when sent to the patient's tracking app
  printed_at timestamptz,
  created_at timestamptz not null default now()
);
create index on prescriptions(patient_id, created_at desc);
create index on prescriptions(clinic_id, created_at desc);
