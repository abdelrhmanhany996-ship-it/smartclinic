'use client';
import { useLive } from '@/lib/client';
import { usePrefs } from './providers';
export interface ClinicData { clinic: any; doctors: any[]; today: string; subscription?: any }
export function useClinic() {
  const r = useLive<ClinicData>('/api/clinic', null);
  const { locale } = usePrefs();
  const docName = (d: any) => (locale === 'ar' && d?.name_ar ? d.name_ar : d?.name);
  const docSpec = (d: any) => (locale === 'ar' && d?.specialty_ar ? d.specialty_ar : d?.specialty);
  return { ...r, docName, docSpec };
}
