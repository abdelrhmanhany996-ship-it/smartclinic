-- Store every phone in international format (country code + number, digits only) so the same number never exists twice.
-- Rows whose normalised number already belongs to another patient are left untouched (resolve manually).
update patients p set phone = c.cc || substr(p.phone, 2)
from (select id, coalesce(settings->>'country_code', '20') as cc from clinics) c
where c.id = p.clinic_id and p.phone ~ '^0[0-9]+$'
  and not exists (select 1 from patients q where q.clinic_id = p.clinic_id and q.phone = c.cc || substr(p.phone, 2));
