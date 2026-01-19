create or replace view public.doctors_public as
select
  id,
  first_name,
  last_name,
  specialization,
  avatar_url,
  is_available,
  created_at,
  updated_at
from public.doctors;

grant select on public.doctors_public to anon, authenticated;
