import { route } from '@/lib/api';
import { getClinic } from '@/lib/service';
export const GET = route(['super_admin', 'receptionist', 'doctor'], async ({ user }) => {
  const clinic = user.clinicId ? await getClinic(user.clinicId) : null;
  return { user, clinic: clinic && { id: clinic.id, name: clinic.name, nameAr: clinic.name_ar, brandColor: clinic.brand_color, language: clinic.settings.language, timezone: clinic.timezone } };
});
