-- SmartClinic core schema (plain PostgreSQL 14+; also valid on Supabase)
create extension if not exists pgcrypto;

create table clinics (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  name_ar text,
  tagline text default 'Less Waiting. Better Care.',
  address text, phone text, email text,
  brand_color text not null default '#087E83',
  timezone text not null default 'Africa/Cairo',
  status text not null default 'active' check (status in ('active','suspended')),
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null unique references clinics(id) on delete cascade,
  plan text not null default 'trial' check (plan in ('trial','starter','pro','enterprise')),
  status text not null default 'active' check (status in ('active','past_due','cancelled','trialing')),
  max_doctors int not null default 3,
  price_monthly numeric(10,2) not null default 0,
  current_period_end date not null default (current_date + 30),
  created_at timestamptz not null default now()
);

create table users (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references clinics(id) on delete cascade,
  role text not null check (role in ('super_admin','receptionist','doctor')),
  email text not null unique,
  password_hash text not null,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check ((role = 'super_admin') = (clinic_id is null))
);
create index on users(clinic_id);

create table doctors (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  name text not null,
  name_ar text,
  specialty text,
  specialty_ar text,
  code char(1) not null,
  avg_duration_min int not null default 15 check (avg_duration_min between 3 and 180),
  work_start time not null default '09:00',
  work_end time not null default '17:00',
  break_start time, break_end time,
  work_days int[] not null default '{0,1,2,3,4,6}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (clinic_id, code)
);
create index on doctors(clinic_id);

create table patients (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  full_name text not null,
  phone text not null,
  channel text not null default 'whatsapp' check (channel in ('whatsapp','telegram','link')),
  notes text,
  created_at timestamptz not null default now(),
  unique (clinic_id, phone)
);
create index on patients(clinic_id, full_name);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  doctor_id uuid not null references doctors(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  appt_date date not null,
  appt_time time not null,
  visit_type text not null default 'consultation',
  channel text not null default 'whatsapp',
  ticket_seq int not null,
  ticket_code text not null,
  token text not null unique,
  status text not null default 'booked'
    check (status in ('booked','checked_in','in_consultation','completed','skipped','cancelled','no_show')),
  sort_key double precision not null,
  checked_in_at timestamptz, started_at timestamptz, ended_at timestamptz,
  notified_upcoming boolean not null default false,
  notified_turn boolean not null default false,
  notified_est int,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (doctor_id, appt_date, ticket_seq)
);
create index on appointments(clinic_id, appt_date);
create index on appointments(doctor_id, appt_date, status);
create index on appointments(patient_id);

create table notifications (
  id bigserial primary key,
  clinic_id uuid not null references clinics(id) on delete cascade,
  appointment_id uuid references appointments(id) on delete cascade,
  audience text not null check (audience in ('patient','staff')),
  kind text not null,
  title text not null, body text not null,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index on notifications(appointment_id, id);
create index on notifications(clinic_id, audience, id desc);

create table push_subscriptions (
  id bigserial primary key,
  appointment_id uuid not null references appointments(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null, auth text not null,
  created_at timestamptz not null default now()
);

create table audit_logs (
  id bigserial primary key,
  clinic_id uuid references clinics(id) on delete set null,
  user_id uuid references users(id) on delete set null,
  action text not null, entity text not null, entity_id text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index on audit_logs(clinic_id, id desc);
