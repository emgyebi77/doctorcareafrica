create extension if not exists "pgcrypto";

do $$
begin
  create type app_role as enum ('superadmin', 'admin', 'doctor', 'nurse', 'staff', 'patient');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  date_of_birth date,
  gender text check (gender in ('male', 'female', 'other') or gender is null),
  blood_type text,
  address text,
  allergies text[],
  medical_history jsonb,
  insurance_id text,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relationship text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.doctors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  specialization text not null,
  bio text,
  license_number text,
  consultation_fee numeric,
  avatar_url text,
  is_available boolean default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  scheduled_date date not null,
  scheduled_time time not null,
  duration_minutes integer default 30,
  type text not null,
  status text not null,
  notes text,
  cancellation_reason text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointment_type_check
    check (type in ('checkup', 'consultation', 'follow-up', 'emergency', 'procedure')),
  constraint appointment_status_check
    check (status in ('scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'))
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  data jsonb,
  status text not null default 'unread',
  created_at timestamptz not null default now(),
  constraint notification_status_check check (status in ('unread', 'read'))
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists patients_set_updated_at on public.patients;
create trigger patients_set_updated_at
before update on public.patients
for each row execute function public.set_updated_at();

drop trigger if exists doctors_set_updated_at on public.doctors;
create trigger doctors_set_updated_at
before update on public.doctors
for each row execute function public.set_updated_at();

drop trigger if exists appointments_set_updated_at on public.appointments;
create trigger appointments_set_updated_at
before update on public.appointments
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, first_name, last_name, email, phone, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', 'Unknown'),
    coalesce(new.raw_user_meta_data->>'last_name', 'Unknown'),
    coalesce(new.email, ''),
    new.phone,
    new.raw_user_meta_data->>'avatar_url'
  );

  insert into public.user_roles (user_id, role)
  values (new.id, 'patient');

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create index if not exists patients_user_id_idx on public.patients (user_id);
create unique index if not exists patients_user_id_unique on public.patients (user_id) where user_id is not null;
create index if not exists doctors_user_id_idx on public.doctors (user_id);
create unique index if not exists doctors_user_id_unique on public.doctors (user_id) where user_id is not null;
create index if not exists appointments_patient_id_idx on public.appointments (patient_id);
create index if not exists appointments_doctor_id_idx on public.appointments (doctor_id);
create index if not exists appointments_status_idx on public.appointments (status);
create index if not exists notifications_user_id_idx on public.notifications (user_id);

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.patients enable row level security;
alter table public.doctors enable row level security;
alter table public.appointments enable row level security;
alter table public.notifications enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles
for select
using (auth.uid() = user_id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
on public.profiles
for insert
with check (auth.uid() = user_id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles
for update
using (auth.uid() = user_id);

drop policy if exists user_roles_select_own on public.user_roles;
create policy user_roles_select_own
on public.user_roles
for select
using (auth.uid() = user_id);

drop policy if exists patients_select_own on public.patients;
create policy patients_select_own
on public.patients
for select
using (auth.uid() = user_id);

drop policy if exists patients_insert_own on public.patients;
create policy patients_insert_own
on public.patients
for insert
with check (auth.uid() = user_id);

drop policy if exists patients_update_own on public.patients;
create policy patients_update_own
on public.patients
for update
using (auth.uid() = user_id);

drop policy if exists doctors_select_own on public.doctors;
create policy doctors_select_own
on public.doctors
for select
using (auth.uid() = user_id);

drop policy if exists doctors_insert_own on public.doctors;
create policy doctors_insert_own
on public.doctors
for insert
with check (auth.uid() = user_id);

drop policy if exists doctors_update_own on public.doctors;
create policy doctors_update_own
on public.doctors
for update
using (auth.uid() = user_id);

drop policy if exists appointments_select_creator on public.appointments;
create policy appointments_select_creator
on public.appointments
for select
using (created_by = auth.uid());

drop policy if exists appointments_insert_creator on public.appointments;
create policy appointments_insert_creator
on public.appointments
for insert
with check (created_by = auth.uid());

drop policy if exists appointments_update_creator on public.appointments;
create policy appointments_update_creator
on public.appointments
for update
using (created_by = auth.uid());

drop policy if exists notifications_select_recipient on public.notifications;
create policy notifications_select_recipient
on public.notifications
for select
using (auth.uid() = user_id);

drop policy if exists notifications_update_recipient on public.notifications;
create policy notifications_update_recipient
on public.notifications
for update
using (auth.uid() = user_id);
